import { useMemo } from "react";
import { Users, UserPlus, CalendarCheck, BadgeCheck, AlertCircle, Clock, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CRM_SOURCES, CRM_STATUSES, OPEN_STATUSES, type Candidate, followUpState, formatDate, formatDateTime, statusTone, todayISO, waLink,
} from "@/lib/crm";

interface Props {
  candidates: Candidate[];
  onOpen: (c: Candidate) => void;
  onShowFollowUps: (which: "overdue" | "today") => void;
}

const Stat = ({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: number; hint?: string; tone: string }) => (
  <div className="rounded-xl border bg-card p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></span>
    </div>
    <p className="text-3xl font-bold mt-2">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const CrmOverview = ({ candidates, onOpen, onShowFollowUps }: Props) => {
  const data = useMemo(() => {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 86400000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const today = todayISO();
    const overdue = candidates.filter((c) => followUpState(c) === "overdue").sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1));
    const dueToday = candidates.filter((c) => followUpState(c) === "today");
    const interviews = candidates
      .filter((c) => c.interview_at && c.interview_at.slice(0, 10) >= today && OPEN_STATUSES.includes(c.status))
      .sort((a, b) => (a.interview_at! < b.interview_at! ? -1 : 1));
    const byStatus = CRM_STATUSES.map((s) => ({ ...s, count: candidates.filter((c) => c.status === s.value).length }));
    const bySource = CRM_SOURCES.map((s) => ({ name: s, count: candidates.filter((c) => c.source === s).length }))
      .filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
    return {
      total: candidates.length,
      active: candidates.filter((c) => OPEN_STATUSES.includes(c.status)).length,
      newWeek: candidates.filter((c) => c.created_at >= weekAgo).length,
      joinedMonth: candidates.filter((c) => c.status === "Joined" && c.updated_at >= monthStart).length,
      overdue, dueToday, interviews, byStatus, bySource,
    };
  }, [candidates]);

  const maxStatus = Math.max(1, ...data.byStatus.map((s) => s.count));
  const maxSource = Math.max(1, ...data.bySource.map((s) => s.count));

  const FollowRow = ({ c }: { c: Candidate }) => (
    <li className="flex items-center gap-3 py-2.5">
      <button onClick={() => onOpen(c)} className="flex-1 min-w-0 text-left">
        <p className="font-medium text-sm truncate hover:text-primary">{c.full_name}</p>
        <p className="text-xs text-muted-foreground truncate">{[c.job_role, c.city, c.status].filter(Boolean).join(" · ")}</p>
      </button>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.next_follow_up)}</span>
      {c.phone && (
        <>
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-primary" title="Call"><Phone className="w-4 h-4" /></a>
          <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" className="text-emerald-600" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a>
        </>
      )}
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total candidates" value={data.total} hint={`${data.active} in active pipeline`} tone="bg-primary/10 text-primary" />
        <Stat icon={UserPlus} label="Added this week" value={data.newWeek} tone="bg-sky-100 text-sky-700" />
        <Stat icon={CalendarCheck} label="Upcoming interviews" value={data.interviews.length} tone="bg-amber-100 text-amber-700" />
        <Stat icon={BadgeCheck} label="Joined this month" value={data.joinedMonth} tone="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600" /> Overdue follow-ups ({data.overdue.length})</h3>
            {data.overdue.length > 0 && <Button variant="link" size="sm" onClick={() => onShowFollowUps("overdue")}>View in sheet</Button>}
          </div>
          {data.overdue.length === 0 ? <p className="text-sm text-muted-foreground py-4">Nothing overdue. Well done!</p> : (
            <ul className="divide-y">{data.overdue.slice(0, 8).map((c) => <FollowRow key={c.id} c={c} />)}</ul>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /> Follow up today ({data.dueToday.length})</h3>
            {data.dueToday.length > 0 && <Button variant="link" size="sm" onClick={() => onShowFollowUps("today")}>View in sheet</Button>}
          </div>
          {data.dueToday.length === 0 ? <p className="text-sm text-muted-foreground py-4">No follow-ups scheduled for today.</p> : (
            <ul className="divide-y">{data.dueToday.slice(0, 8).map((c) => <FollowRow key={c.id} c={c} />)}</ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Pipeline by status</h3>
          <div className="space-y-2.5">
            {data.byStatus.map((s) => (
              <div key={s.value} className="grid grid-cols-[150px_1fr_40px] items-center gap-3 text-sm">
                <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${s.tone}`}>{s.value}</span>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                </div>
                <span className="text-right font-medium tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Lead sources</h3>
          {data.bySource.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
            <div className="space-y-2.5">
              {data.bySource.map((s) => (
                <div key={s.name} className="text-sm">
                  <div className="flex justify-between mb-1"><span>{s.name}</span><span className="font-medium tabular-nums">{s.count}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(s.count / maxSource) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-amber-600" /> Upcoming interviews</h3>
        {data.interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interviews scheduled. Set an interview date on a candidate's profile to see it here.</p>
        ) : (
          <ul className="divide-y">
            {data.interviews.slice(0, 10).map((c) => (
              <li key={c.id} className="py-2.5 flex items-center gap-3">
                <button onClick={() => onOpen(c)} className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm truncate hover:text-primary">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{[c.job_role, c.current_employer, c.city].filter(Boolean).join(" · ")}</p>
                </button>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusTone(c.status)}`}>{c.status}</span>
                <span className="text-sm font-medium whitespace-nowrap">{formatDateTime(c.interview_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CrmOverview;
