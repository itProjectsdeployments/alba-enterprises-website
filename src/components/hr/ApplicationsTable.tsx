import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowRightLeft, ArrowUp, CalendarPlus, ChevronLeft, ChevronRight, Columns3, Download, FileText, Maximize2, MessageCircle, MoreVertical, Phone, Plus, Search, Star, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import ExportDialog from "./ExportDialog";
import { CRM_SOURCES, cleanPhone, formatDate, normalizeCvLink, phoneKey, waLink } from "@/lib/crm";
import {
  STAGES, STAGE_VALUES, type Application, type Candidate, logEvent, moveStage, openCv, positionAnswerOf, screeningScore, stageTone, updateRow, useCrm,
} from "@/lib/hr/model";
import { useAction, useHrUi } from "./ui";

interface Props {
  applications: Application[];
  /** Show the requirement column (used on the all-vacancies pipeline). */
  showJob?: boolean;
  /** The requirement this table belongs to: enables adding candidates and managing columns. */
  jobId?: string;
}

const PAGE = 50;
/** Built-in sorts, or `col:<kind>:<key>` for any spreadsheet column. */
type SortKey = "name" | "stage" | "added" | "score" | "interview" | `col:${string}`;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** Reads typed times like "1.15pm- 30th Nov" or "10:30 am" so a time column sorts in real time order. */
const timeKey = (s: string): number | null => {
  const t = s.toLowerCase();
  const tm = t.match(/(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)/);
  const dm = t.match(/(\d{1,2})(?:st|nd|rd|th)?\s*[-/ ]?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  if (!tm && !dm) return null;
  let mins = 0;
  if (tm) { const h = Number(tm[1]) % 12 + (tm[3] === "pm" ? 12 : 0); mins = h * 60 + Number(tm[2] || 0); }
  const day = dm ? MONTHS.indexOf(dm[2]) * 31 + Number(dm[1]) : 0;
  return day * 1440 + mins;
};

const STD_FIELDS = [
  { key: "email", label: "Email" }, { key: "city", label: "City" }, { key: "job_role", label: "Current role" },
  { key: "experience", label: "Experience" }, { key: "current_employer", label: "Current employer" },
  { key: "current_salary", label: "Current salary" }, { key: "expected_salary", label: "Expected salary" },
  { key: "notice_period", label: "Notice period" }, { key: "cv_url", label: "CV link" }, { key: "notes", label: "Notes" },
] as const;
type StdKey = (typeof STD_FIELDS)[number]["key"];

const HIDDEN_EXTRA = new Set(["Google Form", "Submitted at", "Imported from", "Website application", "Website enquiry"]);

type Col =
  | { kind: "std"; key: StdKey; label: string; pinned: boolean }
  | { kind: "extra"; key: string; label: string }
  | { kind: "custom"; key: string; label: string };

const extraOf = (c?: Candidate) => ((c?.extra as Record<string, unknown>) || {});

/** Click-to-edit cell. Saves on Enter or when you click away; Esc cancels. */
const Cell = ({ value, onSave, placeholder = "—" }: { value: string; onSave: (v: string) => void; placeholder?: string }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const commit = () => { setEditing(false); if (draft.trim() !== value.trim()) onSave(draft.trim()); };
  if (editing) {
    return (
      <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="w-full min-w-[110px] h-8 rounded border border-primary bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} title={value || "Click to edit"}
      className="w-full text-left truncate rounded px-1.5 py-1 hover:bg-muted min-h-[28px] max-w-[200px]">
      {value || <span className="text-muted-foreground/50">{placeholder}</span>}
    </button>
  );
};

/** Spreadsheet-style list of the candidates on a requirement: add rows, add columns, edit cells, move stages. */
const ApplicationsTable = ({ applications, showJob, jobId }: Props) => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const { toast } = useToast();
  const [stage, setStage] = useState("active");
  const [q, setQ] = useState("");
  // The chosen order is remembered per vacancy in this browser.
  const sortStore = `hr.tableSort:${jobId ?? "all"}`;
  const [sort, setSortRaw] = useState<{ key: SortKey; dir: 1 | -1 }>(() => {
    try { const v = JSON.parse(localStorage.getItem(sortStore) || "null"); if (v && typeof v.key === "string" && (v.dir === 1 || v.dir === -1)) return v; } catch { /* default */ }
    return { key: "added", dir: -1 };
  });
  const setSort = (fn: (s: { key: SortKey; dir: 1 | -1 }) => { key: SortKey; dir: 1 | -1 }) => setSortRaw((s) => {
    const next = fn(s);
    try { localStorage.setItem(sortStore, JSON.stringify(next)); } catch { /* per-browser convenience only */ }
    return next;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [newCol, setNewCol] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [draftSource, setDraftSource] = useState("WhatsApp");
  const [adding, setAdding] = useState(false);

  const job = jobId ? crm.job.get(jobId) : undefined;
  const jobCols: string[] = Array.isArray(job?.custom_columns) ? (job!.custom_columns as string[]) : [];

  const nextInterview = useMemo(() => {
    const now = new Date(Date.now() - 3600000).toISOString();
    const m = new Map<string, string>();
    crm.interviews.forEach((i) => {
      if (i.status === "Scheduled" && i.scheduled_at >= now && (!m.has(i.application_id) || i.scheduled_at < m.get(i.application_id)!)) m.set(i.application_id, i.scheduled_at);
    });
    return m;
  }, [crm.interviews]);

  const inStage = (a: Application, s: string) => (s === "active" ? !["Rejected", "Dropped"].includes(a.stage) : s === "all" ? true : a.stage === s);
  const count = (s: string) => applications.filter((a) => inStage(a, s)).length;

  const all = useMemo(() => applications.map((a) => ({ a, c: crm.candidate.get(a.candidate_id), j: crm.job.get(a.job_id) })).filter((r) => r.c), [applications, crm.candidate, crm.job]);

  // Columns: standard fields that have data or were added by HR, the form's own questions, then custom columns.
  const cols: Col[] = useMemo(() => {
    const pinned = new Set(jobCols.filter((c) => c.startsWith("field:")).map((c) => c.slice(6)));
    const std: Col[] = STD_FIELDS.filter((f) => pinned.has(f.key) || (f.key !== "job_role" && f.key !== "notes" && all.some((r) => (r.c as Record<string, unknown>)[f.key])))
      .map((f) => ({ kind: "std", key: f.key, label: f.label, pinned: pinned.has(f.key) }));
    const counts = new Map<string, number>();
    all.forEach((r) => Object.entries(extraOf(r.c)).forEach(([k, v]) => { if (!k.startsWith("_") && !HIDDEN_EXTRA.has(k) && v != null && v !== "") counts.set(k, (counts.get(k) || 0) + 1); }));
    const extra: Col[] = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k]) => ({ kind: "extra", key: k, label: k.replace(/[:?]+\s*$/, "") }));
    const custom: Col[] = jobCols.filter((c) => !c.startsWith("field:")).map((c) => ({ kind: "custom", key: c, label: c }));
    return [...std, ...extra, ...custom];
  }, [all, jobCols]);

  const valueOf = (col: Col, a: Application, c: Candidate) =>
    col.kind === "std" ? String((c as Record<string, unknown>)[col.key] ?? "")
      : col.kind === "extra" ? String(extraOf(c)[col.key] ?? "")
        : String(((a.custom as Record<string, unknown>) || {})[col.key] ?? "");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    const list = all.filter((r) => inStage(r.a, stage)).filter(({ a, c, j }) => {
      if (!term) return true;
      const hay = [c!.full_name, c!.email, c!.city, c!.current_employer, c!.job_role, positionAnswerOf(c!), j?.title,
        ...Object.values(extraOf(c)).map(String), ...Object.values((a.custom as Record<string, unknown>) || {}).map(String)].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(term) || (digits.length >= 3 && (c!.phone || "").replace(/\D/g, "").includes(digits));
    });
    const sortCol = sort.key.startsWith("col:") ? cols.find((c) => `col:${c.kind}:${c.key}` === sort.key) : undefined;
    // Column sort: real time order when the column holds times/dates, otherwise A–Z (numbers aware). Empty cells last.
    const colTimes = sortCol ? list.map((r) => timeKey(valueOf(sortCol, r.a, r.c!))) : [];
    const useTime = colTimes.some((t) => t !== null);
    const idx = new Map(list.map((r, i) => [r.a.id, i]));
    const val = (r: (typeof list)[number]): string | number => {
      if (sortCol) {
        if (useTime) return colTimes[idx.get(r.a.id)!] ?? Number.MAX_SAFE_INTEGER;
        return valueOf(sortCol, r.a, r.c!).trim().toLowerCase() || "￿";
      }
      switch (sort.key) {
        case "name": return r.c!.full_name.toLowerCase();
        case "stage": return STAGE_VALUES.indexOf(r.a.stage);
        case "score": return screeningScore(r.a) ?? -1;
        case "interview": return nextInterview.get(r.a.id) ?? "9999";
        default: return r.a.created_at;
      }
    };
    const cmp = (x: string | number, y: string | number) =>
      typeof x === "string" && typeof y === "string" ? x.localeCompare(y, undefined, { numeric: true }) : x > y ? 1 : x < y ? -1 : 0;
    // Tie-breaker keeps rows in a fixed order, so saving a cell never shuffles them.
    return list.sort((x, y) => cmp(val(x), val(y)) * sort.dir || x.a.created_at.localeCompare(y.a.created_at) || x.a.id.localeCompare(y.a.id));
  }, [all, stage, q, sort, nextInterview, cols]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PAGE, cur * PAGE + PAGE);
  const selIds = [...selected].filter((id) => applications.some((a) => a.id === id));
  const allShown = shown.length > 0 && shown.every((r) => selected.has(r.a.id));
  const colCount = 8 + (showJob ? 1 : 0) + cols.length;

  const toggleAll = () => setSelected((p) => { const n = new Set(p); shown.forEach((r) => (allShown ? n.delete(r.a.id) : n.add(r.a.id))); return n; });
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clickSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "added" ? -1 : 1 }));
  const ctx = (a: Application) => ({ job: crm.job.get(a.job_id), candidate: crm.candidate.get(a.candidate_id), applications: crm.applications, documents: crm.documents });

  /* ----- cell saving ----- */

  const saveCell = (col: Col, a: Application, c: Candidate, v: string) => {
    if (col.kind === "std" && col.key === "cv_url") {
      const link = normalizeCvLink(v);
      if (v && !link) { toast({ title: "That doesn't look like a link", description: "Paste the full Google Drive link.", variant: "destructive" }); return; }
      return run(() => updateRow("crm_candidates", c.id, { cv_url: link }), { refresh: ["crm_candidates"] });
    }
    if (col.kind === "std") return run(() => updateRow("crm_candidates", c.id, { [col.key]: v || null }), { refresh: ["crm_candidates"] });
    if (col.kind === "extra") return run(() => updateRow("crm_candidates", c.id, { extra: { ...extraOf(c), [col.key]: v } }), { refresh: ["crm_candidates"] });
    return run(() => updateRow("crm_applications", a.id, { custom: { ...((a.custom as Record<string, unknown>) || {}), [col.key]: v } }), { refresh: ["crm_applications"] });
  };
  const savePhone = (c: Candidate, v: string) => run(() => updateRow("crm_candidates", c.id, { phone: v ? cleanPhone(v) : null }), { refresh: ["crm_candidates"] });

  /* ----- columns ----- */
  const saveCols = (next: string[]) => job && run(() => updateRow("crm_jobs", job.id, { custom_columns: next }), { refresh: ["crm_jobs"] });
  const addCustomCol = async () => {
    const name = (newCol ?? "").trim();
    if (!name) return;
    if (cols.some((c) => c.label.toLowerCase() === name.toLowerCase())) { toast({ title: "That column already exists", variant: "destructive" }); return; }
    await saveCols([...jobCols, name]);
    setNewCol(null);
  };
  const renameCol = async (col: Col) => {
    const name = prompt("Rename column", col.label)?.trim();
    if (!name || name === col.key || !job) return;
    await run(async () => {
      await updateRow("crm_jobs", job.id, { custom_columns: jobCols.map((c) => (c === col.key ? name : c)) });
      for (const a of applications) {
        const custom = (a.custom as Record<string, unknown>) || {};
        if (col.key in custom) { const { [col.key]: v, ...rest } = custom; await updateRow("crm_applications", a.id, { custom: { ...rest, [name]: v } }); }
      }
    }, { refresh: ["crm_jobs", "crm_applications"] });
  };
  const removeCol = (col: Col) => {
    if (col.kind === "custom" && !confirm(`Remove the column "${col.label}" from this vacancy? Values typed in it will be hidden.`)) return;
    saveCols(jobCols.filter((c) => c !== (col.kind === "std" ? `field:${col.key}` : col.key)));
  };
  const hiddenStd = STD_FIELDS.filter((f) => !cols.some((c) => c.kind === "std" && c.key === f.key));

  /* ----- add a candidate row ----- */
  const addRow = async () => {
    const name = (draft.__name ?? "").trim();
    if (!name || !job) return;
    setAdding(true);
    const phone = (draft.__phone ?? "").trim();
    const r = await run(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const pk = phoneKey(phone);
      let cand = pk.length >= 10 ? crm.candidates.find((c) => phoneKey(c.phone) === pk) : undefined;
      const std: Record<string, string> = {};
      const extra: Record<string, string> = {};
      const custom: Record<string, string> = {};
      cols.forEach((col) => {
        const v = (draft[col.kind + ":" + col.key] ?? "").trim();
        if (!v) return;
        if (col.kind === "std") std[col.key] = v; else if (col.kind === "extra") extra[col.key] = v; else custom[col.key] = v;
      });
      let existed = !!cand;
      if (!cand) {
        const { data, error } = await supabase.from("crm_candidates").insert({
          full_name: name, phone: phone ? cleanPhone(phone) : null, source: draftSource, status: "In Process", ...std, extra, created_by: user?.id ?? null,
        }).select().single();
        if (error) throw error;
        cand = data;
        existed = false;
      }
      const { data: app, error: e2 } = await supabase.from("crm_applications")
        .upsert({ job_id: job.id, candidate_id: cand!.id, stage: "Sourced", custom, created_by: user?.id ?? null }, { onConflict: "job_id,candidate_id", ignoreDuplicates: true })
        .select();
      if (e2) throw e2;
      await logEvent({ candidate_id: cand!.id, job_id: job.id, kind: "note", content: existed ? `Added to "${job.title}"` : `Candidate added to "${job.title}" (source: ${draftSource})` });
      return { existed, already: !app?.length, name: cand!.full_name };
    }, { refresh: ["crm_candidates", "crm_applications"] });
    setAdding(false);
    if (r) {
      toast({ title: r.already ? `${r.name} is already on this vacancy` : r.existed ? `${r.name} was already in your database: added to this vacancy` : `${r.name} added` });
      setDraft({});
    }
  };

  /* ----- stages & bulk ----- */
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
    await run(async () => { for (const a of apps) await moveStage(a, to, ctx(a), to === "Rejected" ? { rejection_reason: "Rejected" } : {}); }, { success: `${apps.length} moved to ${to}`, refresh: ["all"] });
    setBusy(false);
    setSelected(new Set());
  };
  const removeFromVacancy = async () => {
    if (!selIds.length || !confirm(`Remove ${selIds.length} candidate(s) from this vacancy? They stay in your candidate database.`)) return;
    await run(async () => { const { error } = await supabase.from("crm_applications").delete().in("id", selIds); if (error) throw error; }, { success: `${selIds.length} removed from vacancy`, refresh: ["crm_applications"] });
    setSelected(new Set());
  };
  const exportList = (selIds.length ? rows.filter((r) => selIds.includes(r.a.id)) : rows).map((r) => ({ c: r.c!, a: r.a, jobTitle: r.j?.title }));
  const exportRows = () => { if (exportList.length) setExportOpen(true); };

  const Th = ({ k, children, className = "" }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${className}`}>
      {k ? <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => clickSort(k)}>{children}{sort.key === k && (sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}</button> : children}
    </th>
  );

  const tabs: [string, string][] = [["active", "All active"], ...STAGES.map((s) => [s.value, s.value] as [string, string]), ["all", "Everything"]];
  const inputCls = "h-8 w-full min-w-[110px] rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-3">
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card" placeholder="Search name, phone, any column…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        {job && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><Columns3 className="w-4 h-4 mr-1" />+ Column</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setNewCol("")}><Plus className="w-4 h-4 mr-2" />New custom column…</DropdownMenuItem>
              {hiddenStd.length > 0 && <><DropdownMenuSeparator /><DropdownMenuLabel className="text-xs text-muted-foreground">Show a standard field</DropdownMenuLabel></>}
              {hiddenStd.map((f) => <DropdownMenuItem key={f.key} onClick={() => saveCols([...jobCols, `field:${f.key}`])}>{f.label}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {jobId && <Button variant="outline" onClick={() => ui.openBulkSchedule(jobId)}><CalendarPlus className="w-4 h-4 mr-1" />Schedule interviews</Button>}
        <Button variant="outline" onClick={exportRows} disabled={!rows.length}><Download className="w-4 h-4 mr-1" />Export{selIds.length ? ` (${selIds.length})` : ""}</Button>
      </div>

      {newCol !== null && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <span className="text-sm font-medium">New column name:</span>
          <Input autoFocus className="h-9 w-64" value={newCol} onChange={(e) => setNewCol(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustomCol(); if (e.key === "Escape") setNewCol(null); }}
            placeholder="e.g. Interview feedback, Shift preference" />
          <Button size="sm" onClick={addCustomCol} disabled={!newCol.trim()}>Add column</Button>
          <Button size="sm" variant="ghost" onClick={() => setNewCol(null)}>Cancel</Button>
        </div>
      )}

      {selIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="font-semibold">{selIds.length} selected</span>
          <select defaultValue="" disabled={busy} onChange={(e) => { bulkStage(e.target.value); e.target.value = ""; }} className="h-9 rounded-md border px-2 bg-background">
            <option value="">Move to stage…</option>
            {STAGE_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={() => ui.openMove(selIds)}><ArrowRightLeft className="w-4 h-4 mr-1" />Move to another requirement</Button>
          {jobId && <Button size="sm" variant="ghost" className="text-rose-700" onClick={removeFromVacancy}><Trash2 className="w-4 h-4 mr-1" />Remove from vacancy</Button>}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm" style={{ minWidth: 720 + colCount * 80 }}>
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="px-3 py-2.5 w-10"><Checkbox checked={allShown} onCheckedChange={toggleAll} aria-label="Select all" /></th>
                <Th k="name">Candidate</Th>
                <Th>Phone</Th>
                {showJob && <Th>Vacancy</Th>}
                {cols.map((col) => (
                  <th key={col.kind + col.key} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <button className="inline-flex items-center gap-1 uppercase hover:text-foreground" onClick={() => clickSort(`col:${col.kind}:${col.key}`)} title="Click to sort">
                        {col.label}
                        {sort.key === `col:${col.kind}:${col.key}` && (sort.dir === 1 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </button>
                      {job && (col.kind === "custom" || (col.kind === "std" && col.pinned)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><button className="rounded p-0.5 hover:bg-background" aria-label={`Column options for ${col.label}`}><MoreVertical className="w-3 h-3" /></button></DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {col.kind === "custom" && <DropdownMenuItem onClick={() => renameCol(col)}>Rename</DropdownMenuItem>}
                            <DropdownMenuItem className="text-rose-700" onClick={() => removeCol(col)}>Remove column</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </span>
                  </th>
                ))}
                <Th>Source</Th>
                <Th k="score">Score</Th>
                <Th k="interview">Next interview</Th>
                <Th k="stage">Stage</Th>
                <Th k="added">Added</Th>
              </tr>
              {job && (
                <tr className="bg-primary/5 border-b">
                  <td className="px-3 py-1.5"><Plus className="w-4 h-4 text-primary" /></td>
                  <td className="px-2 py-1.5"><input className={inputCls} placeholder="New candidate name *" value={draft.__name ?? ""} onChange={(e) => setDraft({ ...draft, __name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addRow()} /></td>
                  <td className="px-2 py-1.5"><input className={inputCls} placeholder="Phone" value={draft.__phone ?? ""} onChange={(e) => setDraft({ ...draft, __phone: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addRow()} /></td>
                  {showJob && <td />}
                  {cols.map((col) => (
                    <td key={col.kind + col.key} className="px-2 py-1.5">
                      <input className={inputCls} placeholder={col.label} value={draft[col.kind + ":" + col.key] ?? ""} onChange={(e) => setDraft({ ...draft, [col.kind + ":" + col.key]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addRow()} />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <select value={draftSource} onChange={(e) => setDraftSource(e.target.value)} className="h-8 rounded border border-input bg-background px-1 text-sm">
                      {CRM_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td colSpan={4} className="px-2 py-1.5">
                    <Button size="sm" className="h-8" onClick={addRow} disabled={adding || !(draft.__name ?? "").trim()}><Plus className="w-4 h-4 mr-1" />Add row</Button>
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr><td colSpan={colCount} className="text-center py-14 text-muted-foreground">{applications.length ? "No candidates match this filter." : job ? "No candidates yet. Type a name in the row above to add one." : "No candidates yet."}</td></tr>
              ) : shown.map(({ a, c, j }) => {
                const score = screeningScore(a);
                const iv = nextInterview.get(a.id);
                return (
                  <tr key={a.id} className={`border-t hover:bg-muted/30 ${selected.has(a.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-1.5"><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} aria-label={`Select ${c!.full_name}`} /></td>
                    <td className="px-3 py-1.5 max-w-[230px]">
                      <button onClick={() => ui.openApplication(a.id)} className="text-left group/name flex items-start gap-1.5">
                        <span className="min-w-0">
                          <span className="font-medium group-hover/name:text-primary block truncate">{c!.full_name}</span>
                          <span className="text-xs text-muted-foreground block truncate">{positionAnswerOf(c!) || c!.job_role || ""}</span>
                        </span>
                        <Maximize2 className="w-3 h-3 mt-1 opacity-0 group-hover/name:opacity-60 shrink-0" />
                      </button>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-[130px]"><Cell value={c!.phone ?? ""} onSave={(v) => savePhone(c!, v)} /></span>
                        {c!.phone && <a href={`tel:${c!.phone.replace(/\s/g, "")}`} className="text-primary" title="Call"><Phone className="w-3.5 h-3.5" /></a>}
                        {c!.phone && <a href={waLink(c!.phone)} target="_blank" rel="noopener noreferrer" className="text-emerald-600" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>}
                      </span>
                    </td>
                    {showJob && <td className="px-3 py-1.5 max-w-[180px] truncate text-primary">{j?.title}</td>}
                    {cols.map((col) => (
                      <td key={col.kind + col.key} className="px-2 py-1.5">
                        {col.kind === "std" && col.key === "cv_url" && c!.cv_url ? (
                          <span className="inline-flex items-center gap-1">
                            <button onClick={() => openCv(c!.cv_url!)} className="text-primary text-sm hover:underline inline-flex items-center gap-1 shrink-0"><FileText className="w-3.5 h-3.5" />Open</button>
                            <span className="w-16"><Cell value={c!.cv_url.startsWith("crm-docs:") ? "" : c!.cv_url} onSave={(v) => saveCell(col, a, c!, v)} placeholder="edit" /></span>
                          </span>
                        ) : <Cell value={valueOf(col, a, c!)} onSave={(v) => saveCell(col, a, c!, v)} placeholder={col.kind === "std" && col.key === "cv_url" ? "+ link" : "—"} />}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{c!.source}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{score != null ? <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{score.toFixed(1)}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs">{iv ? new Date(iv).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-1.5">
                      <select value={a.stage} onChange={(e) => changeStage(a, e.target.value)} className={`text-xs rounded-full border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${stageTone(a.stage)}`}>
                        {STAGE_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</td>
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
      <p className="text-xs text-muted-foreground">
        Click any cell to edit it (saves automatically). Use the top row to add a candidate, and <strong>+ Column</strong> to add your own columns. Click a name to open the full 8-step panel.
      </p>
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} rows={exportList} title={job ? `${job.title}${selIds.length ? " (selected)" : ""}` : "pipeline"}
        filename={`${(job?.title ?? "pipeline").replace(/[^a-zA-Z0-9]+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`} />
    </div>
  );
};

export default ApplicationsTable;
