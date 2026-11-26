import { useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { STAGES, deleteRow, insertRow, logEvent, updateRow, useCrm } from "@/lib/hr/model";
import { F, useOpenReset } from "./dialogs";
import { NativeSelect, useAction } from "./ui";

const ACTIVE_STAGES: string[] = STAGES.map((s) => s.value).filter((s) => s !== "Rejected" && s !== "Dropped");

/**
 * Moves candidates from one requirement to another (e.g. they agreed to a better-suited post during
 * the interview). Their interviews, documents and notes go with them. "Keep in both" copies instead.
 */
const MoveDialog = ({ open, onOpenChange, applicationIds }: { open: boolean; onOpenChange: (v: boolean) => void; applicationIds: string[] }) => {
  const crm = useCrm();
  const run = useAction();
  const apps = applicationIds.map((id) => crm.application.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof crm.application.get>>[];
  const fromJobs = new Set(apps.map((a) => a.job_id));
  const [target, setTarget] = useState("");
  const [stage, setStage] = useState("Shortlisted");
  const [keep, setKeep] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useOpenReset(open, () => {
    setTarget("");
    setKeep(false);
    setNote("");
    const s = apps.length === 1 ? apps[0].stage : "Shortlisted";
    setStage(ACTIVE_STAGES.includes(s) ? s : "Shortlisted");
  });

  const jobLabel = (id: string) => {
    const j = crm.job.get(id);
    return j ? [j.title, j.location, j.client_id ? crm.client.get(j.client_id)?.name : null].filter(Boolean).join(" · ") : "";
  };
  const options = crm.jobs
    .filter((j) => !fromJobs.has(j.id) && (j.status === "Open" || j.status === "On Hold"))
    .map((j) => ({ value: j.id, label: jobLabel(j.id) }));
  const name = apps.length === 1 ? crm.candidate.get(apps[0].candidate_id)?.full_name : `${apps.length} candidates`;

  const save = async () => {
    const to = crm.job.get(target);
    if (!to || !apps.length) return;
    setBusy(true);
    const done = await run(async () => {
      for (const a of apps) {
        const from = crm.job.get(a.job_id);
        const already = crm.applications.find((x) => x.job_id === to.id && x.candidate_id === a.candidate_id);
        let appId = already?.id ?? a.id;
        if (keep) {
          if (!already) appId = (await insertRow<{ id: string }>("crm_applications", { job_id: to.id, candidate_id: a.candidate_id, stage })).id;
          else await updateRow("crm_applications", already.id, { stage });
        } else if (already) {
          // Already on that requirement: bring the interview history over, then drop the old entry.
          const { error } = await supabase.from("crm_interviews").update({ application_id: already.id }).eq("application_id", a.id);
          if (error) throw error;
          await updateRow("crm_applications", already.id, { stage });
          await deleteRow("crm_applications", a.id);
        } else {
          await updateRow("crm_applications", a.id, { job_id: to.id, stage });
        }
        await logEvent({
          candidate_id: a.candidate_id, job_id: to.id, application_id: appId, kind: "stage",
          content: `${keep ? "Also added to" : "Moved from " + (from?.title ?? "another requirement") + " to"} ${to.title} (${stage})${note.trim() ? `: ${note.trim()}` : ""}`,
        });
      }
      return true;
    }, { success: `${name} ${keep ? "also added to" : "moved to"} ${to.title}`, refresh: ["all"] });
    setBusy(false);
    if (done) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" />Move to another requirement</DialogTitle>
          <DialogDescription>
            For when {name} suits (and agrees to) a different post. Interviews, documents and notes go with them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <F label="New requirement">
            <NativeSelect value={target} onChange={setTarget} placeholder="Select a requirement" options={options} />
          </F>
          <F label="Stage in the new requirement">
            <NativeSelect value={stage} onChange={setStage} options={ACTIVE_STAGES} />
          </F>
          <div className="space-y-2 text-sm">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" className="mt-1" checked={!keep} onChange={() => setKeep(false)} />
              <span><strong>Move</strong>: remove from {fromJobs.size === 1 ? <em>{crm.job.get([...fromJobs][0])?.title}</em> : "the current requirement"}</span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" className="mt-1" checked={keep} onChange={() => setKeep(true)} />
              <span><strong>Keep in both</strong>: also consider them for the new post</span>
            </label>
          </div>
          <F label="Reason (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Better fit for ARM, agreed in interview" />
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!target || busy}>{busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}{keep ? "Add" : "Move"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveDialog;
