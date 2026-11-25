import { useState } from "react";
import { CalendarClock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/crm";
import { STAGES, type Application, moveStage, screeningScore, useCrm } from "@/lib/hr/model";
import { useAction, useHrUi } from "./ui";

interface Props {
  applications: Application[];
  showJob?: boolean;
  hideClosed?: boolean;
}

const StageBoard = ({ applications, showJob, hideClosed = true }: Props) => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const { toast } = useToast();
  const [over, setOver] = useState<string | null>(null);
  const cols = STAGES.filter((s) => !hideClosed || s.step > 0);

  const drop = async (stage: string, id: string) => {
    const app = applications.find((a) => a.id === id);
    if (!app || app.stage === stage) return;
    const r = await run(() => moveStage(app, stage, {
      job: crm.job.get(app.job_id), candidate: crm.candidate.get(app.candidate_id), applications: crm.applications, documents: crm.documents,
    }), { refresh: ["all"] });
    if (r) toast({ title: `${crm.candidate.get(app.candidate_id)?.full_name} → ${stage}`, description: r.notes.join(" · ") || undefined });
  };

  const nextInterview = (appId: string) => crm.interviews
    .filter((i) => i.application_id === appId && i.status === "Scheduled" && new Date(i.scheduled_at) >= new Date(Date.now() - 3600000))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {cols.map((s) => {
        const items = applications.filter((a) => a.stage === s.value);
        return (
          <div
            key={s.value}
            onDragOver={(e) => { e.preventDefault(); setOver(s.value); }}
            onDragLeave={() => setOver((o) => (o === s.value ? null : o))}
            onDrop={(e) => { e.preventDefault(); setOver(null); drop(s.value, e.dataTransfer.getData("text/plain")); }}
            className={`w-60 shrink-0 rounded-xl bg-muted/50 border flex flex-col h-[58vh] min-h-[320px] transition ${over === s.value ? "ring-2 ring-primary bg-primary/5" : ""}`}
          >
            <div className="px-3 py-2 flex items-center gap-2 border-b shrink-0">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-sm font-semibold flex-1 truncate">{s.value}</span>
              {s.step > 0 && <span className="text-[10px] text-muted-foreground">Step {s.step}</span>}
              <span className="text-xs font-bold bg-background rounded-full px-2 py-0.5 border">{items.length}</span>
            </div>
            <div className="p-1.5 space-y-1.5 overflow-y-auto flex-1 min-h-0">
              {items.map((a) => {
                const c = crm.candidate.get(a.candidate_id);
                const j = crm.job.get(a.job_id);
                const score = screeningScore(a);
                const iv = nextInterview(a.id);
                return (
                  <button
                    key={a.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                    onClick={() => ui.openApplication(a.id)}
                    className="w-full text-left rounded-md bg-card border px-2.5 py-1.5 shadow-sm hover:shadow hover:border-primary/40 transition cursor-grab active:cursor-grabbing"
                    title={[c?.full_name, c?.phone, c?.job_role, c?.city].filter(Boolean).join(" · ")}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold truncate flex-1">{c?.full_name ?? "Unknown"}</p>
                      {score != null && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{score.toFixed(1)}</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                      {showJob && j ? <span className="text-primary">{j.title} · </span> : null}
                      {iv ? <span className="text-amber-700"><CalendarClock className="w-3 h-3 inline -mt-0.5 mr-0.5" />{new Date(iv.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        : a.stage === "Offer" && a.joining_date ? <span className="text-lime-700">Joining {formatDate(a.joining_date)}</span>
                        : (a.stage === "Rejected" || a.stage === "Dropped") && a.rejection_reason ? <span className="text-rose-700">{a.rejection_reason}</span>
                        : [c?.phone, c?.city].filter(Boolean).join(" · ") || c?.job_role || " "}
                    </p>
                  </button>
                );
              })}
              {items.length === 0 && <p className="text-xs text-center text-muted-foreground py-6">Drop here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StageBoard;
