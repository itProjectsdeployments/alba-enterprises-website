import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ExternalLink, Maximize2, Plus, Search, Trash2, X, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CRM_SOURCES, DEPARTMENT_NAMES, FIELDS, OPEN_STATUSES, STATUS_VALUES, type Candidate, type CandidateInsert, type FieldDef,
  cleanPhone, followUpState, normalizeCvLink, statusTone, todayISO, toISODate, waLink,
} from "@/lib/crm";

export interface GridFilters {
  search: string;
  status: string;
  source: string;
  department: string;
  followUp: string;
}

export const EMPTY_FILTERS: GridFilters = { search: "", status: "active", source: "all", department: "all", followUp: "all" };

interface Props {
  candidates: Candidate[];
  filters: GridFilters;
  onFiltersChange: (f: GridFilters) => void;
  onUpdate: (id: string, patch: Partial<Candidate>) => Promise<boolean>;
  onCreate: (rec: CandidateInsert) => Promise<boolean>;
  onOpen: (c: Candidate) => void;
  onBulkUpdate: (ids: string[], patch: Partial<Candidate>) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onFilteredChange?: (rows: Candidate[]) => void;
  actions?: ReactNode;
  /** Extra buttons shown in the bar when rows are selected. */
  bulkActions?: (ids: string[]) => ReactNode;
}

const PAGE_SIZE = 50;

export const applyFilters = (rows: Candidate[], f: GridFilters) => {
  const q = f.search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const today = todayISO();
  const weekEnd = toISODate(new Date(Date.now() + 7 * 86400000));
  return rows.filter((c) => {
    if (f.status === "active" && !OPEN_STATUSES.includes(c.status)) return false;
    if (f.status !== "active" && f.status !== "all" && c.status !== f.status) return false;
    if (f.source !== "all" && c.source !== f.source) return false;
    if (f.department !== "all" && (c.department || "") !== f.department) return false;
    if (f.followUp !== "all") {
      const st = followUpState(c);
      if (f.followUp === "overdue" && st !== "overdue") return false;
      if (f.followUp === "today" && st !== "today") return false;
      if (f.followUp === "week" && !(c.next_follow_up && c.next_follow_up >= today && c.next_follow_up <= weekEnd)) return false;
      if (f.followUp === "none" && c.next_follow_up) return false;
    }
    if (q) {
      const hay = [c.full_name, c.email, c.city, c.job_role, c.department, c.current_employer, c.notes, ...(c.tags || [])]
        .filter(Boolean).join(" ").toLowerCase();
      const phoneHit = qDigits.length >= 3 && (c.phone || "").replace(/\D/g, "").includes(qDigits);
      if (!hay.includes(q) && !phoneHit) return false;
    }
    return true;
  });
};

/* ---------------- Editable cell ---------------- */

