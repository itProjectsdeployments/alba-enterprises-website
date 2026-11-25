import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarPlus, Download, MessageCircle, Phone, Search, Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { exportCandidates, formatDate, waLink } from "@/lib/crm";
import { STAGES, STAGE_VALUES, type Application, moveStage, positionAnswerOf, screeningScore, stageTone, useCrm } from "@/lib/hr/model";
import { useAction, useHrUi } from "./ui";

interface Props {
  applications: Application[];
  /** Show the requirement column (used on the all-vacancies pipeline). */
  showJob?: boolean;
  /** Requirement these applications belong to (enables "Schedule interviews"). */
  jobId?: string;
}

const PAGE = 50;
type SortKey = "name" | "stage" | "added" | "score" | "interview";

/** Spreadsheet-style list of the candidates on a requirement, with stage tabs and bulk actions. */
const ApplicationsTable = ({ applications, showJob, jobId }: Props) => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const { toast } = useToast();
  const [stage, setStage] = useState("active");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "added", dir: -1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);

  const nextInterview = useMemo(() => {
    const now = new Date(Date.now() - 3600000).toISOString();
    const m = new Map<string, string>();
    crm.interviews.forEach((i) => {
      if (i.status === "Scheduled" && i.scheduled_at >= now && (!m.has(i.application_id) || i.scheduled_at < m.get(i.application_id)!)) m.set(i.application_id, i.scheduled_at);
    });
    return m;
  }, [crm.interviews]);

  const count = (s: string) => applications.filter((a) => (s === "active" ? !["Rejected", "Dropped"].includes(a.stage) : s === "all" ? true : a.stage === s)).length;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    const list = applications
      .filter((a) => (stage === "active" ? !["Rejected", "Dropped"].includes(a.stage) : stage === "all" ? true : a.stage === stage))
      .map((a) => ({ a, c: crm.candidate.get(a.candidate_id), j: crm.job.get(a.job_id) }))
      .filter(({ c, j }) => {
        if (!c) return false;
        if (!term) return true;
        const hay = [c.full_name, c.email, c.city, c.current_employer, c.job_role, positionAnswerOf(c), j?.title].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(term) || (digits.length >= 3 && (c.phone || "").replace(/\D/g, "").includes(digits));
      });
    const val = (r: (typeof list)[number]): string | number => {
      switch (sort.key) {
        case "name": return r.c!.full_name.toLowerCase();
        case "stage": return STAGE_VALUES.indexOf(r.a.stage);
        case "score": return screeningScore(r.a) ?? -1;
        case "interview": return nextInterview.get(r.a.id) ?? "9999";
        default: return r.a.created_at;
      }
    };
    return list.sort((x, y) => (val(x) > val(y) ? 1 : val(x) < val(y) ? -1 : 0) * sort.dir);
  }, [applications, crm.candidate, crm.job, stage, q, sort, nextInterview]);

  // Only show columns that hold data, plus the form's own questions (e.g. "Age"), so the table mirrors the sheet.
  const HIDDEN_EXTRA = new Set(["Google Form", "Submitted at", "Imported from", "Website application", "Website enquiry"]);
  const STD = [
    { key: "email", label: "Email" }, { key: "city", label: "City" }, { key: "experience", label: "Experience" },
    { key: "current_employer", label: "Current employer" }, { key: "current_salary", label: "Current salary" },
    { key: "expected_salary", label: "Expected salary" }, { key: "notice_period", label: "Notice" },
  ] as const;
  const stdCols = STD.filter((col) => rows.some((r) => r.c && (r.c as Record<string, unknown>)[col.key]));
  const extraCols = (() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => Object.entries((r.c?.extra as Record<string, unknown>) || {}).forEach(([k, v]) => {
      if (k.startsWith("_") || HIDDEN_EXTRA.has(k) || v == null || v === "") return;
      counts.set(k, (counts.get(k) || 0) + 1);
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
  })();
  const extraVal = (c: { extra: unknown }, k: string) => String(((c.extra as Record<string, unknown>) || {})[k] ?? "");
  const colCount = 7 + (showJob ? 1 : 0) + stdCols.length + extraCols.length;

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PAGE, cur * PAGE + PAGE);
  const selIds = [...selected].filter((id) => applications.some((a) => a.id === id));
  const allShown = shown.length > 0 && shown.every((r) => selected.has(r.a.id));

  const toggleAll = () => setSelected((p) => { const n = new Set(p); shown.forEach((r) => (allShown ? n.delete(r.a.id) : n.add(r.a.id))); return n; });
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clickSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "added" ? -1 : 1 }));

  const ctx = (a: Application) => ({ job: crm.job.get(a.job_id), candidate: crm.candidate.get(a.candidate_id), applications: crm.applications, documents: crm.documents });

  const changeStage = async (a: Application, to: string) => {
    if (a.stage === to) return;
    const extra = to === "Rejected" ? { rejection_reason: "Rejected" } : to === "Dropped" ? { rejection_reason: "Candidate dropped out" } : {};
    const r = await run(() => moveStage(a, to, ctx(a), extra), { refresh: ["all"] });
    if (r) toast({ title: `${crm.candidate.get(a.candidate_id)?.full_name} → ${to}`, description: r.notes.join(" · ") || undefined });
  };

  const bulkStage = async (to: string) => {
    if (!to || !selIds.length) return;
    setBusy(true);
    const apps = applications.filter((a) => selIds.includes(a.id) && a.stage !== to);
    await run(async () => {
      for (const a of apps) await moveStage(a, to, ctx(a), to === "Rejected" ? { rejection_reason: "Rejected" } : {});
    }, { success: `${apps.length} moved to ${to}`, refresh: ["all"] });
    setBusy(false);
    setSelected(new Set());
  };

  const removeFromVacancy = async () => {
    if (!selIds.length || !confirm(`Remove ${selIds.length} candidate(s) from this vacancy? They stay in your candidate database.`)) return;
    await run(async () => {
      const { error } = await supabase.from("crm_applications").delete().in("id", selIds);
      if (error) throw error;
    }, { success: `${selIds.length} removed from vacancy`, refresh: ["crm_applications"] });
    setSelected(new Set());
  };

  const exportRows = () => {
    const list = (selIds.length ? rows.filter((r) => selIds.includes(r.a.id)) : rows).map((r) => r.c!);
    if (!list.length) return;
    const title = jobId ? crm.job.get(jobId)?.title ?? "vacancy" : "pipeline";
    exportCandidates(list, `${title.replace(/[^a-zA-Z0-9]+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const Th = ({ k, children, className = "" }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${className}`}>
      {k ? (
        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => clickSort(k)}>
          {children}{sort.key === k && (sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        </button>
      ) : children}
    </th>
  );

  const tabs: [string, string][] = [["active", "All active"], ...STAGES.map((s) => [s.value, s.value] as [string, string]), ["all", "Everything"]];

  return (
    <div className="space-y-3">
      {/* Stage tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(([v, label]) => {
          const n = count(v);
          if (n === 0 && !["active", "Sourced"].includes(v) && stage !== v) return null;
          const dot = STAGES.find((s) => s.value === v)?.dot;
          return (
            <button key={v} onClick={() => { setStage(v); setPage(0); setSelected(new Set()); }}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${stage === v ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}>
              {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}{label}
              <span className={`text-xs font-semibold ${stage === v ? "opacity-90" : "text-muted-foreground"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card" placeholder="Search name, phone, city, employer…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        {jobId && <Button variant="outline" onClick={() => ui.openBulkSchedule(jobId)}><CalendarPlus className="w-4 h-4 mr-1" />Schedule interviews</Button>}
        <Button variant="outline" onClick={exportRows} disabled={!rows.length}><Download className="w-4 h-4 mr-1" />Export{selIds.length ? ` (${selIds.length})` : ""}</Button>
      </div>

      {selIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="font-semibold">{selIds.length} selected</span>
          <select defaultValue="" disabled={busy} onChange={(e) => { bulkStage(e.target.value); e.target.value = ""; }} className="h-9 rounded-md border px-2 bg-background">
            <option value="">Move to stage…</option>
            {STAGE_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="sm" variant="ghost" className="text-rose-700" onClick={removeFromVacancy}><Trash2 className="w-4 h-4 mr-1" />Remove from vacancy</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm" style={{ minWidth: 640 + colCount * 70 }}>
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="px-3 py-2.5 w-10"><Checkbox checked={allShown} onCheckedChange={toggleAll} aria-label="Select all" /></th>
                <Th k="name">Candidate</Th>
                <Th>Phone</Th>
                {showJob && <Th>Vacancy</Th>}
                {stdCols.map((col) => <Th key={col.key}>{col.label}</Th>)}
                {extraCols.map((k) => <Th key={k}>{k.replace(/[:?]+$/, "")}</Th>)}
                <Th>Source</Th>
                <Th k="score">Score</Th>
                <Th k="interview">Next interview</Th>
                <Th k="stage">Stage</Th>
                <Th k="added">Added</Th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr><td colSpan={colCount} className="text-center py-14 text-muted-foreground">{applications.length ? "No candidates match this filter." : "No candidates on this vacancy yet."}</td></tr>
              ) : shown.map(({ a, c, j }) => {
                const score = screeningScore(a);
                const iv = nextInterview.get(a.id);
                return (
                  <tr key={a.id} className={`border-t hover:bg-muted/40 ${selected.has(a.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2"><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} aria-label={`Select ${c!.full_name}`} /></td>
                    <td className="px-3 py-2 max-w-[220px]">
                      <button onClick={() => ui.openApplication(a.id)} className="text-left">
                        <span className="font-medium hover:text-primary block truncate">{c!.full_name}</span>
                        <span className="text-xs text-muted-foreground block truncate">{positionAnswerOf(c!) || c!.job_role || ""}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {c!.phone ? (
                        <span className="inline-flex items-center gap-2">
                          {c!.phone}
                          <a href={`tel:${c!.phone.replace(/\s/g, "")}`} className="text-primary" title="Call"><Phone className="w-3.5 h-3.5" /></a>
                          <a href={waLink(c!.phone)} target="_blank" rel="noopener noreferrer" className="text-emerald-600" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    {showJob && <td className="px-3 py-2 max-w-[180px] truncate text-primary">{j?.title}</td>}
                    {stdCols.map((col) => {
                      const v = String((c as Record<string, unknown>)[col.key] ?? "");
                      return <td key={col.key} className="px-3 py-2 max-w-[180px] truncate" title={v}>{v || <span className="text-muted-foreground">—</span>}</td>;
                    })}
                    {extraCols.map((k) => {
                      const v = extraVal(c!, k);
                      return <td key={k} className="px-3 py-2 max-w-[180px] truncate" title={v}>{v || <span className="text-muted-foreground">—</span>}</td>;
                    })}
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{c!.source}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{score != null ? <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{score.toFixed(1)}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{iv ? new Date(iv).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">
                      <select value={a.stage} onChange={(e) => changeStage(a, e.target.value)}
                        className={`text-xs rounded-full border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${stageTone(a.stage)}`}>
                        {STAGE_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t text-sm text-muted-foreground bg-muted/30">
          <span>{rows.length ? `${cur * PAGE + 1}–${Math.min(rows.length, (cur + 1) * PAGE)} of ${rows.length}` : "0"}</span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></Button>
            <span>Page {cur + 1} / {pages}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Click a name to open the full 7-step panel. Change the stage from the coloured dropdown, or tick several candidates to move them together.</p>
    </div>
  );
};

export default ApplicationsTable;
