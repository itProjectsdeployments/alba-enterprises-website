import { useMemo, useState } from "react";
import { CalendarPlus, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { toISODate } from "@/lib/crm";
import { INTERVIEW_KINDS, INTERVIEW_MODES, positionAnswerOf, stageIndex, stageTone, useCrm } from "@/lib/hr/model";
import { F, useOpenReset } from "./dialogs";
import { NativeSelect, Pill, useAction } from "./ui";

const PRE_INTERVIEW = ["Sourced", "Screening", "Shortlisted", "CV Sent to Client"];
const GAPS = [
  { value: "0", label: "Same time for everyone" },
  { value: "10", label: "Every 10 minutes" },
  { value: "15", label: "Every 15 minutes" },
  { value: "20", label: "Every 20 minutes" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
];

const fmtTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/** Schedule one interview session for many candidates of a requirement at once. Times can be changed per person later. */
const BulkScheduleDialog = ({ open, onOpenChange, jobId, onScheduled }: {
  open: boolean; onOpenChange: (v: boolean) => void; jobId?: string; onScheduled?: (jobId: string) => void;
}) => {
  const crm = useCrm();
  const run = useAction();
  const { toast } = useToast();
  const [job, setJob] = useState("");
  const [stageFilter, setStageFilter] = useState("pre");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ kind: "Client Interview", mode: "In-person", date: "", time: "11:00", gap: "0", location: "", interviewer: "", notes: "" });
  const [busy, setBusy] = useState(false);

  useOpenReset(open, () => {
    const j = jobId ?? "";
    setJob(j);
    setStageFilter("pre");
    setQ("");
    setPicked(new Set());
    const tomorrow = toISODate(new Date(Date.now() + 86400000));
    const jj = crm.job.get(j);
    const c = jj?.client_id ? crm.client.get(jj.client_id) : undefined;
    setForm({ kind: "Client Interview", mode: "In-person", date: tomorrow, time: "11:00", gap: "0", location: c ? [c.name, c.address || c.city].filter(Boolean).join(", ") : "", interviewer: c?.contact_person ?? "", notes: "" });
  });

  const upcomingFor = useMemo(() => {
    const now = new Date().toISOString();
    const m = new Map<string, string>();
    crm.interviews.forEach((i) => { if (i.status === "Scheduled" && i.scheduled_at >= now) m.set(i.application_id, i.scheduled_at); });
    return m;
  }, [crm.interviews]);

  const apps = useMemo(() => {
    const term = q.trim().toLowerCase();
    return crm.applications
      .filter((a) => a.job_id === job && !["Joined", "Rejected", "Dropped"].includes(a.stage))
      .filter((a) => stageFilter === "all" || (stageFilter === "pre" ? PRE_INTERVIEW.includes(a.stage) : a.stage === stageFilter))
      .map((a) => ({ a, c: crm.candidate.get(a.candidate_id) }))
      .filter(({ c }) => c && (!term || [c.full_name, c.phone, c.city, positionAnswerOf(c)].filter(Boolean).join(" ").toLowerCase().includes(term)))
      .sort((x, y) => (x.c!.full_name).localeCompare(y.c!.full_name));
  }, [crm.applications, crm.candidate, job, stageFilter, q]);

  const visibleIds = apps.map(({ a }) => a.id);
  const allPicked = visibleIds.length > 0 && visibleIds.every((id) => picked.has(id));
  const toggleAll = () => setPicked((p) => { const n = new Set(p); visibleIds.forEach((id) => (allPicked ? n.delete(id) : n.add(id))); return n; });
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const selected = crm.applications.filter((a) => picked.has(a.id));
  const start = form.date && form.time ? new Date(`${form.date}T${form.time}`) : null;
  const gap = Number(form.gap);
  const end = start && selected.length ? new Date(start.getTime() + gap * 60000 * (selected.length - 1)) : null;
  const jobRow = crm.job.get(job);

  const save = async () => {
    if (!start || !selected.length || !jobRow) return;
    setBusy(true);
    const ordered = [...selected].sort((x, y) => (crm.candidate.get(x.candidate_id)?.full_name ?? "").localeCompare(crm.candidate.get(y.candidate_id)?.full_name ?? ""));
    const ok = await run(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = ordered.map((a, i) => ({
        application_id: a.id, kind: form.kind, mode: form.mode, scheduled_at: new Date(start.getTime() + gap * 60000 * i).toISOString(),
        location: form.location || null, interviewer: form.interviewer || null, feedback: form.notes || null, created_by: user?.id ?? null,
      }));
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from("crm_interviews").insert(rows.slice(i, i + 200));
        if (error) throw error;
      }
      const toMove = ordered.filter((a) => stageIndex(a.stage) < stageIndex("Interview / Trial")).map((a) => a.id);
      if (toMove.length) {
        const { error } = await supabase.from("crm_applications").update({ stage: "Interview / Trial" }).in("id", toMove);
        if (error) throw error;
      }
      await supabase.from("crm_candidates").update({ status: "In Process" }).in("id", ordered.map((a) => a.candidate_id)).in("status", ["New", "Contacted", "Interested"]);
      await supabase.from("crm_activities").insert(rows.map((r, i) => ({
        candidate_id: ordered[i].candidate_id, job_id: jobRow.id, application_id: ordered[i].id, kind: "interview",
        content: `${form.kind} scheduled (${form.mode}) for ${new Date(r.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
        created_by: user?.id ?? null, created_by_email: user?.email ?? null,
      })));
      return true;
    }, { refresh: ["crm_interviews", "crm_applications", "crm_candidates"] });
    setBusy(false);
    if (ok) {
      toast({ title: `${ordered.length} interview(s) scheduled`, description: `${jobRow.title}: you can change any candidate's time on the Interviews page.` });
      onOpenChange(false);
      onScheduled?.(jobRow.id);
    }
  };

  const stageCounts = (s: string) => crm.applications.filter((a) => a.job_id === job && (s === "pre" ? PRE_INTERVIEW.includes(a.stage) : s === "all" ? !["Joined", "Rejected", "Dropped"].includes(a.stage) : a.stage === s)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarPlus className="w-5 h-5 text-primary" />Schedule interviews for many candidates</DialogTitle>
          <DialogDescription>Step 4: pick the vacancy, tick the candidates, set one date and time. You can change each person's time afterwards.</DialogDescription>
        </DialogHeader>

        <F label="Vacancy">
          <NativeSelect value={job} onChange={(v) => { setJob(v); setPicked(new Set()); }} placeholder="Select a requirement"
            options={crm.jobs.filter((j) => j.status === "Open" || j.status === "On Hold" || j.id === jobId).map((j) => ({
              value: j.id, label: [j.title, j.location, j.client_id ? crm.client.get(j.client_id)?.name : null].filter(Boolean).join(" · ") + ` (${crm.applications.filter((a) => a.job_id === j.id && !["Joined", "Rejected", "Dropped"].includes(a.stage)).length})`,
            }))} />
        </F>

        {job && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {[["pre", "Not yet interviewed"], ["Interview / Trial", "Already in interview"], ["all", "All active"]].map(([v, l]) => (
                <Button key={v} size="sm" variant={stageFilter === v ? "default" : "outline"} onClick={() => setStageFilter(v)}>{l} <span className="ml-1 opacity-70">{stageCounts(v)}</span></Button>
              ))}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 h-9" placeholder="Filter by name, phone, city or position chosen in the form…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>

            <div className="border rounded-lg max-h-[34vh] overflow-y-auto">
              <div className="sticky top-0 bg-muted/80 backdrop-blur px-3 py-2 flex items-center gap-3 text-xs font-medium text-muted-foreground border-b">
                <Checkbox checked={allPicked} onCheckedChange={toggleAll} aria-label="Select all" />
                <span className="flex-1">{picked.size} of {apps.length} selected</span>
              </div>
              {apps.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No candidates here. Add candidates to this vacancy first, or change the filter.</p> : apps.map(({ a, c }) => (
                <label key={a.id} className="flex items-center gap-3 px-3 py-2 border-b last:border-0 text-sm cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={picked.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                  <span className="font-medium w-48 truncate">{c!.full_name}</span>
                  <span className="text-muted-foreground w-36 truncate">{c!.phone}</span>
                  <span className="text-muted-foreground flex-1 truncate">{positionAnswerOf(c!) || c!.city}</span>
                  {upcomingFor.has(a.id) && <Pill tone="bg-amber-50 text-amber-800 border-amber-200">Already scheduled</Pill>}
                  <Pill tone={stageTone(a.stage)}>{a.stage}</Pill>
                </label>
              ))}
            </div>

            <div className="grid sm:grid-cols-4 gap-4">
              <F label="Type"><NativeSelect value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} options={INTERVIEW_KINDS} /></F>
              <F label="Mode"><NativeSelect value={form.mode} onChange={(v) => setForm({ ...form, mode: v })} options={INTERVIEW_MODES} /></F>
              <F label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
              <F label="Start time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></F>
              <F label="Time slots"><NativeSelect value={form.gap} onChange={(v) => setForm({ ...form, gap: v })} options={GAPS} /></F>
              <F label="Interviewer"><Input value={form.interviewer} onChange={(e) => setForm({ ...form, interviewer: e.target.value })} /></F>
              <F label={form.mode === "Online" ? "Meeting link" : "Venue / address"} className="sm:col-span-2"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></F>
              <F label="Note for candidates (optional)" className="sm:col-span-4"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Carry your CV and ID proof; trial in chef whites" /></F>
            </div>
          </>
        )}

        <DialogFooter className="items-center gap-3">
          {start && selected.length > 0 && (
            <span className="text-sm text-muted-foreground sm:mr-auto">
              {selected.length} candidate(s) on {start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, {gap && end ? `${fmtTime(start)} to ${fmtTime(end)}` : `all at ${fmtTime(start)}`}
            </span>
          )}
          <Button onClick={save} disabled={busy || !selected.length || !start}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Schedule {selected.length || ""} interview{selected.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkScheduleDialog;
