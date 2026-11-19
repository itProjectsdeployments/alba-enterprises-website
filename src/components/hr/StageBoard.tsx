import { useState } from "react";
import { CalendarClock, MapPin, Star } from "lucide-react";
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
            className={`w-64 shrink-0 rounded-xl bg-muted/50 border flex flex-col max-h-[70vh] transition ${over === s.value ? "ring-2 ring-primary bg-primary/5" : ""}`}
          >
            <div className="px-3 py-2.5 flex items-center gap-2 border-b">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-sm font-semibold flex-1 truncate">{s.value}</span>
              {s.step > 0 && <span className="text-[10px] text-muted-foreground">Step {s.step}</span>}
              <span className="text-xs font-bold bg-background rounded-full px-2 py-0.5 border">{items.length}</span>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto flex-1">
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
                    className="w-full text-left rounded-lg bg-card border p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition cursor-grab active:cursor-grabbing"
                  >
                    <p className="text-sm font-semibold truncate">{c?.full_name ?? "Unknown"}</p>
                    {showJob && j && <p className="text-xs text-primary truncate mt-0.5">{j.title}{j.client_id ? ` · ${crm.client.get(j.client_id)?.name ?? ""}` : ""}</p>}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{[c?.job_role, c?.experience].filter(Boolean).join(" · ") || " "}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      {c?.city && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3" />{c.city}</span>}
                      {score != null && <span className="flex items-center gap-0.5 ml-auto"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{score.toFixed(1)}</span>}
                    </div>
                    {iv && <p className="text-[11px] mt-1.5 text-amber-700 flex items-center gap-1"><CalendarClock className="w-3 h-3" />{iv.kind} · {new Date(iv.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
                    {a.stage === "Offer" && a.joining_date && <p className="text-[11px] mt-1.5 text-lime-700">Joining {formatDate(a.joining_date)}</p>}
                    {(a.stage === "Rejected" || a.stage === "Dropped") && a.rejection_reason && <p className="text-[11px] mt-1.5 text-rose-700 truncate">{a.rejection_reason}</p>}
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