const EditableCell = ({ field, value, onCommit }: { field: FieldDef; value: string | null; onCommit: (v: string | null) => void }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(value ?? ""); }, [value, editing]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    let v: string | null = draft.trim() || null;
    if (field.key === "phone" && v) v = cleanPhone(v);
    if (field.key === "cv_url" && v) { const link = normalizeCvLink(v); if (!link) { alert("That doesn't look like a link. Please paste the full Drive link."); return; } v = link; }
    if (field.key === "full_name" && !v) return; // name can't be blank
    if ((v ?? null) !== (value ?? null)) onCommit(v);
  };

  if (field.kind === "status") {
    return (
      <select
        value={value || "New"}
        onChange={(e) => onCommit(e.target.value)}
        className={`w-full text-xs rounded-full border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${statusTone(value || "New")}`}
      >
        {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }
  if (field.kind === "source" || field.kind === "department") {
    const opts = field.kind === "source" ? CRM_SOURCES : DEPARTMENT_NAMES;
    const all = value && !opts.includes(value) ? [value, ...opts] : opts;
    return (
      <select
        value={value || ""}
        onChange={(e) => onCommit(e.target.value || null)}
        className="w-full bg-transparent text-sm px-1 py-1 rounded cursor-pointer hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {field.kind === "department" && <option value="">—</option>}
        {all.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }
  if (field.kind === "date") {
    const st = value ? followUpState({ next_follow_up: value, status: "New" }) : null;
    return (
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onCommit(e.target.value || null)}
        className={`w-full bg-transparent text-sm px-1 py-1 rounded cursor-pointer hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${st === "overdue" ? "text-rose-700 font-medium" : st === "today" ? "text-amber-700 font-medium" : ""}`}
      />
    );
  }
  if (field.kind === "url" && !editing) {
    const isLink = !!value && /^https?:\/\//i.test(value);
    return (
      <div className="flex items-center gap-1">
        {isLink && <a href={value!} target="_blank" rel="noopener noreferrer" className="text-primary text-sm inline-flex items-center gap-1 hover:underline shrink-0">Open <ExternalLink className="w-3 h-3" /></a>}
        {value && !isLink && <span className="text-xs text-muted-foreground shrink-0">Uploaded file</span>}
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-primary px-1 rounded hover:bg-muted">{value ? "edit" : "+ add link"}</button>
      </div>
    );
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        className="w-full text-sm px-1.5 py-1 rounded border border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left text-sm px-1.5 py-1 rounded hover:bg-muted truncate min-h-[28px]"
      title={value || "Click to edit"}
    >
      {value || <span className="text-muted-foreground/50">—</span>}
    </button>
  );
};

/* ---------------- Grid ---------------- */

const CandidateGrid = ({
  candidates, filters, onFiltersChange, onUpdate, onCreate, onOpen, onBulkUpdate, onBulkDelete, onFilteredChange, actions, bulkActions,
}: Props) => {
  const [sort, setSort] = useState<{ key: keyof Candidate; dir: "asc" | "desc" }>({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quick, setQuick] = useState({ full_name: "", phone: "", job_role: "", source: "WhatsApp" });
  const [adding, setAdding] = useState(false);

  const setF = (patch: Partial<GridFilters>) => { onFiltersChange({ ...filters, ...patch }); setPage(0); };

  const filtered = useMemo(() => applyFilters(candidates, filters), [candidates, filters]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = (a[sort.key] ?? "") as string;
      const bv = (b[sort.key] ?? "") as string;
      if (!av && bv) return 1;
      if (av && !bv) return -1;
      return av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [filtered, sort]);

  useEffect(() => { onFilteredChange?.(sorted); }, [sorted]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const rows = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const visibleIds = rows.map((r) => r.id);
  const allOnPage = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected((prev) => {
    const n = new Set(prev);
    if (allOnPage) visibleIds.forEach((id) => n.delete(id)); else visibleIds.forEach((id) => n.add(id));
    return n;
  });
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const clickSort = (key: keyof Candidate) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const quickAdd = async () => {
    if (!quick.full_name.trim()) return;
    setAdding(true);
    const ok = await onCreate({
      full_name: quick.full_name.trim(),
      phone: quick.phone.trim() ? cleanPhone(quick.phone) : null,
      job_role: quick.job_role.trim() || null,
      source: quick.source,
      status: "New",
    });
    setAdding(false);
    if (ok) setQuick({ full_name: "", phone: "", job_role: "", source: quick.source });
  };

  const selIds = [...selected].filter((id) => candidates.some((c) => c.id === id));
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 justify-end">{actions}</div>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, phone, email, city, role, notes, tags..." value={filters.search} onChange={(e) => setF({ search: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filters.status} onValueChange={(v) => setF({ status: v })}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active pipeline</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.source} onValueChange={(v) => setF({ source: v })}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {CRM_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.department} onValueChange={(v) => setF({ department: v })}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {DEPARTMENT_NAMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.followUp} onValueChange={(v) => setF({ followUp: v })}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any follow-up</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Due today</SelectItem>
              <SelectItem value="week">Next 7 days</SelectItem>
              <SelectItem value="none">No follow-up set</SelectItem>
            </SelectContent>
          </Select>
          {filtersActive && (
            <Button variant="ghost" size="sm" className="h-10" onClick={() => { onFiltersChange(EMPTY_FILTERS); setPage(0); }}>
              <X className="w-4 h-4 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bulk bar */}
      {selIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="font-medium">{selIds.length} selected</span>
          <select
            defaultValue=""
            onChange={async (e) => { if (e.target.value) { await onBulkUpdate(selIds, { status: e.target.value }); e.target.value = ""; } }}
            className="border rounded px-2 py-1 bg-background"
          >
            <option value="">Set status…</option>
            {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="date"
            onChange={async (e) => { if (e.target.value) { await onBulkUpdate(selIds, { next_follow_up: e.target.value }); e.target.value = ""; } }}
            className="border rounded px-2 py-1 bg-background"
            title="Set follow-up date"
          />
          {bulkActions?.(selIds)}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { await onBulkDelete(selIds); setSelected(new Set()); }}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      )}

      {/* Sheet */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="overflow-auto max-h-[68vh]">
          <table className="text-sm border-separate border-spacing-0" style={{ minWidth: 60 + FIELDS.reduce((s, f) => s + f.width, 0) }}>
            <thead className="sticky top-0 z-20">
              <tr className="bg-muted">
                <th className="sticky left-0 z-30 bg-muted w-[60px] px-2 py-2 border-b border-r text-left">
                  <Checkbox checked={allOnPage} onCheckedChange={toggleAll} aria-label="Select all on page" />
                </th>
                {FIELDS.map((f, i) => (
                  <th
                    key={f.key}
                    style={{ width: f.width, minWidth: f.width, ...(i === 0 ? { left: 60 } : {}) }}
                    className={`px-2 py-2 border-b border-r text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap ${i === 0 ? "sticky z-30 bg-muted" : ""}`}
                  >
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => clickSort(f.key)}>
                      {f.label}
                      {sort.key === f.key && (sort.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
              {/* Quick add */}
              <tr className="bg-primary/5">
                <td className="sticky left-0 z-30 bg-[hsl(var(--card))] px-2 py-1.5 border-b border-r">
                  <Plus className="w-4 h-4 text-primary" />
                </td>
                <td className="sticky z-30 bg-[hsl(var(--card))] px-1.5 py-1.5 border-b border-r" style={{ left: 60 }}>
                  <Input className="h-8" placeholder="New candidate name" value={quick.full_name} onChange={(e) => setQuick({ ...quick, full_name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && quickAdd()} />
                </td>
                <td className="px-1.5 py-1.5 border-b border-r">
                  <Input className="h-8" placeholder="Phone" value={quick.phone} onChange={(e) => setQuick({ ...quick, phone: e.target.value })} onKeyDown={(e) => e.key === "Enter" && quickAdd()} />
                </td>
                <td className="px-1.5 py-1.5 border-b border-r" colSpan={2}>
                  <Input className="h-8" placeholder="Role / position" value={quick.job_role} onChange={(e) => setQuick({ ...quick, job_role: e.target.value })} onKeyDown={(e) => e.key === "Enter" && quickAdd()} />
                </td>
                <td className="px-1.5 py-1.5 border-b border-r" colSpan={2}>
                  <div className="flex gap-2">
                    <select value={quick.source} onChange={(e) => setQuick({ ...quick, source: e.target.value })} className="h-8 border rounded px-2 bg-background text-sm flex-1">
                      {CRM_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button size="sm" className="h-8" onClick={quickAdd} disabled={adding || !quick.full_name.trim()}>Add</Button>
                  </div>
                </td>
                <td className="border-b" colSpan={FIELDS.length - 6} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={FIELDS.length + 1} className="text-center py-16 text-muted-foreground">
                    {candidates.length === 0 ? "No candidates yet. Import a spreadsheet or add one above." : "No candidates match these filters."}
                  </td>
                </tr>
              ) : rows.map((c) => {
                const fu = followUpState(c);
                const sel = selected.has(c.id);
                const rowBg = sel ? "bg-primary/5" : fu === "overdue" ? "bg-rose-50/60" : "";
                return (
                  <tr key={c.id} className={`group ${rowBg} hover:bg-muted/40`}>
                    <td className={`sticky left-0 z-10 px-2 py-1 border-b border-r ${sel ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--card))]"} group-hover:bg-[hsl(var(--muted))]`}>
                      <div className="flex items-center gap-1.5">
                        <Checkbox checked={sel} onCheckedChange={() => toggle(c.id)} aria-label={`Select ${c.full_name}`} />
                        <button onClick={() => onOpen(c)} className="opacity-60 hover:opacity-100 text-primary" title="Open profile" aria-label={`Open ${c.full_name}`}>
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    {FIELDS.map((f, i) => (
                      <td
                        key={f.key}
                        style={{ width: f.width, minWidth: f.width, maxWidth: f.width, ...(i === 0 ? { left: 60 } : {}) }}
                        className={`px-1 py-0.5 border-b border-r align-middle ${i === 0 ? `sticky z-10 font-medium ${sel ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--card))]"} group-hover:bg-[hsl(var(--muted))]` : ""}`}
                      >
                        {f.key === "phone" && c.phone ? (
                          <div className="flex items-center gap-1">
                            <div className="flex-1 min-w-0"><EditableCell field={f} value={c.phone} onCommit={(v) => onUpdate(c.id, { phone: v })} /></div>
                            <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 opacity-0 group-hover:opacity-100" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>
                            <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-primary opacity-0 group-hover:opacity-100" title="Call"><Phone className="w-3.5 h-3.5" /></a>
                          </div>
                        ) : (
                          <EditableCell field={f} value={(c[f.key] as string | null) ?? null} onCommit={(v) => onUpdate(c.id, { [f.key]: v } as Partial<Candidate>)} />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t text-sm text-muted-foreground bg-muted/30">
          <span>
            {sorted.length === 0 ? "0" : `${safePage * PAGE_SIZE + 1}–${Math.min(sorted.length, (safePage + 1) * PAGE_SIZE)}`} of {sorted.length}
            {sorted.length !== candidates.length && ` (filtered from ${candidates.length})`}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></Button>
            <span>Page {safePage + 1} / {pages}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: click any cell to edit it, and changes save automatically. Rows highlighted in red have an overdue follow-up. Click a column name to sort.
      </p>
    </div>
  );
};

export default CandidateGrid;
