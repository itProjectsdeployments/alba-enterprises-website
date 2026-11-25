import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ClipboardList, Search, UserCheck, Video, FileCheck2, FileSignature, HeartHandshake, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toISODate, todayISO } from "@/lib/crm";

type Tables = Database["public"]["Tables"];
export type Client = Tables["crm_clients"]["Row"];
export type Job = Tables["crm_jobs"]["Row"];
export type Candidate = Tables["crm_candidates"]["Row"];
export type Application = Tables["crm_applications"]["Row"];
export type Interview = Tables["crm_interviews"]["Row"];
export type CrmDocument = Tables["crm_documents"]["Row"];
export type Followup = Tables["crm_followups"]["Row"];
export type Task = Tables["crm_tasks"]["Row"];
export type Activity = Tables["crm_activities"]["Row"];

export type CrmTable =
  | "crm_clients" | "crm_jobs" | "crm_candidates" | "crm_applications" | "crm_interviews"
  | "crm_documents" | "crm_followups" | "crm_tasks" | "crm_activities";

/** Untyped handle for the generic helpers below (table names are passed in at runtime). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

// ---------------------------------------------------------------------------
// The 7-step process
// ---------------------------------------------------------------------------

export interface ProcessStep {
  n: number;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  { n: 1, title: "Requirement Analysis", short: "Requirements", description: "Understand the property, departments, positions and timelines.", icon: ClipboardList, path: "/hr/requirements" },
  { n: 2, title: "Candidate Sourcing", short: "Sourcing", description: "Find suitable candidates from the network and database.", icon: Search, path: "/hr/candidates" },
  { n: 3, title: "Screening & Shortlisting", short: "Screening", description: "Skill, experience, communication and grooming checks.", icon: UserCheck, path: "/hr/screening" },
  { n: 4, title: "Interviews & Trials", short: "Interviews", description: "Client interviews plus cooking or service trials.", icon: Video, path: "/hr/interviews" },
  { n: 5, title: "Document Verification", short: "Documents", description: "Check documents, experience and references.", icon: FileCheck2, path: "/hr/documents" },
  { n: 6, title: "Offer & Joining", short: "Offers", description: "Coordinate offers, joining dates and reporting.", icon: FileSignature, path: "/hr/offers" },
  { n: 7, title: "Follow-up & Support", short: "Follow-ups", description: "Support after joining to ensure client satisfaction.", icon: HeartHandshake, path: "/hr/followups" },
];

/** Pipeline stages for a candidate on a requirement, mapped to the process step they belong to. */
export const STAGES = [
  { value: "Sourced", step: 2, tone: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  { value: "Screening", step: 3, tone: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  { value: "Shortlisted", step: 3, tone: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  { value: "CV Sent to Client", step: 3, tone: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  { value: "Interview / Trial", step: 4, tone: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { value: "Documents", step: 5, tone: "bg-cyan-100 text-cyan-800 border-cyan-200", dot: "bg-cyan-500" },
  { value: "Offer", step: 6, tone: "bg-lime-100 text-lime-800 border-lime-200", dot: "bg-lime-500" },
  { value: "Joined", step: 6, tone: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  { value: "Rejected", step: 0, tone: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" },
  { value: "Dropped", step: 0, tone: "bg-zinc-100 text-zinc-600 border-zinc-200", dot: "bg-zinc-400" },
] as const;

export const STAGE_VALUES = STAGES.map((s) => s.value) as string[];
export const ACTIVE_STAGES = STAGE_VALUES.filter((s) => !["Joined", "Rejected", "Dropped"].includes(s));
export const stageTone = (s: string) => STAGES.find((x) => x.value === s)?.tone ?? "bg-muted text-muted-foreground border-border";
export const stageIndex = (s: string) => STAGE_VALUES.indexOf(s);

export const CLIENT_STATUSES = ["Active", "Prospect", "On Hold", "Inactive"];
export const PROPERTY_TYPES = ["Hotel", "Resort", "Boutique Hotel", "Service Apartment", "Restaurant", "Banquet / Events", "Cloud Kitchen", "Club", "Hospital / Facility", "Other"];
export const JOB_STATUSES = ["Open", "On Hold", "Filled", "Closed"];
export const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
export const LEVELS = ["Junior / Entry", "Supervisory", "Managerial", "Senior / HOD"];
export const INTERVIEW_KINDS = ["Telephonic Screening", "HR Round", "Client Interview", "Cooking Trial", "Service Trial", "Final Round"];
export const INTERVIEW_MODES = ["In-person", "Online", "On-site", "Phone"];
export const INTERVIEW_STATUSES = ["Scheduled", "Completed", "Rescheduled", "No-show", "Cancelled"];
export const INTERVIEW_RESULTS = ["Pending", "Passed", "On Hold", "Failed"];
export const DOC_TYPES = [
  "ID Proof (Aadhaar)", "PAN Card", "Address Proof", "Education Certificates", "Experience Letters",
  "Relieving Letter", "Last 3 Salary Slips", "Passport Photo", "Reference Check", "Police Verification",
];
export const DEFAULT_DOCS = DOC_TYPES.slice(0, 5).concat(["Passport Photo", "Reference Check"]);
export const DOC_STATUSES = ["Pending", "Received", "Verified", "Rejected"];
export const OFFER_STATUSES = ["Draft", "Sent", "Accepted", "Declined", "Negotiating"];
export const FOLLOWUP_PLAN = [
  { days: 1, title: "Day 1: joining confirmation" },
  { days: 7, title: "Day 7: settling-in check" },
  { days: 30, title: "Day 30: candidate & client feedback" },
  { days: 90, title: "Day 90: replacement period review" },
];

export const PRIORITY_TONE: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600 border-slate-200",
  Normal: "bg-sky-50 text-sky-700 border-sky-200",
  High: "bg-amber-100 text-amber-800 border-amber-200",
  Urgent: "bg-rose-100 text-rose-800 border-rose-200",
};
export const JOB_STATUS_TONE: Record<string, string> = {
  Open: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "On Hold": "bg-orange-100 text-orange-800 border-orange-200",
  Filled: "bg-sky-100 text-sky-800 border-sky-200",
  Closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
};
export const RESULT_TONE: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700 border-slate-200",
  Passed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "On Hold": "bg-orange-100 text-orange-800 border-orange-200",
  Failed: "bg-rose-100 text-rose-800 border-rose-200",
};
export const DOC_TONE: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700 border-slate-200",
  Received: "bg-sky-100 text-sky-800 border-sky-200",
  Verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

export const screeningScore = (a: Application) => {
  const s = [a.score_skill, a.score_experience, a.score_communication, a.score_grooming].filter((v): v is number => v != null);
  return s.length ? s.reduce((x, y) => x + y, 0) / s.length : null;
};

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// ---------------------------------------------------------------------------
// Data loading (React Query keeps every screen in sync)
// ---------------------------------------------------------------------------

const fetchAll = async <T,>(table: CrmTable, order = "created_at", ascending = false): Promise<T[]> => {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db.from(table).select("*").order(order, { ascending }).range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data as T[]) || []));
    if (!data || data.length < page) break;
  }
  return out;
};

const KEY = {
  clients: ["crm", "crm_clients"], jobs: ["crm", "crm_jobs"], candidates: ["crm", "crm_candidates"],
  applications: ["crm", "crm_applications"], interviews: ["crm", "crm_interviews"], documents: ["crm", "crm_documents"],
  followups: ["crm", "crm_followups"], tasks: ["crm", "crm_tasks"],
};
const opts = { staleTime: 30_000, refetchOnWindowFocus: true };

export const useClients = () => useQuery({ queryKey: KEY.clients, queryFn: () => fetchAll<Client>("crm_clients", "name", true), ...opts });
export const useJobs = () => useQuery({ queryKey: KEY.jobs, queryFn: () => fetchAll<Job>("crm_jobs"), ...opts });
export const useCandidates = () => useQuery({ queryKey: KEY.candidates, queryFn: () => fetchAll<Candidate>("crm_candidates"), ...opts });
export const useApplications = () => useQuery({ queryKey: KEY.applications, queryFn: () => fetchAll<Application>("crm_applications", "updated_at"), ...opts });
export const useInterviews = () => useQuery({ queryKey: KEY.interviews, queryFn: () => fetchAll<Interview>("crm_interviews", "scheduled_at", true), ...opts });
export const useDocuments = () => useQuery({ queryKey: KEY.documents, queryFn: () => fetchAll<CrmDocument>("crm_documents", "created_at", true), ...opts });
export const useFollowups = () => useQuery({ queryKey: KEY.followups, queryFn: () => fetchAll<Followup>("crm_followups", "due_date", true), ...opts });
export const useTasks = () => useQuery({ queryKey: KEY.tasks, queryFn: () => fetchAll<Task>("crm_tasks", "due_date", true), ...opts });

export const useActivities = (filter: { candidate_id?: string; job_id?: string; client_id?: string }) => {
  const [col, val] = Object.entries(filter).find(([, v]) => v) ?? ["", ""];
  return useQuery({
    queryKey: ["crm", "crm_activities", col, val],
    enabled: !!val,
    queryFn: async () => {
      const { data, error } = await db.from("crm_activities").select("*").eq(col, val).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data as Activity[]) || [];
    },
  });
};

