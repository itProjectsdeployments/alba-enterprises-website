import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const ago = (iso?: string | null) => {
  if (!iso) return null;
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : formatDateTime(iso);
};

/** Requirement page: link this vacancy to its Google Form response spreadsheet. */
export const RequirementFormCard = ({ job }: { job: Job }) => {
  const crm = useCrm();
  const link = useLinker();
  const [manual, setManual] = useState("");
  const linked = job.intake_key;
  const sheetId = sheetIdFromLink(linked);
  // People actually on this vacancy who came from the form (matches what the table shows).
  const routed = linked ? crm.applications.filter((x) => { const c = crm.candidate.get(x.candidate_id); return x.job_id === job.id && !!c && intakeMatches(linked, c); }).length : 0;
  const total = linked ? crm.candidates.filter((c) => intakeMatches(linked, c)).length : 0;
  const shared = linked ? crm.jobs.filter((j) => j.id !== job.id && j.intake_key === linked) : [];

  const status = useQuery({
    queryKey: ["crm", "crm_settings", "sheet_status", sheetId],
    enabled: !!sheetId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("crm_settings").select("value").eq("key", `sheet_status:${sheetId}`).maybeSingle();
      try { return data?.value ? (JSON.parse(data.value) as { checked_at?: string; last_received?: string; error?: string | null; rows?: number }) : null; } catch { return null; }
    },
  });

  const value = manual.trim();
  const looksLikeForm = /docs\.google\.com\/forms\//.test(value);

  return (
    <Card title="Google Form" icon={ClipboardList}>
      {linked ? (
        <div className="space-y-3">
          <p className="text-sm">
            Applicants from {sheetId ? <a href={linked} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">this response spreadsheet</a> : <strong>"{linked}"</strong>} are added to this vacancy automatically.
          </p>
          {sheetId && (
            status.data?.error ? (
              <p className="text-xs rounded-md bg-rose-50 border border-rose-200 text-rose-900 p-2">⚠ {status.data.error}</p>
            ) : status.data?.checked_at ? (
              <p className="text-xs rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 p-2">
                ✓ Syncing: checked {ago(status.data.checked_at)}{status.data.rows != null ? `, ${status.data.rows} row(s) in the sheet` : ""}.
              </p>
            ) : (
              <p className="text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-900 p-2">
                Waiting for the first sync (up to 5 minutes). Nothing after that? Make sure the Alba Recruit script is set up once: <Link to="/hr/google-forms" className="underline">see steps</Link>.
              </p>
            )
          )}
          {shared.length > 0 && (
            <p className="text-xs rounded-md bg-sky-50 border border-sky-200 text-sky-900 p-2">
              Shared with {shared.map((j) => j.title).join(", ")}: applicants are sorted by the position they chose in the form.
            </p>
          )}
          <p className="text-xs text-muted-foreground">{routed} applicant(s) for this vacancy{shared.length ? ` (out of ${total} form responses)` : ""}.</p>
          <Button size="sm" variant="outline" onClick={() => link(linked, null, job.id)}><Unlink className="w-4 h-4 mr-1" />Unlink</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste the link of this vacancy's <strong>response spreadsheet</strong> (in the form: Responses → View in Sheets, then copy the address). Applicants will appear here automatically.
          </p>
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" />
            <Button size="sm" disabled={!value || looksLikeForm} onClick={async () => { await link(value, job.id); setManual(""); }}>Link</Button>
          </div>
          {looksLikeForm && <p className="text-xs text-rose-700">That is the form link. Please paste the <strong>response spreadsheet</strong> link (Responses → View in Sheets).</p>}
          <p className="text-xs text-muted-foreground">One form for two positions? Paste the same spreadsheet link on both vacancies.</p>
          <Link to="/hr/google-forms" className="text-xs text-primary">First time? Set up the sync once</Link>
        </div>
      )}
    </Card>
  );
};
