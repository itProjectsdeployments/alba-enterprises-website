import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { levelOfKind, useCrm } from "@/lib/hr/model";
import ExportDialog, { type ExportRow } from "./ExportDialog";
import { useOpenReset } from "./dialogs";

/** Client sheet: candidate details, interview slot and CV. No phone/email, so the client comes back through Alba. */
const CLIENT_SHEET_PRESET = ["full_name", "client_interview", "experience", "current_employer", "current_salary", "expected_salary", "notice_period", "city", "cv_url"];
/** Only candidates selected for the client round go to the client. */
const CLIENT_STAGE = "Client Interview";

/**
 * Export the candidates selected for client interview, for every vacancy of a client
 * (or just one vacancy when `jobId` is given).
 */
const ClientExportDialog = ({ open, onOpenChange, clientId, clientName, jobId }: {
  open: boolean; onOpenChange: (v: boolean) => void; clientId: string | null; clientName: string; jobId?: string;
}) => {
  const crm = useCrm();
  const [skip, setSkip] = useState<string[]>([]);
  useOpenReset(open, () => setSkip([]));

  const jobs = useMemo(() => crm.jobs.filter((j) => (jobId ? j.id === jobId : clientId ? j.client_id === clientId : !j.client_id)), [crm.jobs, clientId, jobId]);

  // Latest client-round interview per application (for the "Client interview on" column).
  const slot = useMemo(() => {
    const m = new Map<string, string>();
    crm.interviews
      .filter((i) => levelOfKind(i.kind) === "client" && i.status !== "Cancelled")
      .forEach((i) => { const cur = m.get(i.application_id); if (!cur || i.scheduled_at > cur) m.set(i.application_id, i.scheduled_at); });
    return m;
  }, [crm.interviews]);

  const perJob = useMemo(() => jobs.map((j) => ({ j, apps: crm.applications.filter((a) => a.job_id === j.id && a.stage === CLIENT_STAGE) }))
    .filter((x) => x.apps.length), [jobs, crm.applications]);

  const rows: ExportRow[] = useMemo(() => perJob
    .filter((x) => !skip.includes(x.j.id))
    .flatMap(({ j, apps }) => apps.flatMap((a) => {
      const c = crm.candidate.get(a.candidate_id);
      return c ? [{ c, a, jobTitle: j.title, branch: j.location?.trim() || "", interviewAt: slot.get(a.id) }] : [];
    }))
    .sort((x, y) => (x.branch || "").localeCompare(y.branch || "") || (x.jobTitle || "").localeCompare(y.jobTitle || "") || x.c.full_name.localeCompare(y.c.full_name)),
  [perJob, skip, crm.candidate, slot]);

  const toggleJob = (id: string) => setSkip((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const date = new Date().toISOString().slice(0, 10);
  const single = jobId ? jobs[0] : undefined;

  const toolbar = (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        Selected for client interview{jobId ? "" : ` · ${perJob.length} vacanc${perJob.length === 1 ? "y" : "ies"}`}
      </p>
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
        <p className="text-sm text-muted-foreground px-2">Nobody is at Client Interview yet. Move candidates to the Client Interview stage (or schedule a client round) and they will appear here.</p>
      )}
    </div>
  );

  const name = single ? `${single.title}` : clientName;
  return (
    <ExportDialog open={open} onOpenChange={onOpenChange} rows={rows} groupByVacancy
      title={`for ${clientName}`}
      heading={{ title: "Candidate Shortlist", subtitle: `${clientName}${single ? "  ·  " + single.title : ""}  ·  Client Interview round  ·  ${rows.length} candidate${rows.length === 1 ? "" : "s"}${single ? "" : ` across ${new Set(rows.map((r) => r.a?.job_id)).size} position(s)`}` }}
      filename={`${name.replace(/[^a-zA-Z0-9]+/g, "_")}_Shortlist_${date}.xlsx`}
      toolbar={toolbar} preset={CLIENT_SHEET_PRESET} storeKey="hr.clientExportCols" />
  );
};

export default ClientExportDialog;