/** Everything at once plus id lookups, for screens that join across tables. */
export const useCrm = () => {
  const clients = useClients();
  const jobs = useJobs();
  const candidates = useCandidates();
  const applications = useApplications();
  const interviews = useInterviews();
  const documents = useDocuments();
  const followups = useFollowups();
  const tasks = useTasks();
  const all = [clients, jobs, candidates, applications, interviews, documents, followups, tasks];
  const loading = all.some((q) => q.isLoading);
  const error = all.find((q) => q.error)?.error as Error | undefined;

  const maps = useMemo(() => {
    const byId = <T extends { id: string }>(rows?: T[]) => new Map((rows || []).map((r) => [r.id, r]));
    return {
      client: byId(clients.data), job: byId(jobs.data), candidate: byId(candidates.data), application: byId(applications.data),
    };
  }, [clients.data, jobs.data, candidates.data, applications.data]);

  return {
    loading, error,
    clients: clients.data || [], jobs: jobs.data || [], candidates: candidates.data || [], applications: applications.data || [],
    interviews: interviews.data || [], documents: documents.data || [], followups: followups.data || [], tasks: tasks.data || [],
    ...maps,
  };
};

export const useRefresh = () => {
  const qc = useQueryClient();
  return (...tables: (CrmTable | "all")[]) => {
    if (tables.includes("all") || !tables.length) return qc.invalidateQueries({ queryKey: ["crm"] });
    return Promise.all(tables.map((t) => qc.invalidateQueries({ queryKey: ["crm", t] })));
  };
};

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const currentUser = async () => (await supabase.auth.getUser()).data.user;

