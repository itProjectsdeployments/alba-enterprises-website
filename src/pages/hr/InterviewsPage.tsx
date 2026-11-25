import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarPlus, ChevronDown, ChevronRight, MessageCircle, MapPin, Video, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { todayISO, toISODate, waLink } from "@/lib/crm";
import {
  INTERVIEW_RESULTS, INTERVIEW_STATUSES, RESULT_TONE, type Interview, logEvent, moveStage, positionAnswerOf, updateRow, useCrm,
} from "@/lib/hr/model";
import { EmptyState, NativeSelect, PageHeader, Pill, useAction, useHrUi } from "@/components/hr/ui";

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const dayLabel = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const InterviewsPage = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("upcoming");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reschedule, setReschedule] = useState({ when: "", gap: "0" });
  const jobFilter = params.get("job") ?? "";
  const today = todayISO();

  const list = useMemo(() => {
    const cutoff = new Date(Date.now() - 2 * 3600000).toISOString();
    return crm.interviews.filter((i) => {
      const app = crm.application.get(i.application_id);
      if (!app || (jobFilter && app.job_id !== jobFilter)) return false;
      if (view === "upcoming") return i.scheduled_at >= cutoff && i.status !== "Cancelled";
      if (view === "pending") return i.scheduled_at < cutoff && i.result === "Pending" && i.status !== "Cancelled";
      if (view === "past") return i.scheduled_at < cutoff;
      return true;
    }).sort((a, b) => (view === "upcoming" ? a.scheduled_at.localeCompare(b.scheduled_at) : b.scheduled_at.localeCompare(a.scheduled_at)));
  }, [crm.interviews, crm.application, view, jobFilter]);

  // A "session" = one vacancy on one day.
  const sessions = useMemo(() => {
    const m = new Map<string, { key: string; jobId: string; date: string; items: Interview[] }>();
    list.forEach((i) => {
      const app = crm.application.get(i.application_id)!;
      const date = toISODate(new Date(i.scheduled_at));
      const key = `${app.job_id}|${date}`;
      if (!m.has(key)) m.set(key, { key, jobId: app.job_id, date, items: [] });
      m.get(key)!.items.push(i);
    });
    return [...m.values()];
  }, [list, crm.application]);

  const pendingCount = crm.interviews.filter((i) => i.scheduled_at < new Date(Date.now() - 2 * 3600000).toISOString() && i.result === "Pending" && i.status !== "Cancelled").length;
  const jobsWithInterviews = [...new Set(crm.interviews.map((i) => crm.application.get(i.application_id)?.job_id).filter(Boolean) as string[])];
  const selIds = [...selected].filter((id) => list.some((i) => i.id === id));

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleSession = (items: Interview[]) => setSelected((p) => {
    const n = new Set(p); const all = items.every((i) => n.has(i.id));
    items.forEach((i) => (all ? n.delete(i.id) : n.add(i.id))); return n;
  });

  const candidateFor = (i: Interview) => { const a = crm.application.get(i.application_id); return a ? crm.candidate.get(a.candidate_id) : undefined; };

  const changeTime = async (i: Interview, local: string) => {
    if (!local) return;
    const iso = new Date(local).toISOString();
    const app = crm.application.get(i.application_id);
    await run(async () => {
      await updateRow("crm_interviews", i.id, { scheduled_at: iso, status: "Scheduled" });
      if (app) await logEvent({ candidate_id: app.candidate_id, job_id: app.job_id, application_id: app.id, kind: "interview", content: `${i.kind} rescheduled to ${new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` });
    }, { refresh: ["crm_interviews"] });
  };

  const offerDocuments = async (ids: string[]) => {
    const apps = ids.map((id) => crm.interviews.find((i) => i.id === id)).map((i) => i && crm.application.get(i.application_id))
      .filter((a): a is NonNullable<typeof a> => !!a && a.stage === "Interview / Trial");
    if (!apps.length || !confirm(`${apps.length} candidate(s) passed. Move them to Document Verification now?`)) return;
    await run(async () => {
      for (const a of apps) await moveStage(a, "Documents", { job: crm.job.get(a.job_id), candidate: crm.candidate.get(a.candidate_id), applications: crm.applications, documents: crm.documents });
    }, { refresh: ["all"] });
    toast({ title: `${apps.length} moved to Document Verification`, description: "Their document checklists were created." });
  };

  const setResult = async (ids: string[], result: string) => {
    const ok = await run(async () => {
      const { error } = await supabase.from("crm_interviews").update({ result, ...(result !== "Pending" ? { status: "Completed" } : {}) }).in("id", ids);
      if (error) throw error;
      return true;
    }, { success: `${ids.length} marked ${result}`, refresh: ["crm_interviews"] });
    if (ok && result === "Passed") await offerDocuments(ids);
  };

  const setStatus = (ids: string[], status: string) => run(async () => {
    const { error } = await supabase.from("crm_interviews").update({ status }).in("id", ids);
    if (error) throw error;
  }, { success: `${ids.length} marked ${status}`, refresh: ["crm_interviews"] });

  const bulkReschedule = async () => {
    if (!reschedule.when || !selIds.length) return;
    const start = new Date(reschedule.when).getTime();
    const gap = Number(reschedule.gap) * 60000;
    const ordered = list.filter((i) => selIds.includes(i.id));
    await run(async () => {
      for (let k = 0; k < ordered.length; k++) {
        await updateRow("crm_interviews", ordered[k].id, { scheduled_at: new Date(start + gap * k).toISOString(), status: "Scheduled", result: "Pending" });
      }
    }, { success: `${ordered.length} interview(s) rescheduled`, refresh: ["crm_interviews"] });
    setSelected(new Set());
  };

  const inviteText = (i: Interview) => {
    const c = candidateFor(i);
    const app = crm.application.get(i.application_id);
    const j = app ? crm.job.get(app.job_id) : undefined;
    const client = j?.client_id ? crm.client.get(j.client_id) : undefined;
    return [
      `Dear ${c?.full_name.split(" ")[0] ?? "Candidate"},`,
      `Your ${i.kind.toLowerCase()} for ${j?.title ?? "the position"}${client ? ` at ${client.name}` : ""} is scheduled on ${new Date(i.scheduled_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} at ${timeLabel(i.scheduled_at)}.`,
      i.mode === "Online" ? (i.location ? `Meeting link: ${i.location}` : "We will share the meeting link shortly.") : i.location ? `Venue: ${i.location}` : "",
      i.interviewer ? `You will meet: ${i.interviewer}` : "",
      i.feedback ? `Note: ${i.feedback}` : "",
      "Please reply to confirm. – Alba Enterprise",
    ].filter(Boolean).join("\n");
  };

  return (
    <div>
      <PageHeader step={4} title="Interviews & Trials" subtitle="Schedule a whole batch for a vacancy in one go, then mark results and change individual timings here."
        actions={<>
          <Button onClick={() => ui.openBulkSchedule(jobFilter || undefined)}><Users className="w-4 h-4 mr-1" />Schedule many at once</Button>
          <Button variant="outline" onClick={() => ui.openSchedule()}><CalendarPlus className="w-4 h-4 mr-1" />Schedule one</Button>
        </>} />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Tabs value={view} onValueChange={(v) => { setView(v); setSelected(new Set()); }}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="pending">Awaiting result {pendingCount ? `(${pendingCount})` : ""}</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-80 max-w-full">
          <NativeSelect value={jobFilter} onChange={(v) => { if (v) params.set("job", v); else params.delete("job"); setParams(params, { replace: true }); setSelected(new Set()); }}
            placeholder="All vacancies" className="bg-card"
            options={jobsWithInterviews.map((id) => crm.job.get(id)).filter(Boolean).map((j) => ({ value: j!.id, label: [j!.title, j!.location].filter(Boolean).join(" · ") }))} />
        </div>
      </div>

      {selIds.length > 0 && (
        <div className="sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-card shadow-sm px-4 py-3 text-sm">
          <span className="font-semibold mr-1">{selIds.length} selected</span>
          <Button size="sm" variant="outline" className="text-emerald-700" onClick={() => setResult(selIds, "Passed")}>Passed</Button>
          <Button size="sm" variant="outline" className="text-orange-700" onClick={() => setResult(selIds, "On Hold")}>On hold</Button>
          <Button size="sm" variant="outline" className="text-rose-700" onClick={() => setResult(selIds, "Failed")}>Failed</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus(selIds, "No-show")}>No-show</Button>
          <span className="mx-1 h-6 w-px bg-border" />
          <span className="text-muted-foreground">Reschedule:</span>
          <input type="datetime-local" value={reschedule.when} onChange={(e) => setReschedule({ ...reschedule, when: e.target.value })} className="h-9 rounded-md border px-2 bg-background" />
          <select value={reschedule.gap} onChange={(e) => setReschedule({ ...reschedule, gap: e.target.value })} className="h-9 rounded-md border px-2 bg-background">
            <option value="0">same time</option><option value="10">every 10 min</option><option value="15">every 15 min</option><option value="30">every 30 min</option><option value="60">every hour</option>
          </select>
          <Button size="sm" onClick={bulkReschedule} disabled={!reschedule.when}>Apply</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {sessions.length === 0 ? (
        <EmptyState icon={Video} title={view === "pending" ? "All results recorded" : "No interviews here"}
          text="Use “Schedule many at once” to set up interviews for everyone on a vacancy in one go."
          action={<Button onClick={() => ui.openBulkSchedule(jobFilter || undefined)}>Schedule many at once</Button>} />
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const j = crm.job.get(s.jobId);
            const client = j?.client_id ? crm.client.get(j.client_id) : undefined;
            const counts = { Passed: 0, Failed: 0, "On Hold": 0, Pending: 0 } as Record<string, number>;
            s.items.forEach((i) => { counts[i.result] = (counts[i.result] || 0) + 1; });
            const isOpen = !collapsed.has(s.key);
            const allSel = s.items.every((i) => selected.has(i.id));
            const first = s.items[0];
            return (
              <div key={s.key} className="rounded-xl border bg-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/40 border-b">
                  <Checkbox checked={allSel} onCheckedChange={() => toggleSession(s.items)} aria-label="Select whole session" />
                  <button className="flex items-center gap-2 text-left flex-1 min-w-[240px]" onClick={() => setCollapsed((p) => { const n = new Set(p); if (n.has(s.key)) n.delete(s.key); else n.add(s.key); return n; })}>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span>
                      <span className="font-semibold">{j?.title ?? "Requirement"}</span>
                      <span className="text-muted-foreground">{[j?.location, client?.name].filter(Boolean).map((x) => ` · ${x}`).join("")}</span>
                      <span className={`block text-xs ${s.date === today ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {s.date === today ? "Today · " : ""}{dayLabel(s.date)} · {s.items.length} candidate(s) · {first.kind}, {first.mode}{first.location ? ` · ${first.location}` : ""}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Pill tone={RESULT_TONE.Passed}>{counts.Passed} passed</Pill>
                    <Pill tone={RESULT_TONE["On Hold"]}>{counts["On Hold"]} on hold</Pill>
                    <Pill tone={RESULT_TONE.Failed}>{counts.Failed} failed</Pill>
                    <Pill tone={RESULT_TONE.Pending}>{counts.Pending} pending</Pill>
                  </div>
                </div>
                {isOpen && (
                  <div className="divide-y">
                    {s.items.map((i) => {
                      const c = candidateFor(i);
                      return (
                        <div key={i.id} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${selected.has(i.id) ? "bg-primary/5" : ""}`}>
                          <Checkbox checked={selected.has(i.id)} onCheckedChange={() => toggle(i.id)} aria-label={`Select ${c?.full_name}`} />
                          <input type="datetime-local" defaultValue={toLocalInput(i.scheduled_at)} key={i.scheduled_at}
                            onBlur={(e) => e.target.value && e.target.value !== toLocalInput(i.scheduled_at) && changeTime(i, e.target.value)}
                            className="h-9 rounded-md border px-2 text-sm bg-background w-[200px]" title="Change this candidate's time" />
                          <button onClick={() => ui.openApplication(i.application_id)} className="flex-1 min-w-[180px] text-left">
                            <span className="font-medium hover:text-primary block">{c?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{[c?.phone, c ? positionAnswerOf(c) : null].filter(Boolean).join(" · ")}</span>
                          </button>
                          {c?.phone && (
                            <Button size="sm" variant="ghost" className="text-emerald-700" asChild title="Send interview details on WhatsApp">
                              <a href={`${waLink(c.phone)}?text=${encodeURIComponent(inviteText(i))}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" />Invite</a>
                            </Button>
                          )}
                          <div className="w-32"><NativeSelect value={i.status} onChange={(v) => setStatus([i.id], v)} options={INTERVIEW_STATUSES} className="h-9" /></div>
                          <div className="w-28"><NativeSelect value={i.result} onChange={(v) => setResult([i.id], v)} options={INTERVIEW_RESULTS} className={`h-9 ${RESULT_TONE[i.result] ?? ""}`} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {sessions.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          <MapPin className="w-3 h-3" />Tip: tick the box on a session header to select all its candidates, then mark results or reschedule them together.
        </p>
      )}
    </div>
  );
};

export default InterviewsPage;
