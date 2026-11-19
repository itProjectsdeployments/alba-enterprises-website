import { useState } from "react";
import { MapPin, CalendarClock, Briefcase } from "lucide-react";
import { CRM_STATUSES, type Candidate, followUpState, formatDate, statusTone } from "@/lib/crm";

interface Props {
  candidates: Candidate[];
  onMove: (id: string, status: string) => void;
  onOpen: (c: Candidate) => void;
}

const MAX_CARDS = 60;

const PipelineBoard = ({ candidates, onMove, onOpen }: Props) => {
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Drag a card to another column to change its status. Click a card to open the full profile.</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {CRM_STATUSES.map(({ value }) => {
          const items = candidates.filter((c) => c.status === value);
          return (
            <div
              key={value}
              onDragOver={(e) => { e.preventDefault(); setOver(value); }}
              onDragLeave={() => setOver((o) => (o === value ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                const c = candidates.find((x) => x.id === id);
                if (c && c.status !== value) onMove(id, value);
              }}
              className={`w-72 shrink-0 rounded-xl border bg-muted/40 flex flex-col max-h-[72vh] transition-colors ${over === value ? "ring-2 ring-primary bg-primary/5" : ""}`}
            >
              <div className="px-3 py-2.5 border-b flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusTone(value)}`}>{value}</span>
                <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto">
                {items.slice(0, MAX_CARDS).map((c) => {
                  const fu = followUpState(c);
                  return (
                    <button
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      onClick={() => onOpen(c)}
                      className="w-full text-left rounded-lg border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition cursor-grab active:cursor-grabbing"
                    >
                      <p className="font-medium text-sm truncate">{c.full_name}</p>
                      {c.job_role && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate"><Briefcase className="w-3 h-3 shrink-0" />{c.job_role}</p>}
                      {c.city && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate"><MapPin className="w-3 h-3 shrink-0" />{c.city}</p>}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.source}</span>
                        {c.next_follow_up && (
                          <span className={`text-[11px] flex items-center gap-1 ${fu === "overdue" ? "text-rose-700 font-medium" : fu === "today" ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>
                            <CalendarClock className="w-3 h-3" />{formatDate(c.next_follow_up)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {items.length > MAX_CARDS && (
                  <p className="text-xs text-center text-muted-foreground py-2">+{items.length - MAX_CARDS} more. Use the Candidates sheet filters to see all.</p>
                )}
                {items.length === 0 && <p className="text-xs text-center text-muted-foreground py-6">Drop candidates here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineBoard;