export const insertRow = async <T,>(table: CrmTable, row: Record<string, unknown>): Promise<T> => {
  const { data, error } = await db.from(table).insert(row).select().single();
  if (error) throw error;
  return data as T;
};

export const updateRow = async <T,>(table: CrmTable, id: string, patch: Record<string, unknown>): Promise<T> => {
  const { data, error } = await db.from(table).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as T;
};

export const deleteRow = async (table: CrmTable, id: string) => {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
};

export const logEvent = async (e: { candidate_id?: string | null; job_id?: string | null; client_id?: string | null; application_id?: string | null; kind: string; content: string }) => {
  const user = await currentUser();
  await db.from("crm_activities").insert({ ...e, created_by: user?.id ?? null, created_by_email: user?.email ?? null });
};

/** Step 2: attach candidates to a requirement. Returns how many were newly added. */
export const addCandidatesToJob = async (job: Job, candidateIds: string[], candidates: Map<string, Candidate>) => {
  const user = await currentUser();
  const rows = candidateIds.map((candidate_id) => ({ job_id: job.id, candidate_id, stage: "Sourced", created_by: user?.id ?? null }));
  const { data, error } = await db.from("crm_applications").upsert(rows, { onConflict: "job_id,candidate_id", ignoreDuplicates: true }).select();
  if (error) throw error;
  const added = (data as Application[]) || [];
  const toProcess = added.map((a) => candidates.get(a.candidate_id)).filter((c): c is Candidate => !!c && ["New", "Contacted", "Interested"].includes(c.status));
  if (toProcess.length) await db.from("crm_candidates").update({ status: "In Process" }).in("id", toProcess.map((c) => c.id));
  await Promise.all(added.map((a) => logEvent({ candidate_id: a.candidate_id, job_id: job.id, application_id: a.id, kind: "stage", content: `Added to requirement "${job.title}"` })));
  return added.length;
};

