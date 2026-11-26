import { createContext, useContext, type ReactNode } from "react";
import { Star, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRefresh, type CrmTable } from "@/lib/hr/model";

export const Pill = ({ tone, children, className = "" }: { tone: string; children: ReactNode; className?: string }) => (
  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${tone} ${className}`}>{children}</span>
);

export const PageHeader = ({ title, subtitle, step, actions }: { title: string; subtitle?: string; step?: number; actions?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div>
      {step ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">Step {String(step).padStart(2, "0")}</p> : null}
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) => (
  <div className="rounded-xl border-2 border-dashed bg-card p-10 text-center">
    <Icon className="w-10 h-10 mx-auto text-primary/70 mb-3" />
    <h3 className="font-semibold text-lg">{title}</h3>
    {text && <p className="text-muted-foreground mt-1 max-w-md mx-auto">{text}</p>}
    {action && <div className="mt-4 flex justify-center gap-2 flex-wrap">{action}</div>}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, hint, tone = "bg-primary/10 text-primary", onClick }: {
  icon: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: string; onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="text-left rounded-xl border bg-card p-4 md:p-5 transition enabled:hover:shadow-md enabled:hover:border-primary/40 disabled:cursor-default"
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-5 h-5" /></span>
    </div>
    <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </button>
);

export const Card = ({ title, icon: Icon, actions, children, className = "" }: { title?: ReactNode; icon?: LucideIcon; actions?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`rounded-xl border bg-card ${className}`}>
    {title && (
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
        <h3 className="font-semibold flex items-center gap-2">{Icon && <Icon className="w-4 h-4 text-primary" />}{title}</h3>
        {actions}
      </div>
    )}
    <div className="px-5 pb-5 pt-2">{children}</div>
  </section>
);

/** 1–5 rating used for screening scorecards and satisfaction. */
export const ScoreInput = ({ value, onChange, size = "w-5 h-5" }: { value: number | null; onChange?: (v: number | null) => void; size?: string }) => {
  const star = (n: number) => <Star className={`${size} ${value != null && n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />;
  // Read-only ratings render plain icons so they can sit inside clickable rows.
  if (!onChange) {
    return <span className="inline-flex items-center gap-0.5" aria-label={value ? `${value} of 5` : "Not rated"}>{[1, 2, 3, 4, 5].map((n) => <span key={n}>{star(n)}</span>)}</span>;
  }
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(value === n ? null : n)} aria-label={`${n} of 5`}>{star(n)}</button>
      ))}
    </div>
  );
};

export const NativeSelect = ({ value, onChange, options, placeholder, className = "" }: {
  value: string | null | undefined; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder?: string; className?: string;
}) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    className={`h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
  >
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) => typeof o === "string"
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

/** Runs a write, shows a toast on failure, and refreshes the given tables on success. */
export const useAction = () => {
  const { toast } = useToast();
  const refresh = useRefresh();
  return async <T,>(fn: () => Promise<T>, opts: { success?: string; refresh?: (CrmTable | "all")[] } = {}): Promise<T | undefined> => {
    try {
      const r = await fn();
      if (opts.success) toast({ title: opts.success });
      await refresh(...(opts.refresh ?? ["all"]));
      return r;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message || String(e);
      toast({ title: "Something went wrong", description: msg, variant: "destructive" });
      return undefined;
    }
  };
};

/** Lets any screen open the application panel or dialogs owned by the layout. */
export interface HrUi {
  openApplication: (id: string) => void;
  openNewJob: (clientId?: string) => void;
  openBulkJobs: (clientId?: string) => void;
  openNewClient: () => void;
  openNewCandidate: () => void;
  openNewTask: (preset?: { candidate_id?: string; job_id?: string; client_id?: string }) => void;
  openAddToJob: (opts: { jobId?: string; candidateIds?: string[] }) => void;
  openSchedule: (applicationId?: string, level?: "internal" | "client") => void;
  openBulkSchedule: (jobId?: string, level?: "internal" | "client") => void;
  /** Move candidates (by application id) to another requirement. */
  openMove: (applicationIds: string[]) => void;
}
export const HrUiContext = createContext<HrUi | null>(null);
export const useHrUi = () => {
  const ctx = useContext(HrUiContext);
  if (!ctx) throw new Error("useHrUi must be used inside the HR app");
  return ctx;
};
