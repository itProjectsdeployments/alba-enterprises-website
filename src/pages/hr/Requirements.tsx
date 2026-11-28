import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Plus, Search, MapPin, CalendarDays, Globe, Building2, ClipboardList, LayoutGrid, Rows3, ChevronRight, Pencil, GripVertical, Download } from "lucide-react";
import ClientExportDialog from "@/components/hr/ClientExportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, todayISO } from "@/lib/crm";
import { ACTIVE_STAGES, JOB_STATUSES, JOB_STATUS_TONE, PRIORITIES, PRIORITY_TONE, STAGES, logEvent, updateRow, useCrm, type Application, type Job } from "@/lib/hr/model";
import { EmptyState, NativeSelect, PageHeader, Pill, useAction, useHrUi } from "@/components/hr/ui";
import { ClientDialog } from "@/components/hr/dialogs";

type Row = { j: Job; apps: Application[]; joined: number; active: number };

const VIEW_KEY = "hr.requirementsView";
const NO_CLIENT = "none";
const readLs = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const writeLs = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* per-browser convenience only */ } };

/** Where a client's vacancies live. */
export const clientRequirementsPath = (clientId?: string | null) => `/hr/requirements/client/${clientId || NO_CLIENT}`;

const Funnel = ({ apps, openings }: { apps: Application[]; openings: number }) => (
  <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
    {STAGES.filter((s) => s.step > 0).map((s) => {
      const n = apps.filter((a) => a.stage === s.value).length;
      return n ? <div key={s.value} className={s.dot} style={{ width: `${(n / Math.max(apps.length, openings)) * 100}%` }} title={`${s.value}: ${n}`} /> : null;
    })}
  </div>
);

const useRows = (jobs: Job[]) => {
  const crm = useCrm();
  return useMemo(() => jobs.map((j) => {
    const apps = crm.applications.filter((a) => a.job_id === j.id);
    return { j, apps, joined: apps.filter((a) => a.stage === "Joined").length, active: apps.filter((a) => ACTIVE_STAGES.includes(a.stage)).length };
  }), [jobs, crm.applications]);
};

const NO_BRANCH = "No branch set";
const branchOf = (j: Job) => j.location?.trim() || NO_BRANCH;

