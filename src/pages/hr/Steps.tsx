import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, CalendarPlus, Video, FileCheck2, FileSignature, HeartHandshake, ChevronRight, Check, XCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatDate, todayISO, toISODate } from "@/lib/crm";
import {
  DOC_TONE, INTERVIEW_RESULTS, INTERVIEW_STATUSES, OFFER_STATUSES, RESULT_TONE, type Application,
  moveStage, screeningScore, stageTone, updateRow, useCrm,
} from "@/lib/hr/model";
import { EmptyState, NativeSelect, PageHeader, Pill, ScoreInput, StatCard, useAction, useHrUi } from "@/components/hr/ui";
import { FollowupRow } from "@/components/hr/ApplicationSheet";

const useMover = () => {
  const crm = useCrm();
  const run = useAction();
  const { toast } = useToast();
  return async (app: Application, stage: string, extra: Partial<Application> = {}) => {
    const r = await run(() => moveStage(app, stage, { job: crm.job.get(app.job_id), candidate: crm.candidate.get(app.candidate_id), applications: crm.applications, documents: crm.documents }, extra), { refresh: ["all"] });
    if (r) toast({ title: `${crm.candidate.get(app.candidate_id)?.full_name} → ${stage}`, description: r.notes.join(" · ") || undefined });
  };
};

const JobFilter = ({ value, onChange, jobIds }: { value: string; onChange: (v: string) => void; jobIds: string[] }) => {
  const crm = useCrm();
  const ids = [...new Set(jobIds)];
  return (
    <div className="w-64">
      <NativeSelect value={value} onChange={onChange} placeholder="All requirements" className="bg-card"
        options={ids.map((id) => crm.job.get(id)).filter(Boolean).map((j) => ({ value: j!.id, label: `${j!.title}${j!.client_id ? ` · ${crm.client.get(j!.client_id)?.name ?? ""}` : ""}` }))} />
    </div>
  );
};

/* ================================================================ Step 3 */