export interface StageResult { app: Application; notes: string[] }

/**
 * Moves an application to a new stage and runs the process automation:
 * Documents -> creates the document checklist; Joined -> schedules follow-ups,
 * marks the candidate Placed and the requirement Filled once all openings are filled.
 */
export const moveStage = async (
  app: Application,
  stage: string,
  ctx: { job?: Job; candidate?: Candidate; applications: Application[]; documents: CrmDocument[] },
  extra: Partial<Application> = {},
): Promise<StageResult> => {
  const notes: string[] = [];
  const patch: Record<string, unknown> = { stage, ...extra };
  if (stage === "CV Sent to Client" && !app.cv_sent_at) patch.cv_sent_at = new Date().toISOString();
  if (stage === "Joined" && !app.joined_on && !extra.joined_on) patch.joined_on = app.joining_date || todayISO();
  if (stage === "Offer" && !app.offer_status && !extra.offer_status) patch.offer_status = "Draft";

  const updated = await updateRow<Application>("crm_applications", app.id, patch);
  const jobTitle = ctx.job?.title ?? "requirement";
  await logEvent({ candidate_id: app.candidate_id, job_id: app.job_id, application_id: app.id, kind: "stage", content: `${jobTitle}: ${app.stage} → ${stage}` });

  if (stage === "Documents") {
    const have = new Set(ctx.documents.filter((d) => d.candidate_id === app.candidate_id).map((d) => d.doc_type));
    const missing = DEFAULT_DOCS.filter((d) => !have.has(d));
    if (missing.length) {
      await db.from("crm_documents").insert(missing.map((doc_type) => ({ candidate_id: app.candidate_id, doc_type })));
      notes.push(`Document checklist created (${missing.length} items)`);
    }
  }

  if (stage === "Joined") {
    const joined = (updated.joined_on as string) || todayISO();
    const { data: existing } = await db.from("crm_followups").select("id").eq("application_id", app.id).limit(1);
    if (!existing?.length) {
      await db.from("crm_followups").insert(FOLLOWUP_PLAN.map((p) => ({ application_id: app.id, title: p.title, due_date: addDays(joined, p.days) })));
      notes.push("Follow-ups scheduled for day 1, 7, 30 and 90");
    }
    if (ctx.candidate && ctx.candidate.status !== "Placed") {
      await db.from("crm_candidates").update({ status: "Placed" }).eq("id", app.candidate_id);
    }
    if (ctx.job) {
      const joinedCount = ctx.applications.filter((a) => a.job_id === app.job_id && (a.stage === "Joined" || a.id === app.id)).length;
      if (joinedCount >= ctx.job.openings && ctx.job.status === "Open") {
        await db.from("crm_jobs").update({ status: "Filled" }).eq("id", ctx.job.id);
        notes.push(`All ${ctx.job.openings} opening(s) filled: requirement marked Filled`);
      }
    }
  } else if (ctx.candidate && ACTIVE_STAGES.includes(stage) && ["New", "Contacted", "Interested"].includes(ctx.candidate.status)) {
    await db.from("crm_candidates").update({ status: "In Process" }).eq("id", app.candidate_id);
  }

  return { app: updated, notes };
};

