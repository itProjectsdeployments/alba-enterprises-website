import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/crm";
import { type Job, linkFormToJob, listForms, useCrm } from "@/lib/hr/model";
import { Card, NativeSelect, Pill, useAction } from "./ui";

const useLinker = () => {
  const crm = useCrm();
  const run = useAction();
  const { toast } = useToast();
  return async (formTitle: string, jobId: string | null) => {
    const n = await run(() => linkFormToJob(formTitle, jobId, { jobs: crm.jobs, candidates: crm.candidates, candidateMap: crm.candidate }), {
      refresh: ["crm_jobs", "crm_applications", "crm_candidates"],
    });
    if (n === undefined) return;
    const job = jobId ? crm.job.get(jobId) : null;
    toast({
      title: job ? `"${formTitle}" linked to ${job.title}` : `"${formTitle}" unlinked`,
      description: job ? (n ? `${n} existing applicant(s) added to the pipeline. New responses will go there automatically.` : "New responses will go into this requirement automatically.") : undefined,
    });
  };
};

const jobLabel = (j: Job, clientName?: string) => [j.title, j.location, clientName].filter(Boolean).join(" · ");

/** Google Form leads page: every form that has sent responses, each with a requirement picker. */
export const FormsTable = () => {
  const crm = useCrm();
  const link = useLinker();
  const forms = listForms(crm.candidates, crm.jobs);
  const openJobs = crm.jobs.filter((j) => j.status === "Open" || j.status === "On Hold");

  return (
    <Card title="Your Google Forms" icon={ClipboardList}>
      <p className="text-sm text-muted-foreground mb-4">
        Each form appears here after its first response. Pick the vacancy it belongs to: its applicants are added to that requirement's pipeline, now and automatically in future.
      </p>
      {forms.length === 0 ? (
        <p className="text-sm rounded-lg bg-muted/50 p-4">No forms have sent responses yet. Finish the one-time setup on the left (run <strong>setup</strong> in Apps Script) and your forms will be listed here.</p>
      ) : (
        <div className="divide-y border rounded-lg">
          {forms.map((f) => (
            <div key={f.title} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.count} response(s) · latest {formatDateTime(f.latest)}</p>
              </div>
              {f.job ? <Pill tone="bg-emerald-50 text-emerald-700 border-emerald-200"><Link2 className="w-3 h-3 mr-1" />Linked</Pill> : <Pill tone="bg-amber-50 text-amber-800 border-amber-200">Not linked</Pill>}
              <div className="w-80 max-w-full">
                <NativeSelect
                  value={f.job?.id ?? ""}
                  onChange={(v) => link(f.title, v || null)}
                  placeholder="Choose vacancy…"
                  options={openJobs.concat(f.job && !openJobs.includes(f.job) ? [f.job] : []).map((j) => ({ value: j.id, label: jobLabel(j, j.client_id ? crm.client.get(j.client_id)?.name : undefined) }))}
                />
              </div>
            </div>
          ))}
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
  const linkedCount = linked ? forms.find((f) => f.job?.id === job.id)?.count ?? 0 : 0;

  return (
    <Card title="Google Form" icon={ClipboardList}>
      {linked ? (
        <div className="space-y-3">
          <p className="text-sm">Applicants from <strong>"{linked}"</strong> are added to this pipeline automatically.</p>
          <p className="text-xs text-muted-foreground">{linkedCount} response(s) received so far.</p>
          <Button size="sm" variant="outline" onClick={() => link(linked, null)}><Unlink className="w-4 h-4 mr-1" />Unlink form</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Running an ad with a Google Form for this vacancy? Link it so applicants land here automatically.</p>
          {forms.length > 0 && (
            <NativeSelect value="" onChange={(v) => v && link(v, job.id)} placeholder="Choose a form…"
              options={forms.map((f) => ({ value: f.title, label: `${f.title} (${f.count})${f.job ? ` · linked to ${f.job.title}` : ""}` }))} />
          )}
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder={forms.length ? "…or type a new form's exact title" : "Type the form's exact title"} />
            <Button size="sm" disabled={!manual.trim()} onClick={async () => { await link(manual.trim(), job.id); setManual(""); }}>Link</Button>
          </div>
          <Link to="/hr/google-forms" className="text-xs text-primary">How to connect your forms</Link>
        </div>
      )}
    </Card>
  );
};