// ---------------------------------------------------------------------------
// Level 1: clients only
// ---------------------------------------------------------------------------
const Requirements = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const allRows = useRows(crm.jobs);

  const clients = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = crm.clients.map((c) => ({ id: c.id, name: c.name, sub: [c.property_type, c.city].filter(Boolean).join(" · "), rows: allRows.filter((r) => r.j.client_id === c.id) }));
    const orphans = allRows.filter((r) => !r.j.client_id || !crm.client.get(r.j.client_id));
    if (orphans.length) list.push({ id: NO_CLIENT, name: "No client set", sub: "Vacancies not linked to a client", rows: orphans });
    return list
      .filter((c) => !term || c.name.toLowerCase().includes(term) || c.sub.toLowerCase().includes(term)
        || c.rows.some((r) => [r.j.title, r.j.location, r.j.department].filter(Boolean).join(" ").toLowerCase().includes(term)))
      .sort((a, b) => {
        const open = (x: typeof a) => x.rows.filter((r) => r.j.status === "Open").length;
        return (a.id === NO_CLIENT ? 1 : 0) - (b.id === NO_CLIENT ? 1 : 0) || open(b) - open(a) || a.name.localeCompare(b.name);
      });
  }, [crm.clients, crm.client, allRows, q]);

  return (
    <div>
      <PageHeader
        step={1}
        title="Requirement Analysis"
        subtitle="Your clients. Open one to see all its vacancies across branches."
        actions={<>
          <Button variant="outline" onClick={() => ui.openBulkJobs()}><Plus className="w-4 h-4 mr-1" />Add multiple positions</Button>
          <Button onClick={() => ui.openNewClient()}><Building2 className="w-4 h-4 mr-1" />New client</Button>
        </>}
      />

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 bg-card" placeholder="Search client, position or branch..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={Building2} title={crm.clients.length ? "No clients match" : "No clients yet"}
          text="Create a client (for example the restaurant group), then add all its positions and branches at once."
          action={<Button onClick={() => ui.openNewClient()}>Create client</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => {
            const open = c.rows.filter((r) => r.j.status === "Open");
            const openings = open.reduce((n, r) => n + r.j.openings, 0);
            const filled = c.rows.reduce((n, r) => n + r.joined, 0);
            const active = c.rows.reduce((n, r) => n + r.active, 0);
            const branches = [...new Set(open.map((r) => branchOf(r.j)))];
            return (
              <button key={c.id} onClick={() => navigate(clientRequirementsPath(c.id))}
                className="group text-left rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition flex flex-col">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg leading-tight">{c.name}</h3>
                    {c.sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.sub}</p>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-5 text-center">
                  {[["Vacancies", open.length], ["Openings", openings], ["In process", active], ["Filled", filled]].map(([label, n]) => (
                    <div key={label} className="rounded-lg bg-muted/50 py-2">
                      <div className="text-lg font-bold">{n}</div>
                      <div className="text-[11px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
                {branches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {branches.slice(0, 6).map((b) => <span key={b} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{b}</span>)}
                    {branches.length > 6 && <span className="text-xs text-muted-foreground">+{branches.length - 6} more</span>}
                  </div>
                )}
                {c.rows.length === 0 && <p className="text-xs text-muted-foreground mt-4">No vacancies yet.</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Level 2: one client's vacancies, grouped by branch
// ---------------------------------------------------------------------------
export const ClientRequirements = () => {
  const { clientId } = useParams();
  const crm = useCrm();
  const ui = useHrUi();
  const navigate = useNavigate();
  const today = todayISO();
  const isNone = clientId === NO_CLIENT;
  const client = isNone ? undefined : crm.client.get(clientId || "");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Open");
  const [priority, setPriority] = useState("");
  const [view, setView] = useState<"branches" | "grid">(() => readLs<string>(VIEW_KEY, "branches") === "grid" ? "grid" : "branches");
  const [editOpen, setEditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overBranch, setOverBranch] = useState<string | null>(null);
  const run = useAction();

  const jobs = useMemo(() => {
    const term = q.trim().toLowerCase();
    return crm.jobs
      .filter((j) => (isNone ? !j.client_id || !crm.client.get(j.client_id) : j.client_id === clientId))
      .filter((j) => (!status || j.status === status) && (!priority || j.priority === priority))
      .filter((j) => !term || [j.title, j.location, j.department].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [crm.jobs, crm.client, clientId, isNone, q, status, priority]);
  const rows = useRows(jobs);
  const allForClient = crm.jobs.filter((j) => (isNone ? !j.client_id : j.client_id === clientId));

  /** Put a vacancy in another branch (its location). */
  const moveToBranch = (jobId: string, branch: string) => {
    const j = crm.job.get(jobId);
    const location = branch === NO_BRANCH ? null : branch;
    if (!j || (j.location?.trim() || null) === location) return;
    return run(async () => {
      await updateRow("crm_jobs", j.id, { location });
      await logEvent({ job_id: j.id, client_id: j.client_id, kind: "note", content: `Moved to branch "${location ?? NO_BRANCH}"` });
    }, { success: `${j.title} moved to ${location ?? NO_BRANCH}`, refresh: ["crm_jobs"] });
  };
  const newBranch = (jobId: string) => {
    const name = prompt("New branch / location name (e.g. Folks Faridabad):")?.trim();
    if (name) moveToBranch(jobId, name);
  };
  /** Rename a branch: every vacancy of this client in it moves along. Renaming to an existing branch merges them. */
  const renameBranch = (branch: string) => {
    const name = prompt(`Rename branch "${branch}" to (type an existing branch name to merge them):`, branch === NO_BRANCH ? "" : branch)?.trim();
    if (!name || name === branch) return;
    const ids = allForClient.filter((j) => branchOf(j) === branch).map((j) => j.id);
    return run(async () => {
      for (const id of ids) await updateRow("crm_jobs", id, { location: name });
    }, { success: `Branch renamed to ${name}`, refresh: ["crm_jobs"] });
  };
  const dropProps = (branch: string) => ({
    onDragOver: (e: React.DragEvent) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overBranch !== branch) setOverBranch(branch); } },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverBranch((b) => (b === branch ? null : b)); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData("text/x-job") || dragId; setOverBranch(null); setDragId(null); if (id) moveToBranch(id, branch); },
  });

  const branches = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => m.set(branchOf(r.j), [...(m.get(branchOf(r.j)) || []), r]));
    return [...m.entries()].sort((a, b) => (a[0] === "No branch set" ? 1 : b[0] === "No branch set" ? -1 : a[0].localeCompare(b[0])));
  }, [rows]);

  if (!client && !isNone) return crm.loading ? null : <p className="text-muted-foreground">Client not found. <Link to="/hr/requirements" className="text-primary">Back</Link></p>;

  const openRows = rows.filter((r) => r.j.status === "Open");
  const stats = [
    ["Vacancies", openRows.length], ["Openings", openRows.reduce((n, r) => n + r.j.openings, 0)],
    ["In process", rows.reduce((n, r) => n + r.active, 0)], ["Filled", rows.reduce((n, r) => n + r.joined, 0)],
  ] as const;
  const setViewSaved = (v: "branches" | "grid") => { setView(v); writeLs(VIEW_KEY, v); };

  return (
    <div>
      <Link to="/hr/requirements" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />All clients</Link>
      <PageHeader
        step={1}
        title={client?.name ?? "Vacancies without a client"}
        subtitle={client ? [client.property_type, client.city, client.contact_person ? `Contact: ${client.contact_person}` : null].filter(Boolean).join(" · ") || "Client vacancies by branch" : "Edit these vacancies to link them to a client."}
        actions={<>
          {client && <Button variant="ghost" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" />Edit client</Button>}
          {client && <Button variant="ghost" asChild><Link to={`/hr/clients/${client.id}`}>Client profile</Link></Button>}
          <Button variant="outline" onClick={() => setExportOpen(true)}><Download className="w-4 h-4 mr-1" />Export for client</Button>
          <Button variant="outline" onClick={() => ui.openBulkJobs(client?.id)}><Plus className="w-4 h-4 mr-1" />Add multiple positions</Button>
          <Button onClick={() => ui.openNewJob(client?.id)}><Plus className="w-4 h-4 mr-1" />New vacancy</Button>
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map(([label, n]) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3">
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card" placeholder="Search position or branch..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="w-36"><NativeSelect value={status} onChange={setStatus} options={JOB_STATUSES} placeholder="All statuses" className="bg-card" /></div>
        <div className="w-36"><NativeSelect value={priority} onChange={setPriority} options={PRIORITIES} placeholder="Any priority" className="bg-card" /></div>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          <Button size="sm" variant={view === "branches" ? "default" : "ghost"} onClick={() => setViewSaved("branches")}><Rows3 className="w-4 h-4 mr-1" />By branch</Button>
          <Button size="sm" variant={view === "grid" ? "default" : "ghost"} onClick={() => setViewSaved("grid")}><LayoutGrid className="w-4 h-4 mr-1" />Cards</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Briefcase} title={allForClient.length ? "No vacancies match" : "No vacancies yet"}
          text="Paste the client's WhatsApp message with 'Add multiple positions' to create all positions and branches at once."
          action={<Button onClick={() => ui.openBulkJobs(client?.id)}>Add positions</Button>} />
      ) : view === "branches" ? (
        <>
        <p className="text-xs text-muted-foreground mb-2">Drag a vacancy by its <GripVertical className="inline w-3 h-3" /> handle into another branch, or use "Move to branch…". Click the pencil on a branch to rename it or merge it into another.</p>
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {branches.map(([branch, list]) => (
            <div key={branch} {...dropProps(branch)} className={`transition-colors ${overBranch === branch ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""}`}>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />{branch}
                <span className="font-normal normal-case tracking-normal">· {list.length} position{list.length === 1 ? "" : "s"}</span>
                <button onClick={() => renameBranch(branch)} className="ml-1 rounded p-1 hover:bg-muted hover:text-foreground" title="Rename or merge this branch" aria-label={`Rename branch ${branch}`}><Pencil className="w-3 h-3" /></button>
                {overBranch === branch && <span className="ml-auto normal-case tracking-normal text-primary">Drop to move here</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px] table-fixed">
                  <tbody>
                    {list.map(({ j, apps, joined, active }) => (
                      <tr key={j.id} onClick={() => navigate(`/hr/requirements/${j.id}`)}
                        draggable onDragStart={(e) => { e.dataTransfer.setData("text/x-job", j.id); e.dataTransfer.effectAllowed = "move"; setDragId(j.id); }}
                        onDragEnd={() => { setDragId(null); setOverBranch(null); }}
                        className={`border-t first:border-t-0 hover:bg-muted/30 cursor-pointer ${dragId === j.id ? "opacity-40" : ""}`}>
                        <td className="pl-3 pr-0 py-3 w-8 text-muted-foreground/60 cursor-grab active:cursor-grabbing" title="Drag to another branch" onClick={(e) => e.stopPropagation()}><GripVertical className="w-4 h-4" /></td>
                        <td className="px-3 py-3">
                          <Link to={`/hr/requirements/${j.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-primary">{j.title}</Link>
                          <div className="text-xs text-muted-foreground">{[j.department, j.salary_range ? `₹ ${j.salary_range}` : null].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="px-3 py-3 w-[22%]">
                          <div className="flex justify-between text-xs mb-1"><span>{joined}/{j.openings} filled</span><span className="text-muted-foreground">{active} in process</span></div>
                          <Funnel apps={apps} openings={j.openings} />
                        </td>
                        <td className="w-24 px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {j.target_date ? <span className={`inline-flex items-center gap-1 ${j.target_date < today && j.status === "Open" ? "text-rose-700 font-medium" : ""}`}><CalendarDays className="w-3 h-3" />{formatDate(j.target_date)}</span> : "—"}
                        </td>
                        <td className="w-28 px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex gap-2 text-xs">
                            {j.intake_key && <span className="inline-flex items-center gap-1 text-emerald-700" title="Google Form linked"><ClipboardList className="w-3.5 h-3.5" />Form</span>}
                            {j.public_job_id && <span className="inline-flex items-center gap-1 text-primary" title="Published on website"><Globe className="w-3.5 h-3.5" />Website</span>}
                          </span>
                        </td>
                        <td className="w-44 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <select value="" onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v === "__new") newBranch(j.id); else if (v) moveToBranch(j.id, v); }}
                            className="h-8 max-w-[150px] rounded-md border bg-background px-2 text-xs text-muted-foreground" title="Move to another branch" aria-label={`Move ${j.title} to another branch`}>
                            <option value="">Move to branch…</option>
                            {branches.map(([b]) => b).filter((b) => b !== branch).map((b) => <option key={b} value={b}>{b}</option>)}
                            <option value="__new">+ New branch…</option>
                          </select>
                        </td>
                        <td className="w-32 px-5 py-3 text-right whitespace-nowrap">
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
        {dragId && (
          <div onDragOver={(e) => { e.preventDefault(); setOverBranch("__new"); }} onDragLeave={() => setOverBranch(null)}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/x-job") || dragId; setDragId(null); setOverBranch(null); if (id) newBranch(id); }}
            className={`mt-3 rounded-xl border-2 border-dashed p-5 text-center text-sm ${overBranch === "__new" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <Plus className="inline w-4 h-4 mr-1" />Drop here to create a new branch
          </div>
        )}
        </>
      ) : (
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {rows.map(({ j, apps, joined, active }) => (
            <button key={j.id} onClick={() => navigate(`/hr/requirements/${j.id}`)} className="text-left rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">{j.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{[j.location, j.department].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={JOB_STATUS_TONE[j.status] ?? ""}>{j.status}</Pill>
                  {j.priority !== "Normal" && <Pill tone={PRIORITY_TONE[j.priority] ?? ""}>{j.priority}</Pill>}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
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

      {client && <ClientDialog open={editOpen} onOpenChange={setEditOpen} initial={client} />}
      <ClientExportDialog open={exportOpen} onOpenChange={setExportOpen} clientId={client?.id ?? null} clientName={client?.name ?? "Unassigned vacancies"} />
    </div>
  );
};

export default Requirements;
