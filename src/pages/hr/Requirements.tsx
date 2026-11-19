import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Plus, Search, MapPin, CalendarDays, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, todayISO } from "@/lib/crm";
import { ACTIVE_STAGES, JOB_STATUSES, JOB_STATUS_TONE, PRIORITIES, PRIORITY_TONE, STAGES, useCrm } from "@/lib/hr/model";
import { EmptyState, NativeSelect, PageHeader, Pill, useHrUi } from "@/components/hr/ui";

const Requirements = () => {
  const crm = useCrm();
  const ui = useHrUi();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Open");
  const [client, setClient] = useState("");
  const [priority, setPriority] = useState("");
  const today = todayISO();

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return crm.jobs
      .filter((j) => (!status || j.status === status) && (!client || j.client_id === client) && (!priority || j.priority === priority))
      .filter((j) => !term || [j.title, j.location, j.department, j.client_id ? crm.client.get(j.client_id)?.name : ""].filter(Boolean).join(" ").toLowerCase().includes(term))
      .map((j) => {
        const apps = crm.applications.filter((a) => a.job_id === j.id);
        return { j, apps, joined: apps.filter((a) => a.stage === "Joined").length, active: apps.filter((a) => ACTIVE_STAGES.includes(a.stage)).length };
      });
  }, [crm.jobs, crm.applications, crm.client, q, status, client, priority]);

  return (
    <div>
      <PageHeader
        step={1}
        title="Requirement Analysis"
        subtitle="Every vacancy a client shares: property, department, positions and timelines. Open one to manage its candidates."
        actions={<Button onClick={() => ui.openNewJob()}><Plus className="w-4 h-4 mr-1" />New requirement</Button>}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card" placeholder="Search position, client, city..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="w-36"><NativeSelect value={status} onChange={setStatus} options={JOB_STATUSES} placeholder="All statuses" className="bg-card" /></div>
        <div className="w-52"><NativeSelect value={client} onChange={setClient} options={crm.clients.map((c) => ({ value: c.id, label: c.name }))} placeholder="All clients" className="bg-card" /></div>
        <div className="w-36"><NativeSelect value={priority} onChange={setPriority} options={PRIORITIES} placeholder="Any priority" className="bg-card" /></div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Briefcase} title={crm.jobs.length ? "No requirements match" : "No requirements yet"} text="When a hotel shares a vacancy, capture it here: position, number of openings, salary and target date." action={<Button onClick={() => ui.openNewJob()}>Create requirement</Button>} />
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
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  {STAGES.filter((s) => s.step > 0).map((s) => {
                    const n = apps.filter((a) => a.stage === s.value).length;
                    return n ? <div key={s.value} className={s.dot} style={{ width: `${(n / Math.max(apps.length, j.openings)) * 100}%` }} title={`${s.value}: ${n}`} /> : null;
                  })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requirements;