export const Screening = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const move = useMover();
  const [job, setJob] = useState("");
  const [stage, setStage] = useState("");
  const STAGES3 = ["Sourced", "Screening", "Shortlisted", "CV Sent to Client"];
  const all = crm.applications.filter((a) => STAGES3.includes(a.stage));
  const rows = all.filter((a) => (!job || a.job_id === job) && (!stage || a.stage === stage))
    .sort((a, b) => STAGES3.indexOf(a.stage) - STAGES3.indexOf(b.stage) || (screeningScore(b) ?? 0) - (screeningScore(a) ?? 0));

  const score = (a: Application, k: keyof Application, v: number | null) =>
    run(async () => { await updateRow("crm_applications", a.id, { [k]: v, ...(a.stage === "Sourced" ? { stage: "Screening" } : {}) }); }, { refresh: ["crm_applications"] });

  return (
    <div>
      <PageHeader step={3} title="Screening & Shortlisting" subtitle="Rate skills, experience, communication and grooming. Shortlist the best and send profiles to the client in one click." />
      <div className="flex flex-wrap gap-2 mb-5">
        <JobFilter value={job} onChange={setJob} jobIds={all.map((a) => a.job_id)} />
        <div className="flex gap-1 flex-wrap">
          {["", ...STAGES3].map((s) => (
            <Button key={s || "all"} size="sm" variant={stage === s ? "default" : "outline"} onClick={() => setStage(s)}>
              {s || "All"} <span className="ml-1 opacity-70">{s ? all.filter((a) => a.stage === s).length : all.length}</span>
            </Button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={UserCheck} title="Nobody waiting for screening" text="Add candidates to a requirement and they will appear here to be screened." action={<Button asChild><Link to="/hr/requirements">Go to requirements</Link></Button>} />
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr className="text-left"><th className="px-4 py-3 font-medium">Candidate</th><th className="px-3 py-3 font-medium">Requirement</th><th className="px-3 py-3 font-medium">Skills</th><th className="px-3 py-3 font-medium">Experience</th><th className="px-3 py-3 font-medium">Communication</th><th className="px-3 py-3 font-medium">Grooming</th><th className="px-3 py-3 font-medium">Avg</th><th className="px-3 py-3 font-medium">Stage</th><th className="px-3 py-3" /></tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const c = crm.candidate.get(a.candidate_id);
                const j = crm.job.get(a.job_id);
                const avg = screeningScore(a);
                return (
                  <tr key={a.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2.5"><button onClick={() => ui.openApplication(a.id)} className="text-left"><span className="font-medium hover:text-primary block">{c?.full_name}</span><span className="text-xs text-muted-foreground">{[c?.job_role, c?.experience].filter(Boolean).join(" · ")}</span></button></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{j?.title}</td>
                    {(["score_skill", "score_experience", "score_communication", "score_grooming"] as const).map((k) => (
                      <td key={k} className="px-3 py-2.5"><ScoreInput value={a[k]} onChange={(v) => score(a, k, v)} size="w-4 h-4" /></td>
                    ))}
                    <td className="px-3 py-2.5 font-semibold tabular-nums">{avg != null ? avg.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2.5"><Pill tone={stageTone(a.stage)}>{a.stage}</Pill></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 justify-end">
                        {(a.stage === "Sourced" || a.stage === "Screening") && <Button size="sm" variant="outline" onClick={() => move(a, "Shortlisted")}><Check className="w-3.5 h-3.5 mr-1" />Shortlist</Button>}
                        {a.stage === "Shortlisted" && <Button size="sm" variant="outline" onClick={() => ui.openApplication(a.id)}>Send to client</Button>}
                        {a.stage === "CV Sent to Client" && <Button size="sm" variant="outline" onClick={() => ui.openSchedule(a.id)}><CalendarPlus className="w-3.5 h-3.5 mr-1" />Interview</Button>}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-700" title="Reject" onClick={() => move(a, "Rejected", { rejection_reason: "Not suitable at screening" })}><XCircle className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ================================================================ Step 4 */

export const Interviews = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const move = useMover();
  const [view, setView] = useState("upcoming");
  const today = todayISO();

  const list = useMemo(() => {
    const now = new Date(Date.now() - 2 * 3600000).toISOString();
    const xs = crm.interviews.filter((i) => {
      if (view === "upcoming") return i.scheduled_at >= now && i.status !== "Cancelled";
      if (view === "pending") return i.scheduled_at < now && i.result === "Pending" && i.status !== "Cancelled";
      if (view === "past") return i.scheduled_at < now;
      return true;
    });
    return view === "upcoming" ? xs.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)) : xs.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  }, [crm.interviews, view]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    list.forEach((i) => { const d = toISODate(new Date(i.scheduled_at)); m.set(d, [...(m.get(d) || []), i]); });
    return [...m.entries()];
  }, [list]);

  const pendingCount = crm.interviews.filter((i) => i.scheduled_at < new Date(Date.now() - 2 * 3600000).toISOString() && i.result === "Pending" && i.status !== "Cancelled").length;

  return (
    <div>
      <PageHeader step={4} title="Interviews & Trials" subtitle="Client interviews plus cooking or service trials, online, in person or on site. Record the result and move passed candidates to documents."
        actions={<Button onClick={() => ui.openSchedule()}><CalendarPlus className="w-4 h-4 mr-1" />Schedule</Button>} />
      <Tabs value={view} onValueChange={setView} className="mb-5">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Awaiting result {pendingCount ? `(${pendingCount})` : ""}</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
      {groups.length === 0 ? (
        <EmptyState icon={Video} title={view === "pending" ? "All results recorded" : "No interviews here"} text="Schedule interviews and trials from any candidate in the pipeline." action={<Button onClick={() => ui.openSchedule()}>Schedule interview</Button>} />
      ) : (
        <div className="space-y-6">
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className={`text-sm font-semibold mb-2 ${date === today ? "text-primary" : ""}`}>{date === today ? "Today · " : ""}{new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
              <div className="rounded-xl border bg-card divide-y">
                {items.map((i) => {
                  const a = crm.application.get(i.application_id);
                  const c = a ? crm.candidate.get(a.candidate_id) : undefined;
                  const j = a ? crm.job.get(a.job_id) : undefined;
                  return (
                    <div key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="w-16 font-semibold tabular-nums">{new Date(i.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      <button onClick={() => a && ui.openApplication(a.id)} className="flex-1 min-w-[200px] text-left">
                        <span className="font-medium hover:text-primary block">{c?.full_name}</span>
                        <span className="text-xs text-muted-foreground">{i.kind} · {i.mode} · {j?.title}{j?.client_id ? ` · ${crm.client.get(j.client_id)?.name}` : ""}</span>
                        {i.location && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{i.location}</span>}
                      </button>
                      <div className="w-32"><NativeSelect value={i.status} onChange={(v) => run(() => updateRow("crm_interviews", i.id, { status: v }), { refresh: ["crm_interviews"] })} options={INTERVIEW_STATUSES} className="h-8" /></div>
                      <div className="w-28"><NativeSelect value={i.result} onChange={async (v) => {
                        await run(() => updateRow("crm_interviews", i.id, { result: v, status: v !== "Pending" ? "Completed" : i.status }), { success: `Result: ${v}`, refresh: ["crm_interviews"] });
                        if (v === "Passed" && a && a.stage === "Interview / Trial" && confirm(`${c?.full_name} passed. Move to Document Verification?`)) move(a, "Documents");
                      }} options={INTERVIEW_RESULTS} className={`h-8 ${RESULT_TONE[i.result] ?? ""}`} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================================================================ Step 5 */

export const Documents = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const move = useMover();
  const apps = crm.applications.filter((a) => a.stage === "Documents");

  return (
    <div>
      <PageHeader step={5} title="Document Verification" subtitle="Check candidate documents, experience and references. Files are stored privately and visible only to staff." />
      {apps.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No candidates at document stage" text="When a candidate passes the interview, move them to Documents and a checklist is created automatically." />
      ) : (
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {apps.map((a) => {
            const c = crm.candidate.get(a.candidate_id);
            const j = crm.job.get(a.job_id);
            const docs = crm.documents.filter((d) => d.candidate_id === a.candidate_id);
            const verified = docs.filter((d) => d.status === "Verified").length;
            const allDone = docs.length > 0 && verified === docs.length;
            return (
              <div key={a.id} className="rounded-xl border bg-card p-5 space-y-3">
                <button onClick={() => ui.openApplication(a.id)} className="text-left w-full">
                  <p className="font-semibold hover:text-primary">{c?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{j?.title}{j?.client_id ? ` · ${crm.client.get(j.client_id)?.name}` : ""}</p>
                </button>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>{verified}/{docs.length} verified</span>{allDone && <span className="text-emerald-700 font-medium">Ready for offer</span>}</div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${docs.length ? (verified / docs.length) * 100 : 0}%` }} /></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {docs.map((d) => <Pill key={d.id} tone={DOC_TONE[d.status] ?? ""}>{d.doc_type}</Pill>)}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => ui.openApplication(a.id)}>Open checklist</Button>
                  <Button size="sm" disabled={!allDone} onClick={() => move(a, "Offer", { offer_status: "Draft" })}>Move to offer <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================================================================ Step 6 */

export const Offers = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const move = useMover();
  const today = todayISO();
  const weekEnd = toISODate(new Date(Date.now() + 7 * 86400000));
  const monthStart = today.slice(0, 8) + "01";
  const offers = crm.applications.filter((a) => a.stage === "Offer").sort((a, b) => (a.joining_date || "9999").localeCompare(b.joining_date || "9999"));
  const joined = crm.applications.filter((a) => a.stage === "Joined").sort((a, b) => (b.joined_on || "").localeCompare(a.joined_on || ""));

  return (
    <div className="space-y-6">
      <PageHeader step={6} title="Offer & Joining" subtitle="Coordinate offers, joining dates and candidate reporting. Marking someone as joined schedules their follow-ups automatically." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileSignature} label="Offers in progress" value={offers.length} />
        <StatCard icon={FileSignature} label="Accepted, yet to join" value={offers.filter((a) => a.offer_status === "Accepted").length} tone="bg-lime-100 text-lime-700" />
        <StatCard icon={CalendarPlus} label="Joining in 7 days" value={offers.filter((a) => a.joining_date && a.joining_date >= today && a.joining_date <= weekEnd).length} tone="bg-amber-100 text-amber-700" />
        <StatCard icon={Check} label="Joined this month" value={joined.filter((a) => (a.joined_on || "") >= monthStart).length} tone="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <div className="px-5 py-3 border-b font-semibold">Offers</div>
        {offers.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No open offers. Candidates arrive here after document verification.</p> : (
          <table className="w-full text-sm min-w-[860px]">
            <thead className="text-xs text-muted-foreground bg-muted/40"><tr className="text-left"><th className="px-5 py-2.5 font-medium">Candidate</th><th className="px-3 py-2.5 font-medium">Requirement</th><th className="px-3 py-2.5 font-medium">Salary offered</th><th className="px-3 py-2.5 font-medium">Offer status</th><th className="px-3 py-2.5 font-medium">Joining date</th><th className="px-3 py-2.5" /></tr></thead>
            <tbody>
              {offers.map((a) => {
                const c = crm.candidate.get(a.candidate_id);
                const j = crm.job.get(a.job_id);
                const late = a.joining_date && a.joining_date < today;
                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-5 py-2.5"><button onClick={() => ui.openApplication(a.id)} className="font-medium hover:text-primary">{c?.full_name}</button></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{j?.title}{j?.client_id ? ` · ${crm.client.get(j.client_id)?.name}` : ""}</td>
                    <td className="px-3 py-2.5">{a.offer_salary || <button className="text-primary text-xs" onClick={() => ui.openApplication(a.id)}>Add</button>}</td>
                    <td className="px-3 py-2.5 w-36"><NativeSelect value={a.offer_status} onChange={(v) => run(() => updateRow("crm_applications", a.id, { offer_status: v || null }), { refresh: ["crm_applications"] })} options={OFFER_STATUSES} placeholder="—" className="h-8" /></td>
                    <td className="px-3 py-2.5 w-40"><input type="date" value={a.joining_date ?? ""} onChange={(e) => run(() => updateRow("crm_applications", a.id, { joining_date: e.target.value || null }), { refresh: ["crm_applications"] })} className={`h-8 rounded-md border px-2 text-sm bg-background ${late ? "text-rose-700 border-rose-300" : ""}`} /></td>
                    <td className="px-3 py-2.5 text-right"><Button size="sm" onClick={() => move(a, "Joined", { offer_status: "Accepted", joined_on: a.joining_date && a.joining_date <= today ? a.joining_date : today })}>Mark joined</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <div className="px-5 py-3 border-b font-semibold">Recently joined</div>
        {joined.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No placements yet.</p> : (
          <table className="w-full text-sm min-w-[700px]">
            <tbody>
              {joined.slice(0, 25).map((a) => (
                <tr key={a.id} className="border-t first:border-0">
                  <td className="px-5 py-2.5"><button onClick={() => ui.openApplication(a.id)} className="font-medium hover:text-primary">{crm.candidate.get(a.candidate_id)?.full_name}</button></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{crm.job.get(a.job_id)?.title}</td>
                  <td className="px-3 py-2.5">{a.offer_salary}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">Joined {formatDate(a.joined_on)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ================================================================ Step 7 */

export const Followups = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const [view, setView] = useState("due");
  const today = todayISO();
  const list = crm.followups.filter((f) => view === "due" ? f.status === "Pending" && f.due_date <= today : view === "upcoming" ? f.status === "Pending" && f.due_date > today : f.status === "Done")
    .sort((a, b) => view === "done" ? (b.done_at || "").localeCompare(a.done_at || "") : a.due_date.localeCompare(b.due_date));
  const dueCount = crm.followups.filter((f) => f.status === "Pending" && f.due_date <= today).length;
  const rated = crm.followups.filter((f) => f.satisfaction);
  const avg = rated.length ? rated.reduce((s, f) => s + (f.satisfaction || 0), 0) / rated.length : null;

  return (
    <div>
      <PageHeader step={7} title="Follow-up & Support" subtitle="Continued support after joining to ensure client satisfaction. Day 1, 7, 30 and 90 check-ins are created automatically." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={HeartHandshake} label="Due or overdue" value={dueCount} tone="bg-rose-100 text-rose-700" />
        <StatCard icon={HeartHandshake} label="Upcoming" value={crm.followups.filter((f) => f.status === "Pending" && f.due_date > today).length} />
        <StatCard icon={HeartHandshake} label="Avg client satisfaction" value={avg ? `${avg.toFixed(1)}/5` : "—"} tone="bg-amber-100 text-amber-700" />
      </div>
      <Tabs value={view} onValueChange={setView} className="mb-4">
        <TabsList><TabsTrigger value="due">Due now {dueCount ? `(${dueCount})` : ""}</TabsTrigger><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="done">Completed</TabsTrigger></TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState icon={HeartHandshake} title={view === "due" ? "You're all caught up" : "Nothing here"} text="Follow-ups appear when candidates join." />
      ) : (
        <div className="space-y-2">
          {list.map((f) => {
            const a = crm.application.get(f.application_id);
            const c = a ? crm.candidate.get(a.candidate_id) : undefined;
            const j = a ? crm.job.get(a.job_id) : undefined;
            return (
              <FollowupRow key={f.id} f={f} showContext={
                <span className="text-xs text-muted-foreground">
                  <span role="link" tabIndex={0} className="text-foreground font-medium hover:text-primary cursor-pointer" onClick={(e) => { e.stopPropagation(); if (a) ui.openApplication(a.id); }}>{c?.full_name}</span>
                  {" · "}{j?.title}{j?.client_id ? ` at ${crm.client.get(j.client_id)?.name}` : ""}{a?.joined_on ? ` · joined ${formatDate(a.joined_on)}` : ""}
                </span>
              } />
            );
          })}
        </div>
      )}
    </div>
  );
};