// ---------------------------------------------------------------------------
// Google Forms
// ---------------------------------------------------------------------------

const squashKey = (s?: string | null) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Title of the Google Form a candidate came from (set by the form-intake function). */
export const formOf = (c: Candidate) => String((c.extra as Record<string, unknown> | null)?.["Google Form"] ?? "") || null;

/** Every Google Form that has sent responses, with counts and the requirement it is linked to. */
export const listForms = (candidates: Candidate[], jobs: Job[]) => {
  const m = new Map<string, { title: string; count: number; latest: string }>();
  candidates.forEach((c) => {
    const t = c.source === "Google Form" ? formOf(c) : null;
    if (!t) return;
    const k = squashKey(t);
    const cur = m.get(k);
    if (!cur) m.set(k, { title: t, count: 1, latest: c.created_at });
    else { cur.count++; if (c.created_at > cur.latest) cur.latest = c.created_at; }
  });
  return [...m.values()]
    .map((f) => ({ ...f, job: jobs.find((j) => squashKey(j.intake_key) && squashKey(j.intake_key) === squashKey(f.title)) ?? null }))
    .sort((a, b) => b.latest.localeCompare(a.latest));
};

/**
 * Links a Google Form to a requirement (or unlinks with jobId = null). Future responses go
 * straight into that requirement; people who already applied through the form are added now.
 */
export const linkFormToJob = async (formTitle: string, jobId: string | null, ctx: { jobs: Job[]; candidates: Candidate[]; candidateMap: Map<string, Candidate> }) => {
  const key = squashKey(formTitle);
  const previous = ctx.jobs.filter((j) => squashKey(j.intake_key) === key && j.id !== jobId);
  for (const j of previous) await db.from("crm_jobs").update({ intake_key: null }).eq("id", j.id);
  if (!jobId) return 0;
  await db.from("crm_jobs").update({ intake_key: formTitle.trim() }).eq("id", jobId);
  const job = ctx.jobs.find((j) => j.id === jobId);
  const applicants = ctx.candidates.filter((c) => c.source === "Google Form" && squashKey(formOf(c)) === key).map((c) => c.id);
  if (!job || !applicants.length) return 0;
  await logEvent({ job_id: jobId, kind: "note", content: `Linked to Google Form "${formTitle}"` });
  return addCandidatesToJob(job, applicants, ctx.candidateMap);
};

// ---------------------------------------------------------------------------
// Documents (private bucket)
// ---------------------------------------------------------------------------

export const uploadDocument = async (doc: CrmDocument, file: File) => {
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be under 10 MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${doc.candidate_id}/${doc.doc_type.replace(/[^a-zA-Z0-9]+/g, "_")}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("crm-docs").upload(path, file, { upsert: false });
  if (error) throw error;
  if (doc.file_path) await supabase.storage.from("crm-docs").remove([doc.file_path]);
  return updateRow<CrmDocument>("crm_documents", doc.id, { file_path: path, status: doc.status === "Pending" ? "Received" : doc.status });
};

export const openDocument = async (path: string) => {
  const { data, error } = await supabase.storage.from("crm-docs").createSignedUrl(path, 300);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
};

/** Uploads a CV into the private bucket and returns a long-lived signed link. */
export const uploadPrivateCv = async (candidateId: string, file: File) => {
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be under 10 MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${candidateId}/CV_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("crm-docs").upload(path, file);
  if (error) throw error;
  return `crm-docs:${path}`;
};

/** CVs are either public URLs (website uploads) or "crm-docs:<path>" for private uploads. */
export const openCv = async (cv: string) => {
  if (cv.startsWith("crm-docs:")) return openDocument(cv.slice("crm-docs:".length));
  window.open(cv, "_blank", "noopener,noreferrer");
};
