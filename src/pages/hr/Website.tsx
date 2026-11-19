import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox as InboxIcon, Globe, Loader2, UserPlus, FileText, Phone, MessageCircle, Mail, Plus, Pencil, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, waLink, DEPARTMENT_NAMES } from "@/lib/crm";
import { parseEnquiryType } from "@/lib/site";
import { useCrm } from "@/lib/hr/model";
import { applicantRef, queryRef, syncWebsiteLeads, parseEnquiryFields } from "@/lib/hr/websiteSync";
import { EmptyState, NativeSelect, PageHeader, Pill, useAction } from "@/components/hr/ui";
import type { Database } from "@/integrations/supabase/types";

type Applicant = Database["public"]["Tables"]["applicants"]["Row"] & { jobs: { title: string } | null };
type Query = Database["public"]["Tables"]["queries"]["Row"];
type PublicJob = Database["public"]["Tables"]["jobs"]["Row"];

const TYPE_TONE: Record<string, string> = {
  "Job Seeker": "bg-blue-100 text-blue-800 border-blue-200",
  "Hiring Requirement": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Visa & Documentation": "bg-amber-100 text-amber-800 border-amber-200",
  "HR Consultancy": "bg-purple-100 text-purple-800 border-purple-200",
  General: "bg-muted text-muted-foreground border-border",
};

/* ================================================================ Inbox */

