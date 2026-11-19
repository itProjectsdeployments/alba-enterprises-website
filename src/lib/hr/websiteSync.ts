import { supabase } from "@/integrations/supabase/client";
import { parseEnquiryType } from "@/lib/site";
import { cleanPhone, normalizeDepartment } from "@/lib/crm";
import type { Database } from "@/integrations/supabase/types";

type Insert = Database["public"]["Tables"]["crm_candidates"]["Insert"];

/** Splits a "[Type]\nKey: value\n..." enquiry message into fields and free text. */
export const parseEnquiryFields = (message: string) => {
  const fields: Record<string, string> = {};
  const notes: string[] = [];
  for (const l of message.split("\n").slice(1)) {
    const m = l.match(/^([A-Za-z /]+):\s*(.+)$/);
    if (m) fields[m[1].trim()] = m[2].trim();
    else if (l.trim()) notes.push(l.trim());
  }
  return { fields, note: notes.join("\n") };
};

export const applicantRef = (id: string) => `applicant:${id}`;
export const queryRef = (id: string) => `query:${id}`;

/**
 * Copies website job applications and "Job Seeker" enquiries into the candidate
 * database. Each lead is imported once (tracked by source_ref). If an application
 * was for a vacancy published from a requirement, the candidate is also added
 * to that requirement's pipeline.
 */
export const syncWebsiteLeads = async (opts: { only?: { applicantIds?: string[]; queryIds?: string[] } } = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  let appsQ = supabase.from("applicants").select("*, jobs(id, title, category, location)").order("uploaded_at", { ascending: false });
  let queriesQ = supabase.from("queries").select("*").order("created_at", { ascending: false });
  if (opts.only?.applicantIds) appsQ = appsQ.in("id", opts.only.applicantIds.length ? opts.only.applicantIds : ["00000000-0000-0000-0000-000000000000"]);
  if (opts.only?.queryIds) queriesQ = queriesQ.in("id", opts.only.queryIds.length ? opts.only.queryIds : ["00000000-0000-0000-0000-000000000000"]);
  const [{ data: apps, error: e1 }, { data: queries, error: e2 }] = await Promise.all([appsQ, queriesQ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const records: Insert[] = [];
  const publicJobFor = new Map<string, string>();
  for (const a of apps || []) {
    const job = (a as unknown as { jobs: { id: string; title?: string; category?: string; location?: string } | null }).jobs;
    if (job?.id) publicJobFor.set(applicantRef(a.id), job.id);
    records.push({
      source_ref: applicantRef(a.id),
      full_name: a.name,
      phone: a.phone ? cleanPhone(a.phone) : null,
      email: a.email || null,
      job_role: job?.title ?? null,
      department: job?.category ? normalizeDepartment(job.category) : null,
      city: job?.location ?? null,
      cv_url: a.cv_url || null,
      source: "Website",
      status: "New",
      notes: `Applied online for "${job?.title ?? "a vacancy"}" on ${new Date(a.uploaded_at).toLocaleDateString("en-IN")}.`,
      created_by: user?.id ?? null,
    });
  }
  for (const q of queries || []) {
    if (parseEnquiryType(q.message) !== "Job Seeker") continue;
    const { fields, note } = parseEnquiryFields(q.message);
    records.push({
      source_ref: queryRef(q.id),
      full_name: q.name,
      phone: q.phone ? cleanPhone(q.phone) : null,
      email: q.email && q.email !== "Not provided" ? q.email : null,
      job_role: fields["Role / Designation"] ?? null,
      department: fields.Department ? normalizeDepartment(fields.Department) : null,
      experience: fields.Experience ?? null,
      city: fields["Current City"] ?? null,
      cv_url: q.cv_url || null,
      source: "Website",
      status: "New",
      notes: [note, fields["Preferred Location"] ? `Preferred location: ${fields["Preferred Location"]}` : ""].filter(Boolean).join("\n") || null,
      created_by: user?.id ?? null,
    });
  }
  if (!records.length) return 0;

  const { data: inserted, error } = await supabase
    .from("crm_candidates")
    .upsert(records, { onConflict: "source_ref", ignoreDuplicates: true })
    .select("id, source_ref");
  if (error) throw error;

  // Link applications for published requirements straight into that pipeline.
  if (inserted?.length && publicJobFor.size) {
    const { data: crmJobs } = await supabase.from("crm_jobs").select("id, public_job_id").not("public_job_id", "is", null);
    const crmJobFor = new Map((crmJobs || []).map((j) => [j.public_job_id as string, j.id]));
    const links = inserted
      .map((c) => ({ c, pj: publicJobFor.get(c.source_ref || "") }))
      .filter((x) => x.pj && crmJobFor.has(x.pj))
      .map((x) => ({ job_id: crmJobFor.get(x.pj!)!, candidate_id: x.c.id, stage: "Sourced", created_by: user?.id ?? null }));
    if (links.length) await supabase.from("crm_applications").upsert(links, { onConflict: "job_id,candidate_id", ignoreDuplicates: true });
  }
  return inserted?.length ?? 0;
};
