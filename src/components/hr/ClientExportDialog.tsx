import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { levelOfKind, STAGES, useCrm } from "@/lib/hr/model";
import ExportDialog, { type ExportRow } from "./ExportDialog";
import { useOpenReset } from "./dialogs";

/** Client sheet: candidate details, interview slot and CV. No phone/email, so the client comes back through Alba. */
const CLIENT_SHEET_PRESET = ["full_name", "client_interview", "experience", "current_employer", "current_salary", "expected_salary", "notice_period", "city", "cv_url"];
const ROUND_STAGES = ["CV Sent to Client", "Client Interview", "Shortlisted", "Internal Interview", "Documents", "Offer"];
const STAGE_TONE = Object.fromEntries(STAGES.map((s) => [s.value, s.tone]));

/** Export everyone a client should see (default: Client Interview), across all of the client's vacancies. */
const ClientExportDialog = ({ open, onOpenChange, clientId, clientName }: {
  open: boolean; onOpenChange: (v: boolean) => void; clientId: string | null; clientName: string;
}) => {
  const crm = useCrm();
  const [stages, setStages] = useState<string[]>(["Client Interview"]);
  const [skip, setSkip] = useState<string[]>([]);
  useOpenReset(open, () => { setStages(["Client Interview"]); setSkip([]); });

  const jobs = useMemo(() => crm.jobs.filter((j) => (clientId ? j.client_id === clientId : !j.client_id)), [crm.jobs, clientId]);

  // Latest client-round interview per application (for the "Client interview on" column).
  const slot = useMemo(() => {
    const m = new Map<string, string>();
    crm.interviews
      .filter((i) => levelOfKind(i.kind) === "client" && i.status !== "Cancelled")
      .forEach((i) => { const cur = m.get(i.application_id); if (!cur || i.scheduled_at > cur) m.set(i.application_id, i.scheduled_at); });
    return m;
  }, [crm.interviews]);

  const perJob = useMemo(() => jobs.map((j) => {
    const apps = crm.applications.filter((a) => a.job_id === j.id && stages.includes(a.stage));
    return { j, apps };
  }).filter((x) => x.apps.length), [jobs, crm.applications, stages]);

  const rows: ExportRow[] = useMemo(() => perJob
    .filter((x) => !skip.includes(x.j.id))
    .flatMap(({ j, apps }) => apps.flatMap((a) => {
      const c = crm.candidate.get(a.candidate_id);
      return c ? [{ c, a, jobTitle: j.title, branch: j.location?.trim() || "", interviewAt: slot.get(a.id) }] : [];
    }))
    .sort((x, y) => (x.branch || "").localeCompare(y.branch || "") || (x.jobTitle || "").localeCompare(y.jobTitle || "") || x.c.full_name.localeCompare(y.c.full_name)),
  [perJob, skip, crm.candidate, slot]);

  const toggleStage = (s: string) => setStages((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const toggleJob = (id: string) => setSkip((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const roundLabel = stages.length === 1 ? `${stages[0]} round` : stages.join(", ");
  const date = new Date().toISOString().slice(0, 10);

  const toolbar = (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Candidates at stage</p>
        <div className="flex flex-wrap gap-1.5">
          {ROUND_STAGES.map((s) => (
            <button key={s} type="button" onClick={() => toggleStage(s)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${stages.includes(s) ? STAGE_TONE[s] + " font-medium" : "bg-background text-muted-foreground hover:bg-muted"}`}>
              {stages.includes(s) ? "✓ " : ""}{s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Vacancies ({perJob.length})</p>
        {perJob.length ? (
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 max-h-40 overflow-y-auto">
            {perJob.map(({ j, apps }) => (
              <label key={j.id} className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/60 min-w-0">
                <Checkbox checked={!skip.includes(j.id)} onCheckedChange={() => toggleJob(j.id)} />
                <span className="truncate">{j.title}{j.location ? <span className="text-muted-foreground"> · {j.location}</span> : null}</span>
                <span className="ml-auto shrink-0 rounded-full bg-background border px-1.5 text-xs">{apps.length}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground px-2">No candidates at {stages.join(" / ") || "any stage"} for this client yet. Move candidates to Client Interview, or tick another stage above.</p>
        )}
      </div>
    </div>
  );

  return (
    <ExportDialog open={open} onOpenChange={onOpenChange} rows={rows} groupByVacancy
      title={`for ${clientName}`}
      heading={{ title: "Candidate Shortlist", subtitle: `${clientName}  ·  ${roundLabel}  ·  ${rows.length} candidate${rows.length === 1 ? "" : "s"} across ${new Set(rows.map((r) => r.a?.job_id)).size} position(s)` }}
      filename={`${clientName.replace(/[^a-zA-Z0-9]+/g, "_")}_Shortlist_${date}.xlsx`}
      toolbar={toolbar} preset={CLIENT_SHEET_PRESET} storeKey="hr.clientExportCols" />
  );
};

export default ClientExportDialog;