export const Inbox = () => {
  const crm = useCrm();
  const run = useAction();
  const { toast } = useToast();
  const [tab, setTab] = useState("applications");
  const [syncing, setSyncing] = useState(false);
  const imported = new Set(crm.candidates.map((c) => c.source_ref).filter(Boolean));

  const apps = useQuery({ queryKey: ["web", "applicants"], queryFn: async () => {
    const { data, error } = await supabase.from("applicants").select("*, jobs(title)").order("uploaded_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as Applicant[]) || [];
  } });
  const queries = useQuery({ queryKey: ["web", "queries"], queryFn: async () => {
    const { data, error } = await supabase.from("queries").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Query[]) || [];
  } });

  const add = async (only: { applicantIds?: string[]; queryIds?: string[] }) => {
    const n = await run(() => syncWebsiteLeads({ only }), { refresh: ["crm_candidates", "crm_applications"] });
    if (n !== undefined) toast({ title: n ? "Added to candidates" : "Already in candidates" });
  };

  const syncAll = async () => {
    setSyncing(true);
    const n = await run(() => syncWebsiteLeads(), { refresh: ["crm_candidates", "crm_applications"] });
    setSyncing(false);
    if (n !== undefined) toast({ title: n ? `${n} new lead(s) added to candidates` : "Everything is already imported" });
  };

  const newApps = (apps.data || []).filter((a) => !imported.has(applicantRef(a.id))).length;
  const seekerQueries = (queries.data || []).filter((q) => parseEnquiryType(q.message) === "Job Seeker");
  const newSeekers = seekerQueries.filter((q) => !imported.has(queryRef(q.id))).length;
  const list = tab === "applications" ? null : (queries.data || []).filter((q) => tab === "enquiries" || parseEnquiryType(q.message) === "Hiring Requirement");

  const Contact = ({ phone, email }: { phone?: string | null; email?: string | null }) => (
    <div className="flex gap-1">
      {phone && <Button size="icon" variant="ghost" className="h-8 w-8" asChild><a href={`tel:${phone.replace(/\s/g, "")}`} title="Call"><Phone className="w-4 h-4" /></a></Button>}
      {phone && <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" asChild><a href={waLink(phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a></Button>}
      {email && email !== "Not provided" && <Button size="icon" variant="ghost" className="h-8 w-8" asChild><a href={`mailto:${email}`} title="Email"><Mail className="w-4 h-4" /></a></Button>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Website leads" subtitle="Job applications, CVs and enquiries submitted on albaenterprise.in. Add job seekers to your candidate database in one click."
        actions={<Button onClick={syncAll} disabled={syncing}>{syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}Add all new job seekers ({newApps + newSeekers})</Button>} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="applications">Job applications {newApps ? `(${newApps} new)` : ""}</TabsTrigger>
          <TabsTrigger value="hiring">Hiring requests</TabsTrigger>
          <TabsTrigger value="enquiries">All enquiries</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "applications" ? (
        apps.isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : !apps.data?.length ? <EmptyState icon={InboxIcon} title="No website applications yet" /> : (
          <div className="rounded-xl border bg-card divide-y">
            {apps.data.map((a) => {
              const done = imported.has(applicantRef(a.id));
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-medium">{a.name} <span className="text-muted-foreground font-normal text-sm">applied for</span> {a.jobs?.title ?? "a vacancy"}</p>
                    <p className="text-xs text-muted-foreground">{[a.phone, a.email, formatDateTime(a.uploaded_at)].filter(Boolean).join(" · ")}</p>
                  </div>
                  {a.cv_url && <Button size="sm" variant="ghost" asChild><a href={a.cv_url} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4 mr-1" />CV</a></Button>}
                  <Contact phone={a.phone} email={a.email} />
                  {done ? <Pill tone="bg-emerald-50 text-emerald-700 border-emerald-200"><Check className="w-3 h-3 mr-1" />In candidates</Pill>
                    : <Button size="sm" variant="outline" onClick={() => add({ applicantIds: [a.id] })}><UserPlus className="w-4 h-4 mr-1" />Add to candidates</Button>}
                </div>
              );
            })}
          </div>
        )
      ) : queries.isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : !list?.length ? <EmptyState icon={InboxIcon} title="Nothing here yet" /> : (
        <div className="space-y-3">
          {list.map((q) => {
            const type = parseEnquiryType(q.message);
            const { fields, note } = parseEnquiryFields(q.message);
            const done = imported.has(queryRef(q.id));
            return (
              <div key={q.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Pill tone={TYPE_TONE[type] ?? TYPE_TONE.General}>{type}</Pill>
                  <span className="font-medium">{q.name}</span>
                  <span className="text-xs text-muted-foreground">{[q.phone, q.email !== "Not provided" ? q.email : null].filter(Boolean).join(" · ")}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(q.created_at)}</span>
                </div>
                <div className="mt-2 text-sm grid sm:grid-cols-2 gap-x-6">
                  {Object.entries(fields).map(([k, v]) => <p key={k}><span className="text-muted-foreground">{k}:</span> {v}</p>)}
                </div>
                {note && <p className="mt-2 text-sm whitespace-pre-wrap">{note}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Contact phone={q.phone} email={q.email} />
                  {q.cv_url && <Button size="sm" variant="ghost" asChild><a href={q.cv_url} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4 mr-1" />CV</a></Button>}
                  {type === "Job Seeker" && (done ? <Pill tone="bg-emerald-50 text-emerald-700 border-emerald-200"><Check className="w-3 h-3 mr-1" />In candidates</Pill>
                    : <Button size="sm" variant="outline" onClick={() => add({ queryIds: [q.id] })}><UserPlus className="w-4 h-4 mr-1" />Add to candidates</Button>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ========================================================== Website jobs */

const emptyJob = { title: "", category: "", location: "", salary: "", description: "", status: "open" };

export const WebsiteJobs = () => {
  const run = useAction();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [edit, setEdit] = useState<(typeof emptyJob & { id?: string }) | null>(null);
  const jobs = useQuery({ queryKey: ["web", "jobs"], queryFn: async () => {
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PublicJob[]) || [];
  } });
  const counts = useQuery({ queryKey: ["web", "applicant-counts"], queryFn: async () => {
    const { data } = await supabase.from("applicants").select("job_id");
    const m = new Map<string, number>();
    (data || []).forEach((r) => m.set(r.job_id, (m.get(r.job_id) || 0) + 1));
    return m;
  } });
  const reload = () => qc.invalidateQueries({ queryKey: ["web"] });

  const save = async () => {
    if (!edit) return;
    if (edit.title.trim().length < 2 || edit.description.trim().length < 10) { toast({ title: "Add a title and a description (10+ characters)", variant: "destructive" }); return; }
    const row = { title: edit.title.trim(), category: edit.category || "Hospitality", country: "India", location: edit.location.trim() || null, salary: edit.salary.trim() || null, description: edit.description.trim(), status: edit.status };
    const ok = await run(async () => {
      const { error } = edit.id ? await supabase.from("jobs").update(row).eq("id", edit.id) : await supabase.from("jobs").insert(row);
      if (error) throw error;
      return true;
    }, { success: edit.id ? "Job post updated" : "Job posted on the website", refresh: ["crm_jobs"] });
    if (ok) { setEdit(null); reload(); }
  };

  const toggle = async (j: PublicJob) => {
    await run(async () => { const { error } = await supabase.from("jobs").update({ status: j.status === "open" ? "closed" : "open" }).eq("id", j.id); if (error) throw error; }, { success: j.status === "open" ? "Hidden from website" : "Visible on website", refresh: [] });
    reload();
  };

  const remove = async (j: PublicJob) => {
    if (!confirm(`Delete the job post "${j.title}"? Applications for it will also be removed. Consider closing it instead.`)) return;
    await run(async () => { const { error } = await supabase.from("jobs").delete().eq("id", j.id); if (error) throw error; }, { success: "Deleted", refresh: ["crm_jobs"] });
    reload();
  };

  return (
    <div>
      <PageHeader title="Website job posts" subtitle="Vacancies shown on the public Hotel Jobs page. You can also publish any requirement directly from its page."
        actions={<Button onClick={() => setEdit({ ...emptyJob })}><Plus className="w-4 h-4 mr-1" />New job post</Button>} />
      {jobs.isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : !jobs.data?.length ? <EmptyState icon={Globe} title="No job posts" action={<Button onClick={() => setEdit({ ...emptyJob })}>Post a job</Button>} /> : (
        <div className="rounded-xl border bg-card divide-y">
          {jobs.data.map((j) => (
            <div key={j.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{j.title}</p>
                <p className="text-xs text-muted-foreground">{[j.category, j.location || j.country, j.salary && `₹ ${j.salary}`].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="text-xs text-muted-foreground">{counts.data?.get(j.id) || 0} applications</span>
              <button onClick={() => toggle(j)}><Pill tone={j.status === "open" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground border-border"}>{j.status === "open" ? "Live" : "Hidden"}</Pill></button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEdit({ id: j.id, title: j.title, category: j.category, location: j.location || "", salary: j.salary || "", description: j.description, status: j.status })}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-700" onClick={() => remove(j)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit job post" : "New job post"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Job title</Label><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
              <div><Label>Department</Label><NativeSelect value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} options={DEPARTMENT_NAMES} placeholder="Select" /></div>
              <div><Label>Location</Label><Input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} placeholder="City" /></div>
              <div><Label>Salary (₹/month)</Label><Input value={edit.salary} onChange={(e) => setEdit({ ...edit, salary: e.target.value })} /></div>
              <div><Label>Visibility</Label><NativeSelect value={edit.status} onChange={(v) => setEdit({ ...edit, status: v })} options={[{ value: "open", label: "Live on website" }, { value: "closed", label: "Hidden" }]} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={5} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
