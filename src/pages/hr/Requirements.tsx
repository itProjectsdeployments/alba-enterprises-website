import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Plus, Search, MapPin, CalendarDays, Globe, Building2, ChevronDown, ChevronRight, ClipboardList, LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, todayISO } from "@/lib/crm";
import { ACTIVE_STAGES, JOB_STATUSES, JOB_STATUS_TONE, PRIORITIES, PRIORITY_TONE, STAGES, useCrm, type Application, type Job } from "@/lib/hr/model";
import { EmptyState, NativeSelect, PageHeader, Pill, useHrUi } from "@/components/hr/ui";

type Row = { j: Job; apps: Application[]; joined: number; active: number };

const VIEW_KEY = "hr.requirementsView";
const COLLAPSED_KEY = "hr.collapsedClients";
const readLs = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const writeLs = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* per-browser convenience only */ } };

const Funnel = ({ apps, openings }: { apps: Application[]; openings: number }) => (
  <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
    {STAGES.filter((s) => s.step > 0).map((s) => {
      const n = apps.filter((a) => a.stage === s.value).length;
      return n ? <div key={s.value} className={s.dot} style={{ width: `${(n / Math.max(apps.length, openings)) * 100}%` }} title={`${s.value}: ${n}`} /> : null;
    })}
  </div>
);

