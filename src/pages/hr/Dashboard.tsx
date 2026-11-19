import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, Users, CalendarClock, BadgeCheck, AlertCircle, ListTodo, Clock, Activity as ActivityIcon, ArrowRight, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatDateTime, todayISO, toISODate } from "@/lib/crm";
import { ACTIVE_STAGES, PRIORITY_TONE, PROCESS_STEPS, type Activity, updateRow, useCrm } from "@/lib/hr/model";
import { Card, Pill, StatCard, useAction, useHrUi } from "@/components/hr/ui";

const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };

const Dashboard = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const today = todayISO();

  const recent = useQuery({
    queryKey: ["crm", "crm_activities", "recent"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_activities").select("*").order("created_at", { ascending: false }).limit(12);
      return (data as Activity[]) || [];
    },
  });

  const d = useMemo(() => {
    const weekEnd = toISODate(new Date(Date.now() + 7 * 86400000));
    const monthStart = today.slice(0, 8) + "01";
    const openJobs = crm.jobs.filter((j) => j.status === "Open");
    const joinedFor = (jobId: string) => crm.applications.filter((a) => a.job_id === jobId && a.stage === "Joined").length;
    const positionsLeft = openJobs.reduce((s, j) => s + Math.max(0, j.openings - joinedFor(j.id)), 0);
    const stageCount = (stages: string[]) => crm.applications.filter((a) => stages.includes(a.stage)).length;
    return {
      openJobs: openJobs
        .map((j) => ({ j, joined: joinedFor(j.id), inPipe: crm.applications.filter((a) => a.job_id === j.id && ACTIVE_STAGES.includes(a.stage)).length }))
        .sort((a, b) => (PRIORITY_ORDER[a.j.priority] ?? 2) - (PRIORITY_ORDER[b.j.priority] ?? 2) || (a.j.target_date || "9999").localeCompare(b.j.target_date || "9999")),
      positionsLeft,
      active: stageCount(ACTIVE_STAGES),
      interviewsWeek: crm.interviews.filter((i) => i.status === "Scheduled" && i.scheduled_at.slice(0, 10) >= today && i.scheduled_at.slice(0, 10) <= weekEnd).length,
      joinedMonth: crm.applications.filter((a) => a.stage === "Joined" && (a.joined_on || "") >= monthStart).length,
      interviewsToday: crm.interviews.filter((i) => i.scheduled_at.slice(0, 10) === today && i.status !== "Cancelled").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
      followupsDue: crm.followups.filter((f) => f.status === "Pending" && f.due_date <= today),
      tasksDue: crm.tasks.filter((t) => !t.done && t.due_date && t.due_date <= today),
      joiningsSoon: crm.applications.filter((a) => a.stage === "Offer" && a.joining_date && a.joining_date >= today && a.joining_date <= weekEnd),
      steps: {
        1: openJobs.length,
        2: crm.candidates.length,
        3: stageCount(["Sourced", "Screening", "Shortlisted", "CV Sent to Client"]),
        4: stageCount(["Interview / Trial"]),
        5: stageCount(["Documents"]),
        6: stageCount(["Offer"]),
        7: crm.followups.filter((f) => f.status === "Pending").length,
      } as Record<number, number>,
    };
  }, [crm.jobs, crm.applications, crm.candidates, crm.interviews, crm.followups, crm.tasks, today]);

  const appLabel = (appId: string) => {
    const a = crm.application.get(appId);
    if (!a) return { name: "?", job: "" };
    return { name: crm.candidate.get(a.candidate_id)?.full_name ?? "?", job: crm.job.get(a.job_id)?.title ?? "" };
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = (profile?.full_name || user?.email || "").split(/[ @]/)[0];
  const agendaEmpty = !d.interviewsToday.length && !d.followupsDue.length && !d.tasksDue.length && !d.joiningsSoon.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greet}{first && first !== "hr" ? `, ${first}` : ""}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => ui.openNewCandidate()}>Add candidate</Button>
          <Button onClick={() => ui.openNewJob()}>New requirement</Button>
        </div>
      </div>

      {/* Process strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {PROCESS_STEPS.map((s) => (
          <Link key={s.n} to={s.path} className="group rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary">STEP {String(s.n).padStart(2, "0")}</span>
              <s.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2 tabular-nums">{d.steps[s.n]}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{s.title}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Positions to fill" value={d.positionsLeft} hint={`${d.openJobs.length} open requirements`} onClick={() => navigate("/hr/requirements")} />
        <StatCard icon={Users} label="Candidates in process" value={d.active} tone="bg-indigo-100 text-indigo-700" onClick={() => navigate("/hr/pipeline")} />
        <StatCard icon={CalendarClock} label="Interviews next 7 days" value={d.interviewsWeek} tone="bg-amber-100 text-amber-700" onClick={() => navigate("/hr/interviews")} />
        <StatCard icon={BadgeCheck} label="Joined this month" value={d.joinedMonth} tone="bg-emerald-100 text-emerald-700" onClick={() => navigate("/hr/offers")} />
      </div>

      <div className="grid xl:grid-cols-5 gap-6">
        <Card title="Today's agenda" icon={Clock} className="xl:col-span-3">
          {agendaEmpty ? <p className="text-sm text-muted-foreground py-6 text-center">Nothing due today. Great time to source new candidates.</p> : (
            <div className="space-y-5">
              {d.interviewsToday.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Interviews & trials</p>
                  <ul className="divide-y">{d.interviewsToday.map((i) => { const l = appLabel(i.application_id); return (
                    <li key={i.id}><button onClick={() => ui.openApplication(i.application_id)} className="w-full flex items-center gap-3 py-2 text-left hover:text-primary">
                      <span className="text-sm font-semibold w-16 tabular-nums">{new Date(i.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="flex-1 min-w-0"><span className="block text-sm font-medium truncate">{l.name}</span><span className="block text-xs text-muted-foreground truncate">{i.kind} · {l.job}</span></span>
                      <Pill tone="bg-amber-50 text-amber-800 border-amber-200">{i.mode}</Pill>
                    </button></li>); })}</ul>
                </div>
              )}
              {d.joiningsSoon.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Joining this week</p>
                  <ul className="divide-y">{d.joiningsSoon.map((a) => (
                    <li key={a.id}><button onClick={() => ui.openApplication(a.id)} className="w-full flex items-center gap-3 py-2 text-left hover:text-primary">
                      <span className="flex-1 text-sm"><span className="font-medium">{crm.candidate.get(a.candidate_id)?.full_name}</span> <span className="text-muted-foreground">→ {crm.job.get(a.job_id)?.title}</span></span>
                      <span className="text-xs text-muted-foreground">{formatDate(a.joining_date)}</span>
                    </button></li>))}</ul>
                </div>
              )}
              {d.followupsDue.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Post-joining follow-ups</p>
                  <ul className="divide-y">{d.followupsDue.slice(0, 6).map((f) => { const l = appLabel(f.application_id); return (
                    <li key={f.id}><button onClick={() => ui.openApplication(f.application_id)} className="w-full flex items-center gap-3 py-2 text-left hover:text-primary">
                      <span className="flex-1 min-w-0 text-sm truncate"><span className="font-medium">{l.name}</span> <span className="text-muted-foreground">· {f.title}</span></span>
                      <span className={`text-xs ${f.due_date < today ? "text-rose-700 font-semibold" : "text-muted-foreground"}`}>{f.due_date < today ? "Overdue" : "Today"}</span>
                    </button></li>); })}</ul>
                  {d.followupsDue.length > 6 && <Link to="/hr/followups" className="text-xs text-primary">View all {d.followupsDue.length}</Link>}
                </div>
              )}
              {d.tasksDue.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Tasks</p>
                  <ul className="divide-y">{d.tasksDue.slice(0, 6).map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2">
                      <button onClick={() => run(() => updateRow("crm_tasks", t.id, { done: true }), { success: "Task done", refresh: ["crm_tasks"] })} className="w-5 h-5 rounded border-2 border-muted-foreground/40 hover:border-primary flex items-center justify-center" aria-label="Mark done"><Check className="w-3 h-3 opacity-0 hover:opacity-100" /></button>
                      <span className="flex-1 text-sm">{t.title}</span>
                      {t.due_date! < today && <span className="text-xs text-rose-700 font-semibold">Overdue</span>}
                    </li>))}</ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Recent activity" icon={ActivityIcon} className="xl:col-span-2">
          {(recent.data || []).length === 0 ? <p className="text-sm text-muted-foreground">Activity from you and your team appears here.</p> : (
            <ol className="space-y-3">
              {(recent.data || []).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="leading-snug">
                    {a.candidate_id && crm.candidate.get(a.candidate_id) ? <Link to={`/hr/candidates/${a.candidate_id}`} className="font-medium hover:text-primary">{crm.candidate.get(a.candidate_id)!.full_name}: </Link> : null}
                    {a.content}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card title="Open requirements" icon={AlertCircle} actions={<Link to="/hr/requirements" className="text-sm text-primary inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>}>
        {d.openJobs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">No open requirements. Start with Step 1 when a client shares a vacancy.</p>
            <Button onClick={() => ui.openNewJob()}>Create requirement</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2 pr-4 font-medium">Requirement</th><th className="py-2 pr-4 font-medium">Client</th><th className="py-2 pr-4 font-medium">Priority</th><th className="py-2 pr-4 font-medium">Target</th><th className="py-2 pr-4 font-medium">In pipeline</th><th className="py-2 font-medium w-40">Filled</th></tr></thead>
              <tbody>
                {d.openJobs.slice(0, 8).map(({ j, joined, inPipe }) => (
                  <tr key={j.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/hr/requirements/${j.id}`)}>
                    <td className="py-2.5 pr-4 font-medium">{j.title}{j.location && <span className="text-muted-foreground font-normal"> · {j.location}</span>}</td>
                    <td className="py-2.5 pr-4">{j.client_id ? crm.client.get(j.client_id)?.name : "—"}</td>
                    <td className="py-2.5 pr-4"><Pill tone={PRIORITY_TONE[j.priority] ?? ""}>{j.priority}</Pill></td>
                    <td className={`py-2.5 pr-4 ${j.target_date && j.target_date < today ? "text-rose-700 font-medium" : ""}`}>{j.target_date ? formatDate(j.target_date) : "—"}</td>
                    <td className="py-2.5 pr-4">{inPipe}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2"><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (joined / j.openings) * 100)}%` }} /></div><span className="text-xs tabular-nums">{joined}/{j.openings}</span></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {crm.tasks.length === 0 && crm.candidates.length === 0 && (
        <Card title="Getting started" icon={ListTodo}>
          <ol className="grid md:grid-cols-3 gap-4 text-sm">
            <li className="rounded-lg bg-muted/50 p-4"><p className="font-semibold mb-1">1. Add your clients</p><p className="text-muted-foreground">Hotels and properties you recruit for, with contact details and terms.</p></li>
            <li className="rounded-lg bg-muted/50 p-4"><p className="font-semibold mb-1">2. Import your candidates</p><p className="text-muted-foreground">Upload your Excel sheet of WhatsApp and email leads from the + New menu.</p></li>
            <li className="rounded-lg bg-muted/50 p-4"><p className="font-semibold mb-1">3. Create requirements</p><p className="text-muted-foreground">Then add matching candidates and move them through the 7 steps.</p></li>
          </ol>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
