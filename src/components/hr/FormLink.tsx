import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Link2, Unlink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/crm";
import { type Job, intakeMatches, linkFormToJob, listForms, routeFormApplicant, sheetIdFromLink, useCrm } from "@/lib/hr/model";
import { Card, NativeSelect, Pill, useAction } from "./ui";

const useLinker = () => {
  const crm = useCrm();
  const run = useAction();
  const { toast } = useToast();
  return async (formKey: string, jobId: string | null, unlinkJobId?: string) => {
    const n = await run(() => linkFormToJob(formKey, jobId, { jobs: crm.jobs, candidates: crm.candidates, candidateMap: crm.candidate }, unlinkJobId), {
      refresh: ["crm_jobs", "crm_applications", "crm_candidates"],
    });
    if (n === undefined) return;
    const job = jobId ? crm.job.get(jobId) : null;
    toast({
      title: job ? `Form linked to ${job.title}` : "Form unlinked",
      description: job ? (n ? `${n} existing applicant(s) added to the pipeline. New responses will go there automatically.` : "New responses will go into this requirement automatically.") : undefined,
    });
  };
};

const jobLabel = (j: Job, clientName?: string) => [j.title, j.location, clientName].filter(Boolean).join(" · ");

/** Google Form leads page: every form that has sent responses, linked to one or more vacancies. */
export const FormsTable = () => {
  const crm = useCrm();
  const link = useLinker();
  const forms = listForms(crm.candidates, crm.jobs);
  const openJobs = crm.jobs.filter((j) => j.status === "Open" || j.status === "On Hold");

  return (
    <Card title="Your Google Forms" icon={ClipboardList}>
      <p className="text-sm text-muted-foreground mb-4">
        Each form appears here after its first response. Link it to its vacancy. <strong>One form for several positions?</strong> Link it to each of them, and every applicant goes to the vacancy matching the position they chose in the form.
      </p>
      {forms.length === 0 ? (
        <p className="text-sm rounded-lg bg-muted/50 p-4">No forms have sent responses yet. Finish the one-time setup below (run <strong>setup</strong> in Apps Script) and your forms will be listed here.</p>
      ) : (
        <div className="divide-y border rounded-lg">
          {forms.map((f) => {
            const key = f.jobs[0]?.intake_key || f.title;
            return (
              <div key={f.title + f.latest} className="px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.count} response(s) · latest {formatDateTime(f.latest)}</p>
                  </div>
                  {f.jobs.length ? <Pill tone="bg-emerald-50 text-emerald-700 border-emerald-200"><Link2 className="w-3 h-3 mr-1" />{f.jobs.length} vacanc{f.jobs.length === 1 ? "y" : "ies"}</Pill>
                    : <Pill tone="bg-amber-50 text-amber-800 border-amber-200">Not linked</Pill>}
                  <div className="w-72 max-w-full">
                    <NativeSelect value="" onChange={(v) => v && link(key, v)} placeholder={f.jobs.length ? "+ Link another vacancy…" : "Link to vacancy…"}
                      options={openJobs.filter((j) => !f.jobs.includes(j)).map((j) => ({ value: j.id, label: jobLabel(j, j.client_id ? crm.client.get(j.client_id)?.name : undefined) }))} />
                  </div>
                </div>
                {f.jobs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {f.jobs.map((j) => {
                      const n = crm.candidates.filter((c) => routeFormApplicant(c, crm.jobs)?.id === j.id).length;
                      return (
                        <span key={j.id} className="inline-flex items-center gap-1.5 rounded-full border bg-card pl-3 pr-1 py-1 text-xs">
                          <Link to={`/hr/requirements/${j.id}`} className="font-medium hover:text-primary">{j.title}</Link>
                          <span className="text-muted-foreground">{n}</span>
                          <button className="rounded-full p-0.5 hover:bg-muted" onClick={() => link(key, null, j.id)} aria-label={`Unlink ${j.title}`}><X className="w-3 h-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

/** Requirement page: link this vacancy to its Google Form. */
export const RequirementFormCard = ({ job }: { job: Job }) => {
  const crm = useCrm();
  const link = useLinker();
  const [manual, setManual] = useState("");
  const forms = listForms(crm.candidates, crm.jobs);
  const linked = job.intake_key;
  const routed = linked ? crm.candidates.filter((c) => routeFormApplicant(c, crm.jobs)?.id === job.id).length : 0;
  const total = linked ? crm.candidates.filter((c) => intakeMatches(linked, c)).length : 0;
  const shared = linked ? crm.jobs.filter((j) => j.id !== job.id && j.intake_key === linked) : [];
  const isSheet = !!sheetIdFromLink(linked);

  return (
    <Card title="Google Form" icon={ClipboardList}>
      {linked ? (
        <div className="space-y-3">
          <p className="text-sm">
            Applicants from {isSheet ? <a href={linked} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">this response spreadsheet</a> : <strong>"{linked}"</strong>} are added to this pipeline automatically.
          </p>
          {shared.length > 0 && (
            <p className="text-xs rounded-md bg-sky-50 border border-sky-200 text-sky-900 p-2">
              This form is shared with {shared.map((j) => j.title).join(", ")}. Applicants are sorted by the position they chose in the form.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {routed} applicant(s) for this vacancy{shared.length ? ` (out of ${total} form responses)` : ""}.
            {total === 0 && <> Nothing yet? The script must be set up in that spreadsheet first: <Link to="/hr/google-forms" className="text-primary">see steps</Link>.</>}
          </p>
          <Button size="sm" variant="outline" onClick={() => link(linked, null, job.id)}><Unlink className="w-4 h-4 mr-1" />Unlink form</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Running an ad with a Google Form for this vacancy? Link it so applicants land here automatically. The same form can be linked to several vacancies.</p>
          {(forms.length > 0 || crm.jobs.some((j) => j.intake_key)) && (
            <NativeSelect value="" onChange={(v) => v && link(v, job.id)} placeholder="Choose a form already in use…"
              options={[...new Set(crm.jobs.map((j) => j.intake_key).filter(Boolean) as string[])].map((k) => {
                const users = crm.jobs.filter((j) => j.intake_key === k).map((j) => j.title).join(", ");
                return { value: k, label: `${sheetIdFromLink(k) ? "Spreadsheet" : k} (used by ${users})` };
              }).concat(forms.filter((f) => !f.jobs.length).map((f) => ({ value: f.title, label: `${f.title} (${f.count} responses, not linked)` })))} />
          )}
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Paste the response spreadsheet link, or the form title" />
            <Button size="sm" disabled={!manual.trim()} onClick={async () => { await link(manual.trim(), job.id); setManual(""); }}>Link</Button>
          </div>
          <Link to="/hr/google-forms" className="text-xs text-primary">How to connect your forms</Link>
        </div>
      )}
    </Card>
  );
};