/** One client's profile: totals, then its vacancies grouped by branch / location. */
const ClientGroup = ({ id, name, sub, rows, collapsed, onToggle }: {
  id: string | null; name: string; sub?: string; rows: Row[]; collapsed: boolean; onToggle: () => void;
}) => {
  const ui = useHrUi();
  const navigate = useNavigate();
  const today = todayISO();
  const openings = rows.reduce((n, r) => n + (r.j.status === "Open" ? r.j.openings : 0), 0);
  const filled = rows.reduce((n, r) => n + r.joined, 0);
  const active = rows.reduce((n, r) => n + r.active, 0);
  const branches = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => { const b = r.j.location?.trim() || "No branch set"; m.set(b, [...(m.get(b) || []), r]); });
    return [...m.entries()].sort((a, b) => (a[0] === "No branch set" ? 1 : b[0] === "No branch set" ? -1 : a[0].localeCompare(b[0])));
  }, [rows]);

  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-[240px] text-left" aria-expanded={!collapsed}>
          {collapsed ? <ChevronRight className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></span>
          <span className="min-w-0">
            <span className="block font-semibold text-lg truncate">{name}</span>
            <span className="block text-xs text-muted-foreground">
              {rows.length} vacanc{rows.length === 1 ? "y" : "ies"} · {branches.length} branch{branches.length === 1 ? "" : "es"} · {openings} opening{openings === 1 ? "" : "s"} · {filled} filled · {active} in process
              {sub ? ` · ${sub}` : ""}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => ui.openBulkJobs(id ?? undefined)}><Plus className="w-4 h-4 mr-1" />Add positions</Button>
          <Button size="sm" variant="outline" onClick={() => ui.openNewJob(id ?? undefined)}><Plus className="w-4 h-4 mr-1" />New vacancy</Button>
          {id && <Button size="sm" variant="ghost" asChild><Link to={`/hr/clients/${id}`}>Client profile</Link></Button>}
        </div>
      </div>

      {!collapsed && (
        <div className="divide-y">
          {branches.map(([branch, list]) => (
            <div key={branch}>
              <div className="flex items-center gap-2 px-5 py-2 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />{branch}
                <span className="font-normal normal-case tracking-normal">· {list.length} position{list.length === 1 ? "" : "s"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <tbody>
                    {list.map(({ j, apps, joined, active: act }) => (
                      <tr key={j.id} onClick={() => navigate(`/hr/requirements/${j.id}`)} className="border-t first:border-t-0 hover:bg-muted/30 cursor-pointer">
                        <td className="px-5 py-3 w-[34%]">
                          <Link to={`/hr/requirements/${j.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-primary">{j.title}</Link>
                          <div className="text-xs text-muted-foreground">{[j.department, j.salary_range ? `₹ ${j.salary_range}` : null].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="px-3 py-3 w-[22%]">
                          <div className="flex justify-between text-xs mb-1"><span>{joined}/{j.openings} filled</span><span className="text-muted-foreground">{act} in process</span></div>
                          <Funnel apps={apps} openings={j.openings} />
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {j.target_date ? <span className={`inline-flex items-center gap-1 ${j.target_date < today && j.status === "Open" ? "text-rose-700 font-medium" : ""}`}><CalendarDays className="w-3 h-3" />{formatDate(j.target_date)}</span> : "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex gap-2 text-xs">
                            {j.intake_key && <span className="inline-flex items-center gap-1 text-emerald-700" title="Google Form linked"><ClipboardList className="w-3.5 h-3.5" />Form</span>}
                            {j.public_job_id && <span className="inline-flex items-center gap-1 text-primary" title="Published on website"><Globe className="w-3.5 h-3.5" />Website</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          {j.priority !== "Normal" && <Pill tone={PRIORITY_TONE[j.priority] ?? ""}>{j.priority}</Pill>}{" "}
                          <Pill tone={JOB_STATUS_TONE[j.status] ?? ""}>{j.status}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const Requirements = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Open");
  const [client, setClient] = useState("");
  const [priority, setPriority] = useState("");
  const [view, setView] = useState<"clients" | "grid">(() => readLs(VIEW_KEY, "clients"));
  const [collapsed, setCollapsed] = useState<string[]>(() => readLs(COLLAPSED_KEY, []));
  const today = todayISO();

  const rows: Row[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    return crm.jobs
      .filter((j) => (!status || j.status === status) && (!client || j.client_id === client) && (!priority || j.priority === priority))
      .filter((j) => !term || [j.title, j.location, j.department, j.client_id ? crm.client.get(j.client_id)?.name : ""].filter(Boolean).join(" ").toLowerCase().includes(term))
      .map((j) => {
        const apps = crm.applications.filter((a) => a.job_id === j.id);
        return { j, apps, joined: apps.filter((a) => a.stage === "Joined").length, active: apps.filter((a) => ACTIVE_STAGES.includes(a.stage)).length };
      });
  }, [crm.jobs, crm.applications, crm.client, q, status, client, priority]);

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => { const k = r.j.client_id ?? ""; m.set(k, [...(m.get(k) || []), r]); });
    return [...m.entries()]
      .map(([id, list]) => ({ id: id || null, name: id ? crm.client.get(id)?.name ?? "Unknown client" : "No client set", city: id ? crm.client.get(id)?.city ?? undefined : undefined, list }))
      .sort((a, b) => (a.id ? 0 : 1) - (b.id ? 0 : 1) || b.list.length - a.list.length || a.name.localeCompare(b.name));
  }, [rows, crm.client]);

  const setViewSaved = (v: "clients" | "grid") => { setView(v); writeLs(VIEW_KEY, v); };
  const toggle = (k: string) => setCollapsed((c) => { const n = c.includes(k) ? c.filter((x) => x !== k) : [...c, k]; writeLs(COLLAPSED_KEY, n); return n; });

  return (
    <div>
      <PageHeader
        step={1}
        title="Requirement Analysis"
        subtitle="Vacancies organised by client and branch. Open a client to see every position across its locations; open a position to manage its candidates."
        actions={<>
          <Button variant="outline" onClick={() => ui.openNewClient()}><Building2 className="w-4 h-4 mr-1" />New client</Button>
          <Button variant="outline" onClick={() => ui.openBulkJobs()}><Plus className="w-4 h-4 mr-1" />Add multiple positions</Button>
          <Button onClick={() => ui.openNewJob()}><Plus className="w-4 h-4 mr-1" />New requirement</Button>
        </>}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card" placeholder="Search position, client, branch..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="w-36"><NativeSelect value={status} onChange={setStatus} options={JOB_STATUSES} placeholder="All statuses" className="bg-card" /></div>
        <div className="w-52"><NativeSelect value={client} onChange={setClient} options={crm.clients.map((c) => ({ value: c.id, label: c.name }))} placeholder="All clients" className="bg-card" /></div>
        <div className="w-36"><NativeSelect value={priority} onChange={setPriority} options={PRIORITIES} placeholder="Any priority" className="bg-card" /></div>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          <Button size="sm" variant={view === "clients" ? "default" : "ghost"} onClick={() => setViewSaved("clients")}><Rows3 className="w-4 h-4 mr-1" />By client</Button>
          <Button size="sm" variant={view === "grid" ? "default" : "ghost"} onClick={() => setViewSaved("grid")}><LayoutGrid className="w-4 h-4 mr-1" />All cards</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Briefcase} title={crm.jobs.length ? "No requirements match" : "No requirements yet"} text="When a client shares vacancies, create the client once, then add all its positions and branches with 'Add multiple positions'." action={<Button onClick={() => ui.openBulkJobs()}>Add positions</Button>} />
      ) : view === "clients" ? (
        <div className="space-y-4">
          {groups.length > 1 && (
            <div className="flex justify-end gap-3 text-xs">
              <button className="text-primary hover:underline" onClick={() => { setCollapsed([]); writeLs(COLLAPSED_KEY, []); }}>Expand all</button>
              <button className="text-primary hover:underline" onClick={() => { const all = groups.map((g) => g.id ?? "none"); setCollapsed(all); writeLs(COLLAPSED_KEY, all); }}>Collapse all</button>
            </div>
          )}
          {groups.map((g) => (
            <ClientGroup key={g.id ?? "none"} id={g.id} name={g.name} sub={g.city} rows={g.list} collapsed={collapsed.includes(g.id ?? "none")} onToggle={() => toggle(g.id ?? "none")} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {rows.map(({ j, apps, joined, active }) => (
            <button key={j.id} onClick={() => navigate(`/hr/requirements/${j.id}`)} className="text-left rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">{j.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{j.client_id ? crm.client.get(j.client_id)?.name : "No client set"}{j.department ? ` · ${j.department}` : ""}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={JOB_STATUS_TONE[j.status] ?? ""}>{j.status}</Pill>
                  {j.priority !== "Normal" && <Pill tone={PRIORITY_TONE[j.priority] ?? ""}>{j.priority}</Pill>}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
                {j.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>}
                {j.target_date && <span className={`flex items-center gap-1 ${j.target_date < today && j.status === "Open" ? "text-rose-700 font-medium" : ""}`}><CalendarDays className="w-3 h-3" />Target {formatDate(j.target_date)}</span>}
                {j.salary_range && <span>₹ {j.salary_range}</span>}
                {j.public_job_id && <span className="flex items-center gap-1 text-primary"><Globe className="w-3 h-3" />On website</span>}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1"><span>{joined} of {j.openings} filled</span><span className="text-muted-foreground">{active} in process</span></div>
                <Funnel apps={apps} openings={j.openings} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requirements;
