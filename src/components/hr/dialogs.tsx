import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, Search, Sparkles, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/site";
import { CRM_SOURCES, DEPARTMENT_NAMES, cleanPhone, phoneKey, todayISO } from "@/lib/crm";
import {
  CLIENT_STATUSES, INTERVIEW_KINDS, INTERVIEW_MODES, JOB_STATUSES, LEVELS, PRIORITIES, PROPERTY_TYPES,
  type Application, type Candidate, type Client, type Job, type Task,
  addCandidatesToJob, insertRow, logEvent, moveStage, stageIndex, updateRow, useCrm,
} from "@/lib/hr/model";
import { NativeSelect, Pill, useAction } from "./ui";

/** Runs `fn` each time a dialog opens, but not on re-renders while it is open (so typing is never wiped). */
export const useOpenReset = (open: boolean, fn: () => void) => {
  const was = useRef(false);
  useEffect(() => {
    if (open && !was.current) fn();
    was.current = open;
  }); // eslint-disable-line react-hooks/exhaustive-deps
};

const ALL_ROLES = [...new Set(DEPARTMENTS.flatMap((d) => d.roles))];

export const F = ({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) => (
  <div className={className}><Label className="text-xs font-medium text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>
);

export const clean = (o: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  Object.entries(o).forEach(([k, v]) => { out[k] = typeof v === "string" ? (v.trim() || null) : v; });
  return out;
};

interface Base<T> { open: boolean; onOpenChange: (v: boolean) => void; initial?: Partial<T> | null; onSaved?: (row: T) => void }

/* ------------------------------------------------------------------ Client */

export const ClientDialog = ({ open, onOpenChange, initial, onSaved }: Base<Client>) => {
  const run = useAction();
  const [f, setF] = useState<Partial<Client>>({});
  const [busy, setBusy] = useState(false);
  useOpenReset(open, () => setF(initial ?? { status: "Active", property_type: "Hotel" }));
  const set = (k: keyof Client, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name?.trim()) return;
    setBusy(true);
    const data = clean({ name: f.name, property_type: f.property_type, city: f.city, address: f.address, contact_person: f.contact_person, contact_designation: f.contact_designation, contact_phone: f.contact_phone ? cleanPhone(f.contact_phone) : null, contact_email: f.contact_email, terms: f.terms, status: f.status || "Active", notes: f.notes });
    const row = await run(async () => {
      if (initial?.id) return updateRow<Client>("crm_clients", initial.id, data);
      const r = await insertRow<Client>("crm_clients", data);
      await logEvent({ client_id: r.id, kind: "note", content: "Client added" });
      return r;
    }, { success: initial?.id ? "Client updated" : "Client added", refresh: ["crm_clients"] });
    setBusy(false);
    if (row) { onSaved?.(row); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit client" : "New client"}</DialogTitle><DialogDescription>A hotel or hospitality business you recruit for.</DialogDescription></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Hotel / company name *" className="sm:col-span-2"><Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} autoFocus /></F>
          <F label="Property type"><NativeSelect value={f.property_type} onChange={(v) => set("property_type", v)} options={PROPERTY_TYPES} /></F>
          <F label="Status"><NativeSelect value={f.status} onChange={(v) => set("status", v)} options={CLIENT_STATUSES} /></F>
          <F label="City"><Input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} /></F>
          <F label="Address"><Input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} /></F>
          <F label="Contact person"><Input value={f.contact_person ?? ""} onChange={(e) => set("contact_person", e.target.value)} /></F>
          <F label="Designation"><Input value={f.contact_designation ?? ""} onChange={(e) => set("contact_designation", e.target.value)} placeholder="e.g. HR Manager" /></F>
          <F label="Contact phone"><Input value={f.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} /></F>
          <F label="Contact email"><Input type="email" value={f.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} /></F>
          <F label="Commercial terms" className="sm:col-span-2"><Input value={f.terms ?? ""} onChange={(e) => set("terms", e.target.value)} placeholder="e.g. 8.33% of annual CTC, 90-day replacement" /></F>
          <F label="Notes" className="sm:col-span-2"><Textarea rows={3} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></F>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy || !f.name?.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save client</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* --------------------------------------------------------------------- Job */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const JobDialog = ({ open, onOpenChange, initial, onSaved, onNewClient: _unused }: Base<Job> & { onNewClient?: () => void }) => {
  const run = useAction();
  const { clients } = useCrm();
  const [f, setF] = useState<Partial<Job>>({});
  const [busy, setBusy] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  useOpenReset(open, () => setF(initial?.id ? initial : { openings: 1, priority: "Normal", status: "Open", ...initial }));
  const set = (k: keyof Job, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title?.trim()) return;
    setBusy(true);
    const data = clean({
      client_id: f.client_id || null, title: f.title, department: f.department, level: f.level, openings: Math.max(1, Number(f.openings) || 1),
      location: f.location, salary_range: f.salary_range, experience_required: f.experience_required, shift: f.shift, benefits: f.benefits,
      skills: f.skills, description: f.description, intake_key: f.intake_key, target_date: f.target_date || null, priority: f.priority || "Normal", status: f.status || "Open",
    });
    const row = await run(async () => {
      if (initial?.id) return updateRow<Job>("crm_jobs", initial.id, data);
      const r = await insertRow<Job>("crm_jobs", data);
      await logEvent({ job_id: r.id, client_id: r.client_id, kind: "note", content: `Requirement created: ${r.openings} × ${r.title}` });
      return r;
    }, { success: initial?.id ? "Requirement updated" : "Requirement created", refresh: ["crm_jobs"] });
    setBusy(false);
    if (row) { onSaved?.(row); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit requirement" : "New requirement"}</DialogTitle>
          <DialogDescription>Step 1, Requirement Analysis: capture the property, department, position and timeline.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-3 gap-4">
          <F label="Client / property" className="sm:col-span-2">
            <div className="flex gap-2">
              <NativeSelect value={f.client_id} onChange={(v) => set("client_id", v || null)} options={clients.map((c) => ({ value: c.id, label: `${c.name}${c.city ? ` · ${c.city}` : ""}` }))} placeholder="Select client (optional)" />
              <Button type="button" variant="outline" onClick={() => setClientOpen(true)}>New client</Button>
            </div>
          </F>
          <F label="Priority"><NativeSelect value={f.priority} onChange={(v) => set("priority", v)} options={PRIORITIES} /></F>
          <F label="Position / job title *" className="sm:col-span-2">
            <Input list="hr-roles" value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Commis I, Front Office Associate" />
            <datalist id="hr-roles">{ALL_ROLES.map((r) => <option key={r} value={r} />)}</datalist>
          </F>
          <F label="No. of openings"><Input type="number" min={1} value={f.openings ?? 1} onChange={(e) => set("openings", e.target.value)} /></F>
          <F label="Department"><NativeSelect value={f.department} onChange={(v) => set("department", v || null)} options={DEPARTMENT_NAMES} placeholder="Select" /></F>
          <F label="Level"><NativeSelect value={f.level} onChange={(v) => set("level", v || null)} options={LEVELS} placeholder="Select" /></F>
          <F label="Location"><Input value={f.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="City / property" /></F>
          <F label="Salary range (₹/month)"><Input value={f.salary_range ?? ""} onChange={(e) => set("salary_range", e.target.value)} placeholder="e.g. 18,000 – 22,000" /></F>
          <F label="Experience required"><Input value={f.experience_required ?? ""} onChange={(e) => set("experience_required", e.target.value)} placeholder="e.g. 2–4 years" /></F>
          <F label="Shift / timing"><Input value={f.shift ?? ""} onChange={(e) => set("shift", e.target.value)} placeholder="e.g. Rotational, 9 hrs" /></F>
          <F label="Benefits"><Input value={f.benefits ?? ""} onChange={(e) => set("benefits", e.target.value)} placeholder="Food, accommodation, PF..." /></F>
          <F label="Target joining date"><Input type="date" value={f.target_date ?? ""} onChange={(e) => set("target_date", e.target.value)} /></F>
          <F label="Status"><NativeSelect value={f.status} onChange={(v) => set("status", v)} options={JOB_STATUSES} /></F>
          <F label="Key skills / must-haves" className="sm:col-span-3"><Input value={f.skills ?? ""} onChange={(e) => set("skills", e.target.value)} placeholder="e.g. Opera PMS, fluent English, tandoor experience" /></F>
          <F label="Google Form name (auto-add applicants)" className="sm:col-span-3"><Input value={f.intake_key ?? ""} onChange={(e) => set("intake_key", e.target.value)} placeholder="Exact title of the Google Form for this job, e.g. Commis I – Goa Hiring" /></F>
          <F label="Job description & notes from client" className="sm:col-span-3"><Textarea rows={4} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></F>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy || !f.title?.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save requirement</Button></DialogFooter>
        <ClientDialog open={clientOpen} onOpenChange={setClientOpen} onSaved={(c) => set("client_id", c.id)} />
      </DialogContent>
    </Dialog>
  );
};

/* --------------------------------------------------------------- Candidate */

export const CandidateDialog = ({ open, onOpenChange, initial, onSaved }: Base<Candidate>) => {
  const run = useAction();
  const { candidates } = useCrm();
  const [f, setF] = useState<Partial<Candidate>>({});
  const [busy, setBusy] = useState(false);
  useOpenReset(open, () => setF(initial ?? { source: "WhatsApp", status: "New" }));
  const set = (k: keyof Candidate, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const dup = useMemo(() => {
    const k = phoneKey(f.phone);
    const e = f.email?.trim().toLowerCase();
    return candidates.find((c) => c.id !== initial?.id && ((k.length >= 10 && phoneKey(c.phone) === k) || (e && c.email?.toLowerCase() === e)));
  }, [f.phone, f.email, candidates, initial?.id]);

  const save = async () => {
    if (!f.full_name?.trim()) return;
    setBusy(true);
    const data = clean({
      full_name: f.full_name, phone: f.phone ? cleanPhone(f.phone) : null, email: f.email, city: f.city, job_role: f.job_role,
      department: f.department, experience: f.experience, current_employer: f.current_employer, current_salary: f.current_salary,
      expected_salary: f.expected_salary, notice_period: f.notice_period, source: f.source || "Other", status: f.status || "New", notes: f.notes,
    });
    const row = await run(async () => {
      if (initial?.id) return updateRow<Candidate>("crm_candidates", initial.id, data);
      const r = await insertRow<Candidate>("crm_candidates", data);
      await logEvent({ candidate_id: r.id, kind: "note", content: `Candidate added (source: ${r.source})` });
      return r;
    }, { success: initial?.id ? "Candidate updated" : "Candidate added", refresh: ["crm_candidates"] });
    setBusy(false);
    if (row) { onSaved?.(row); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit candidate" : "New candidate"}</DialogTitle><DialogDescription>Step 2, Candidate Sourcing: add someone to your talent database.</DialogDescription></DialogHeader>
        <div className="grid sm:grid-cols-3 gap-4">
          <F label="Full name *"><Input value={f.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} autoFocus /></F>
          <F label="Phone / WhatsApp"><Input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></F>
          <F label="Email"><Input type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></F>
          {dup && (
            <p className="sm:col-span-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Possible duplicate: {dup.full_name} ({dup.phone || dup.email}) is already in your database.
            </p>
          )}
          <F label="Current role / position"><Input list="hr-roles-c" value={f.job_role ?? ""} onChange={(e) => set("job_role", e.target.value)} /><datalist id="hr-roles-c">{ALL_ROLES.map((r) => <option key={r} value={r} />)}</datalist></F>
          <F label="Department"><NativeSelect value={f.department} onChange={(v) => set("department", v || null)} options={DEPARTMENT_NAMES} placeholder="Select" /></F>
          <F label="City"><Input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} /></F>
          <F label="Experience"><Input value={f.experience ?? ""} onChange={(e) => set("experience", e.target.value)} placeholder="e.g. 3 years" /></F>
          <F label="Current hotel / employer"><Input value={f.current_employer ?? ""} onChange={(e) => set("current_employer", e.target.value)} /></F>
          <F label="Notice period"><Input value={f.notice_period ?? ""} onChange={(e) => set("notice_period", e.target.value)} /></F>
          <F label="Current salary"><Input value={f.current_salary ?? ""} onChange={(e) => set("current_salary", e.target.value)} /></F>
          <F label="Expected salary"><Input value={f.expected_salary ?? ""} onChange={(e) => set("expected_salary", e.target.value)} /></F>
          <F label="Source"><NativeSelect value={f.source} onChange={(v) => set("source", v)} options={CRM_SOURCES} /></F>
          <F label="Notes" className="sm:col-span-3"><Textarea rows={3} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></F>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy || !f.full_name?.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save candidate</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------- Task */

export const TaskDialog = ({ open, onOpenChange, initial, onSaved }: Base<Task>) => {
  const run = useAction();
  const { candidates, jobs, clients } = useCrm();
  const [f, setF] = useState<Partial<Task>>({});
  const [busy, setBusy] = useState(false);
  useOpenReset(open, () => setF(initial?.id ? initial : { priority: "Normal", due_date: todayISO(), ...initial }));
  const set = (k: keyof Task, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title?.trim()) return;
    setBusy(true);
    const data = clean({ title: f.title, due_date: f.due_date || null, priority: f.priority || "Normal", candidate_id: f.candidate_id || null, job_id: f.job_id || null, client_id: f.client_id || null, notes: f.notes });
    const row = await run(() => (initial?.id ? updateRow<Task>("crm_tasks", initial.id, data) : insertRow<Task>("crm_tasks", data)), { success: "Task saved", refresh: ["crm_tasks"] });
    setBusy(false);
    if (row) { onSaved?.(row); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="What needs to be done? *" className="sm:col-span-2"><Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} autoFocus placeholder="e.g. Call Hotel XYZ for interview feedback" /></F>
          <F label="Due date"><Input type="date" value={f.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} /></F>
          <F label="Priority"><NativeSelect value={f.priority} onChange={(v) => set("priority", v)} options={PRIORITIES} /></F>
          <F label="Candidate"><NativeSelect value={f.candidate_id} onChange={(v) => set("candidate_id", v || null)} options={candidates.map((c) => ({ value: c.id, label: c.full_name }))} placeholder="None" /></F>
          <F label="Requirement"><NativeSelect value={f.job_id} onChange={(v) => set("job_id", v || null)} options={jobs.map((j) => ({ value: j.id, label: j.title }))} placeholder="None" /></F>
          <F label="Client" className="sm:col-span-2"><NativeSelect value={f.client_id} onChange={(v) => set("client_id", v || null)} options={clients.map((c) => ({ value: c.id, label: c.name }))} placeholder="None" /></F>
          <F label="Notes" className="sm:col-span-2"><Textarea rows={2} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></F>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy || !f.title?.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save task</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------------------------------------------------- Add to requirement */

const words = (s?: string | null) => (s || "").toLowerCase().split(/[^a-z0-9&]+/).filter((w) => w.length > 2);

export const AddToJobDialog = ({ open, onOpenChange, jobId, candidateIds }: { open: boolean; onOpenChange: (v: boolean) => void; jobId?: string; candidateIds?: string[] }) => {
  const run = useAction();
  const { toast } = useToast();
  const { jobs, candidates, applications, candidate: candMap, job: jobMap, client: clientMap } = useCrm();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setSelectedJob(jobId ?? ""); setPicked(new Set(candidateIds ?? [])); setQ(""); } }, [open, jobId, candidateIds]);

  const job = jobMap.get(selectedJob);
  const already = useMemo(() => new Set(applications.filter((a) => a.job_id === selectedJob).map((a) => a.candidate_id)), [applications, selectedJob]);

  // Rank candidates by how well they match the requirement (department, role words, city).
  const ranked = useMemo(() => {
    if (!job) return [];
    const jw = new Set([...words(job.title), ...words(job.skills)]);
    const term = q.trim().toLowerCase();
    return candidates
      .filter((c) => !["Not Interested", "Not Suitable", "Placed"].includes(c.status) || already.has(c.id))
      .filter((c) => !term || [c.full_name, c.phone, c.job_role, c.city, c.department].filter(Boolean).join(" ").toLowerCase().includes(term))
      .map((c) => {
        let score = 0;
        if (job.department && c.department === job.department) score += 3;
        score += words(c.job_role).filter((w) => jw.has(w)).length * 2;
        if (job.location && c.city && job.location.toLowerCase().includes(c.city.toLowerCase())) score += 1;
        return { c, score };
      })
      .sort((a, b) => b.score - a.score || a.c.full_name.localeCompare(b.c.full_name))
      .slice(0, 200);
  }, [job, candidates, q, already]);

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const save = async () => {
    if (!job || !picked.size) return;
    setBusy(true);
    const ids = [...picked].filter((id) => !already.has(id));
    const n = await run(() => addCandidatesToJob(job, ids, candMap), { refresh: ["crm_applications", "crm_candidates"] });
    setBusy(false);
    if (n !== undefined) {
      toast({ title: `${n} candidate(s) added to ${job.title}`, description: "They are now in the pipeline at the Sourced stage." });
      onOpenChange(false);
    }
  };

  const openJobs = jobs.filter((j) => j.status === "Open" || j.id === jobId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add candidates to a requirement</DialogTitle>
          <DialogDescription>Step 2, Sourcing: best matches are listed first.</DialogDescription>
        </DialogHeader>
        <F label="Requirement">
          <NativeSelect
            value={selectedJob}
            onChange={setSelectedJob}
            placeholder="Select an open requirement"
            options={openJobs.map((j) => ({ value: j.id, label: `${j.title}${j.client_id ? ` · ${clientMap.get(j.client_id)?.name ?? ""}` : ""}${j.location ? ` · ${j.location}` : ""}` }))}
          />
        </F>
        {job && candidateIds?.length ? (
          <p className="text-sm text-muted-foreground">{candidateIds.length} selected candidate(s) will be added to <strong>{job.title}</strong>.</p>
        ) : job ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search candidates..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="border rounded-lg divide-y overflow-y-auto min-h-[200px] max-h-[45vh]">
              {ranked.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No candidates found. Add or import candidates first.</p>}
              {ranked.map(({ c, score }) => {
                const inJob = already.has(c.id);
                return (
                  <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${inJob ? "opacity-50" : "cursor-pointer hover:bg-muted/50"}`}>
                    <Checkbox checked={inJob || picked.has(c.id)} disabled={inJob} onCheckedChange={() => toggle(c.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{[c.job_role, c.department, c.city, c.experience].filter(Boolean).join(" · ") || "No details"}</p>
                    </div>
                    {inJob ? <span className="text-xs">Already added</span> : score >= 3 ? <Pill tone="bg-emerald-50 text-emerald-700 border-emerald-200"><Sparkles className="w-3 h-3 mr-1" />Good match</Pill> : null}
                  </label>
                );
              })}
            </div>
          </>
        ) : null}
        <DialogFooter>
          <Button onClick={save} disabled={busy || !job || ![...picked].some((id) => !already.has(id))}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add {[...picked].filter((id) => !already.has(id)).length || ""} to pipeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------- Schedule interview */

const localNowPlus = (h: number) => {
  const d = new Date(Date.now() + h * 3600000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const ScheduleDialog = ({ open, onOpenChange, applicationId }: { open: boolean; onOpenChange: (v: boolean) => void; applicationId?: string }) => {
  const run = useAction();
  const { applications, documents, candidate: candMap, job: jobMap, client: clientMap } = useCrm();
  const [appId, setAppId] = useState("");
  const [f, setF] = useState({ kind: "Client Interview", mode: "In-person", when: localNowPlus(24), location: "", interviewer: "", feedback: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAppId(applicationId ?? "");
    setF({ kind: "Client Interview", mode: "In-person", when: localNowPlus(24), location: "", interviewer: "", feedback: "" });
  }, [open, applicationId]);

  useEffect(() => {
    const a = applications.find((x) => x.id === appId);
    const j = a ? jobMap.get(a.job_id) : undefined;
    const c = j?.client_id ? clientMap.get(j.client_id) : undefined;
    if (c && !f.location) setF((p) => ({ ...p, location: [c.name, c.address || c.city].filter(Boolean).join(", "), interviewer: c.contact_person || p.interviewer }));
  }, [appId]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = (a: Application) => `${candMap.get(a.candidate_id)?.full_name ?? "?"} → ${jobMap.get(a.job_id)?.title ?? "?"}`;
  const eligible = applications.filter((a) => !["Joined", "Rejected", "Dropped"].includes(a.stage) || a.id === applicationId);

  const save = async () => {
    const app = applications.find((a) => a.id === appId);
    if (!app || !f.when) return;
    setBusy(true);
    const ok = await run(async () => {
      await insertRow("crm_interviews", { application_id: app.id, kind: f.kind, mode: f.mode, scheduled_at: new Date(f.when).toISOString(), location: f.location || null, interviewer: f.interviewer || null, feedback: f.feedback || null });
      await logEvent({ candidate_id: app.candidate_id, job_id: app.job_id, application_id: app.id, kind: "interview", content: `${f.kind} scheduled (${f.mode}) for ${new Date(f.when).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` });
      if (stageIndex(app.stage) < stageIndex("Interview / Trial")) {
        await moveStage(app, "Interview / Trial", { job: jobMap.get(app.job_id), candidate: candMap.get(app.candidate_id), applications, documents });
      }
      return true;
    }, { success: "Interview scheduled", refresh: ["crm_interviews", "crm_applications", "crm_candidates"] });
    setBusy(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Schedule interview / trial</DialogTitle><DialogDescription>Step 4: client interviews plus cooking or service trials.</DialogDescription></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Candidate → requirement *" className="sm:col-span-2">
            <NativeSelect value={appId} onChange={setAppId} placeholder="Select" options={eligible.map((a) => ({ value: a.id, label: label(a) }))} />
          </F>
          <F label="Type"><NativeSelect value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={INTERVIEW_KINDS} /></F>
          <F label="Mode"><NativeSelect value={f.mode} onChange={(v) => setF({ ...f, mode: v })} options={INTERVIEW_MODES} /></F>
          <F label="Date & time *"><Input type="datetime-local" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} /></F>
          <F label="Interviewer"><Input value={f.interviewer} onChange={(e) => setF({ ...f, interviewer: e.target.value })} placeholder="e.g. Executive Chef" /></F>
          <F label={f.mode === "Online" ? "Meeting link" : "Venue / address"} className="sm:col-span-2"><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></F>
          <F label="Notes for the candidate / team" className="sm:col-span-2"><Textarea rows={2} value={f.feedback} onChange={(e) => setF({ ...f, feedback: e.target.value })} placeholder="e.g. Bring knife kit and chef whites for the trial" /></F>
        </div>
        <DialogFooter><Button onClick={save} disabled={busy || !appId || !f.when}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Schedule</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
