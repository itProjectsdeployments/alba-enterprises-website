import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Plus, Phone, MessageCircle, Mail, ArrowLeft, Pencil, Trash2, ListTodo, Check, BarChart3, Search, Download } from "lucide-react";
import ClientExportDialog from "@/components/hr/ClientExportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, todayISO, waLink, CRM_SOURCES } from "@/lib/crm";
import {
  CLIENT_STATUSES, JOB_STATUS_TONE, PRIORITY_TONE, STAGES, deleteRow, updateRow, useActivities, useCrm, type Client, type Task,
} from "@/lib/hr/model";
import { Card, EmptyState, NativeSelect, PageHeader, Pill, StatCard, useAction, useHrUi } from "@/components/hr/ui";
import { ClientDialog, TaskDialog } from "@/components/hr/dialogs";
import StageBoard from "@/components/hr/StageBoard";
import ApplicationsTable from "@/components/hr/ApplicationsTable";

/* ============================================================== Pipeline */

export const Pipeline = () => {
  const crm = useCrm();
  const [job, setJob] = useState("");
  const [client, setClient] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [view, setView] = useState<"table" | "board">("table");
  const apps = crm.applications.filter((a) => {
    const j = crm.job.get(a.job_id);
    return (!job || a.job_id === job) && (!client || j?.client_id === client) && (job || j?.status === "Open" || j?.status === "On Hold" || a.stage === "Joined");
  });
  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Every candidate on every open requirement. Click a name for full details, or switch to Board to drag cards." />
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="w-64"><NativeSelect value={client} onChange={(v) => { setClient(v); setJob(""); }} options={crm.clients.map((c) => ({ value: c.id, label: c.name }))} placeholder="All clients" className="bg-card" /></div>
        <div className="w-72"><NativeSelect value={job} onChange={setJob} options={crm.jobs.filter((j) => !client || j.client_id === client).map((j) => ({ value: j.id, label: `${j.title} (${j.status})` }))} placeholder="All open requirements" className="bg-card" /></div>
        {view === "board" && <Button variant="ghost" onClick={() => setShowClosed(!showClosed)}>{showClosed ? "Hide" : "Show"} rejected/dropped</Button>}
        <div className="inline-flex rounded-lg border bg-card p-0.5 text-sm ml-auto">
          <button onClick={() => setView("table")} className={`px-3 py-1 rounded-md ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Table</button>
          <button onClick={() => setView("board")} className={`px-3 py-1 rounded-md ${view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Board</button>
        </div>
      </div>
      {apps.length === 0 ? <EmptyState icon={BarChart3} title="Pipeline is empty" text="Create a requirement and add candidates to it to start." action={<Button asChild><Link to="/hr/requirements">Requirements</Link></Button>} />
        : view === "table" ? <ApplicationsTable applications={apps} showJob={!job} jobId={job || undefined} /> : <StageBoard applications={apps} showJob={!job} hideClosed={!showClosed} />}
    </div>
  );
};

/* =============================================================== Clients */

export const Clients = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const rows = crm.clients.filter((c) => (!status || c.status === status) && (!q || [c.name, c.city, c.contact_person].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <PageHeader title="Clients" subtitle="Hotels and hospitality businesses you recruit for." actions={<Button onClick={() => ui.openNewClient()}><Plus className="w-4 h-4 mr-1" />New client</Button>} />
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-9 bg-card" placeholder="Search clients..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="w-40"><NativeSelect value={status} onChange={setStatus} options={CLIENT_STATUSES} placeholder="All statuses" className="bg-card" /></div>
      </div>
      {rows.length === 0 ? <EmptyState icon={Building2} title="No clients yet" text="Add the hotels you work with to link requirements, contacts and placements." action={<Button onClick={() => ui.openNewClient()}>Add client</Button>} /> : (
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {rows.map((c) => {
            const jobs = crm.jobs.filter((j) => j.client_id === c.id);
            const placed = crm.applications.filter((a) => a.stage === "Joined" && jobs.some((j) => j.id === a.job_id)).length;
            return (
              <button key={c.id} onClick={() => navigate(`/hr/clients/${c.id}`)} className="text-left rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{[c.property_type, c.city].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Pill tone={c.status === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground border-border"}>{c.status}</Pill>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-lg bg-muted/50 py-2"><p className="text-lg font-bold">{jobs.filter((j) => j.status === "Open").length}</p><p className="text-[11px] text-muted-foreground">Open reqs</p></div>
                  <div className="rounded-lg bg-muted/50 py-2"><p className="text-lg font-bold">{jobs.length}</p><p className="text-[11px] text-muted-foreground">Total reqs</p></div>
                  <div className="rounded-lg bg-muted/50 py-2"><p className="text-lg font-bold">{placed}</p><p className="text-[11px] text-muted-foreground">Placed</p></div>
                </div>
                {c.contact_person && <p className="text-xs text-muted-foreground mt-3 truncate">Contact: {c.contact_person}{c.contact_phone ? ` · ${c.contact_phone}` : ""}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const [edit, setEdit] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const activities = useActivities({ client_id: id });
  const c = crm.client.get(id || "");
  if (!c) return crm.loading ? null : <p className="text-muted-foreground">Client not found. <Link to="/hr/clients" className="text-primary">Back</Link></p>;
  const jobs = crm.jobs.filter((j) => j.client_id === c.id);
  const placements = crm.applications.filter((a) => a.stage === "Joined" && jobs.some((j) => j.id === a.job_id));

  const remove = async () => {
    if (!confirm(`Delete ${c.name}? Its requirements stay but will no longer be linked to a client.`)) return;
    const ok = await run(() => deleteRow("crm_clients", c.id), { success: "Client deleted", refresh: ["all"] });
    if (ok !== undefined) navigate("/hr/clients");
  };

  return (
    <div className="space-y-6">
      <Link to="/hr/clients" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Clients</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{c.name}</h1>
          <p className="text-muted-foreground">{[c.property_type, c.city, c.status].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}><Download className="w-4 h-4 mr-1" />Export for client</Button>
          <Button onClick={() => ui.openBulkJobs(c.id)}><Plus className="w-4 h-4 mr-1" />Add multiple positions</Button>
          <Button variant="outline" onClick={() => ui.openNewJob(c.id)}><Plus className="w-4 h-4 mr-1" />New requirement</Button>
          <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="w-4 h-4 mr-1" />Edit</Button>
          <Button variant="ghost" size="icon" onClick={() => ui.openNewTask({ client_id: c.id })} title="Add task"><ListTodo className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-rose-700" onClick={remove} title="Delete"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Requirements (${jobs.length})`}>
            {jobs.length === 0 ? <p className="text-sm text-muted-foreground">No requirements yet.</p> : (
              <ul className="divide-y">{jobs.map((j) => {
                const joined = crm.applications.filter((a) => a.job_id === j.id && a.stage === "Joined").length;
                return (
                  <li key={j.id}><Link to={`/hr/requirements/${j.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:text-primary">
                    <span className="flex-1 font-medium">{j.title}{j.location && <span className="text-muted-foreground font-normal"> · {j.location}</span>}</span>
                    <span className="text-xs text-muted-foreground">{joined}/{j.openings} filled</span>
                    <Pill tone={PRIORITY_TONE[j.priority] ?? ""}>{j.priority}</Pill>
                    <Pill tone={JOB_STATUS_TONE[j.status] ?? ""}>{j.status}</Pill>
                  </Link></li>);
              })}</ul>
            )}
          </Card>
          <Card title={`Placements (${placements.length})`}>
            {placements.length === 0 ? <p className="text-sm text-muted-foreground">No placements yet.</p> : (
              <ul className="divide-y">{placements.map((a) => (
                <li key={a.id}><button onClick={() => ui.openApplication(a.id)} className="w-full flex items-center gap-3 py-2.5 text-left hover:text-primary text-sm">
                  <span className="flex-1 font-medium">{crm.candidate.get(a.candidate_id)?.full_name}</span>
                  <span className="text-muted-foreground">{crm.job.get(a.job_id)?.title}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(a.joined_on)}</span>
                </button></li>))}</ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Contact">
            <p className="font-medium">{c.contact_person || "—"}</p>
            {c.contact_designation && <p className="text-sm text-muted-foreground">{c.contact_designation}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {c.contact_phone && <Button size="sm" variant="outline" asChild><a href={`tel:${c.contact_phone.replace(/\s/g, "")}`}><Phone className="w-4 h-4 mr-1" />{c.contact_phone}</a></Button>}
              {c.contact_phone && <Button size="sm" variant="outline" asChild><a href={waLink(c.contact_phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /></a></Button>}
              {c.contact_email && <Button size="sm" variant="outline" asChild><a href={`mailto:${c.contact_email}`}><Mail className="w-4 h-4 mr-1" />Email</a></Button>}
            </div>
            {c.address && <p className="text-sm text-muted-foreground mt-3">{c.address}</p>}
            {c.terms && <p className="text-sm mt-3"><span className="text-muted-foreground">Terms: </span>{c.terms}</p>}
            {c.notes && <p className="text-sm mt-3 whitespace-pre-wrap">{c.notes}</p>}
          </Card>
          <Card title="Activity">
            <ol className="space-y-2 max-h-72 overflow-y-auto">{(activities.data || []).map((a) => <li key={a.id} className="text-sm"><p>{a.content}</p><p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p></li>)}</ol>
            {!activities.data?.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </Card>
        </div>
      </div>
      <ClientDialog open={edit} onOpenChange={setEdit} initial={c as Client} />
      <ClientExportDialog open={exportOpen} onOpenChange={setExportOpen} clientId={c.id} clientName={c.name} />
    </div>
  );
};

/* ================================================================= Tasks */

export const Tasks = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const [view, setView] = useState("open");
  const [edit, setEdit] = useState<Task | null>(null);
  const today = todayISO();
  const list = crm.tasks.filter((t) => (view === "open" ? !t.done : view === "today" ? !t.done && t.due_date && t.due_date <= today : t.done))
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  const related = (t: Task) => [
    t.candidate_id && crm.candidate.get(t.candidate_id) ? { to: `/hr/candidates/${t.candidate_id}`, label: crm.candidate.get(t.candidate_id)!.full_name } : null,
    t.job_id && crm.job.get(t.job_id) ? { to: `/hr/requirements/${t.job_id}`, label: crm.job.get(t.job_id)!.title } : null,
    t.client_id && crm.client.get(t.client_id) ? { to: `/hr/clients/${t.client_id}`, label: crm.client.get(t.client_id)!.name } : null,
  ].filter(Boolean) as { to: string; label: string }[];

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Your to-do list: calls to make, CVs to chase, client feedback to collect." actions={<Button onClick={() => ui.openNewTask()}><Plus className="w-4 h-4 mr-1" />New task</Button>} />
      <Tabs value={view} onValueChange={setView} className="mb-4">
        <TabsList><TabsTrigger value="today">Due today</TabsTrigger><TabsTrigger value="open">All open</TabsTrigger><TabsTrigger value="done">Completed</TabsTrigger></TabsList>
      </Tabs>
      {list.length === 0 ? <EmptyState icon={ListTodo} title="No tasks here" action={<Button onClick={() => ui.openNewTask()}>Add a task</Button>} /> : (
        <div className="rounded-xl border bg-card divide-y">
          {list.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button onClick={() => run(() => updateRow("crm_tasks", t.id, { done: !t.done }), { refresh: ["crm_tasks"] })}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${t.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/40 hover:border-primary"}`} aria-label="Toggle done">
                {t.done && <Check className="w-3 h-3" />}
              </button>
              <button onClick={() => setEdit(t)} className="flex-1 min-w-[200px] text-left">
                <span className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                {t.notes && <span className="block text-xs text-muted-foreground truncate">{t.notes}</span>}
              </button>
              {related(t).map((r) => <Link key={r.to} to={r.to} className="text-xs text-primary hover:underline">{r.label}</Link>)}
              {t.priority !== "Normal" && <Pill tone={PRIORITY_TONE[t.priority] ?? ""}>{t.priority}</Pill>}
              {t.due_date && <span className={`text-xs ${!t.done && t.due_date < today ? "text-rose-700 font-semibold" : "text-muted-foreground"}`}>{formatDate(t.due_date)}</span>}
              <button className="text-muted-foreground hover:text-rose-700 text-xs" onClick={() => confirm("Delete task?") && run(() => deleteRow("crm_tasks", t.id), { refresh: ["crm_tasks"] })}>×</button>
            </div>
          ))}
        </div>
      )}
      <TaskDialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)} initial={edit} />
    </div>
  );
};

/* =============================================================== Reports */

const Bars = ({ rows }: { rows: { label: string; value: number; tone?: string }[] }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(110px,180px)_1fr_40px] items-center gap-3 text-sm">
          <span className="truncate" title={r.label}>{r.label}</span>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${r.tone || "bg-primary"}`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <span className="text-right font-semibold tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
};

export const Reports = () => {
  const crm = useCrm();
  const [range, setRange] = useState("90");
  const since = range === "all" ? "" : new Date(Date.now() - Number(range) * 86400000).toISOString();

  const r = useMemo(() => {
    const apps = crm.applications.filter((a) => !since || a.created_at >= since);
    const joined = crm.applications.filter((a) => a.stage === "Joined" && (!since || (a.joined_on || a.updated_at) >= since.slice(0, 10)));
    const reached = (stage: string) => {
      const idx = STAGES.findIndex((s) => s.value === stage);
      return apps.filter((a) => { const i = STAGES.findIndex((s) => s.value === a.stage); return i >= idx && i <= STAGES.findIndex((s) => s.value === "Joined"); }).length;
    };
    const days = joined.map((a) => (new Date(a.joined_on || a.updated_at).getTime() - new Date(a.created_at).getTime()) / 86400000).filter((d) => d >= 0);
    const byClient = new Map<string, number>();
    joined.forEach((a) => { const j = crm.job.get(a.job_id); const n = j?.client_id ? crm.client.get(j.client_id)?.name ?? "Unknown" : "No client"; byClient.set(n, (byClient.get(n) || 0) + 1); });
    const byDept = new Map<string, number>();
    joined.forEach((a) => { const d = crm.job.get(a.job_id)?.department || "Other"; byDept.set(d, (byDept.get(d) || 0) + 1); });
    const srcJoined = new Map<string, number>();
    joined.forEach((a) => { const s = crm.candidate.get(a.candidate_id)?.source || "Other"; srcJoined.set(s, (srcJoined.get(s) || 0) + 1); });
    const candidatesNew = crm.candidates.filter((c) => !since || c.created_at >= since);
    const reasons = new Map<string, number>();
    apps.filter((a) => a.stage === "Rejected" || a.stage === "Dropped").forEach((a) => { const k = a.rejection_reason || a.stage; reasons.set(k, (reasons.get(k) || 0) + 1); });
    const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
    return {
      apps: apps.length, joined: joined.length, avgDays: days.length ? Math.round(days.reduce((s, d) => s + d, 0) / days.length) : null,
      funnel: ["Sourced", "Screening", "Shortlisted", "Internal Interview", "CV Sent to Client", "Client Interview", "Documents", "Offer", "Joined"].map((s) => ({ label: s, value: reached(s), tone: STAGES.find((x) => x.value === s)?.dot })),
      byClient: sort(byClient), byDept: sort(byDept), srcJoined: sort(srcJoined), reasons: sort(reasons).slice(0, 8),
      sources: CRM_SOURCES.map((s) => ({ label: s, value: candidatesNew.filter((c) => c.source === s).length })).filter((x) => x.value).sort((a, b) => b.value - a.value),
      newCandidates: candidatesNew.length,
    };
  }, [crm.applications, crm.candidates, crm.job, crm.client, crm.candidate, since]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="How recruitment is performing: funnel conversion, placements by client and department, and which sources bring hires."
        actions={<div className="w-40"><NativeSelect value={range} onChange={setRange} options={[{ value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }, { value: "365", label: "Last 12 months" }, { value: "all", label: "All time" }]} className="bg-card" /></div>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="New candidates" value={r.newCandidates} />
        <StatCard icon={BarChart3} label="Candidates submitted to requirements" value={r.apps} tone="bg-indigo-100 text-indigo-700" />
        <StatCard icon={BarChart3} label="Placements" value={r.joined} tone="bg-emerald-100 text-emerald-700" hint={r.apps ? `${((r.joined / r.apps) * 100).toFixed(0)}% conversion` : undefined} />
        <StatCard icon={BarChart3} label="Avg days to join" value={r.avgDays ?? "—"} tone="bg-amber-100 text-amber-700" hint="From sourcing to joining" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Recruitment funnel (reached at least this stage)"><Bars rows={r.funnel} /></Card>
        <Card title="Placements by client"><Bars rows={r.byClient} /></Card>
        <Card title="Placements by department"><Bars rows={r.byDept.map((x) => ({ ...x, tone: "bg-cyan-500" }))} /></Card>
        <Card title="Hires by candidate source"><Bars rows={r.srcJoined.map((x) => ({ ...x, tone: "bg-emerald-500" }))} /></Card>
        <Card title="New candidates by source"><Bars rows={r.sources.map((x) => ({ ...x, tone: "bg-indigo-500" }))} /></Card>
        <Card title="Top rejection / drop reasons"><Bars rows={r.reasons.map((x) => ({ ...x, tone: "bg-rose-500" }))} /></Card>
      </div>
    </div>
  );
};
