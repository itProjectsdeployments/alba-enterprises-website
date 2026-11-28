import { useMemo, useState, type ReactNode } from "react";
import { downloadStyledWorkbook, type XGroup } from "@/lib/hr/styledExcel";
import { Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime } from "@/lib/crm";
import type { Application, Candidate, Interview } from "@/lib/hr/model";
import { useOpenReset } from "./dialogs";

export type ExportRow = { c: Candidate; a?: Application; jobTitle?: string; branch?: string; interviewAt?: string; iv?: Interview };

const ivDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const ivTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

type Col = { id: string; label: string; get: (r: ExportRow) => string; group: "Candidate" | "Form answers" | "Your columns" };

const STD: Col[] = [
  { id: "iv_date", label: "Interview date", get: (r) => (r.iv ? ivDate(r.iv.scheduled_at) : "") },
  { id: "iv_time", label: "Time", get: (r) => (r.iv ? ivTime(r.iv.scheduled_at) : "") },
  { id: "full_name", label: "Name", get: (r) => r.c.full_name },
  { id: "iv_round", label: "Round", get: (r) => r.iv?.kind || "" },
  { id: "iv_mode", label: "Mode", get: (r) => r.iv?.mode || "" },
  { id: "iv_venue", label: "Venue / link", get: (r) => r.iv?.location || "" },
  { id: "iv_interviewer", label: "Interviewer", get: (r) => r.iv?.interviewer || "" },
  { id: "iv_status", label: "Interview status", get: (r) => r.iv?.status || "" },
  { id: "iv_result", label: "Result", get: (r) => r.iv?.result || "" },
  { id: "position", label: "Applied for", get: (r) => r.jobTitle || r.c.job_role || "" },
  { id: "branch", label: "Branch", get: (r) => r.branch || "" },
  { id: "client_interview", label: "Client interview on", get: (r) => (r.interviewAt ? formatDateTime(r.interviewAt) : "") },
  { id: "job_role", label: "Current role", get: (r) => r.c.job_role || "" },
  { id: "experience", label: "Experience", get: (r) => r.c.experience || "" },
  { id: "current_employer", label: "Current hotel / employer", get: (r) => r.c.current_employer || "" },
  { id: "current_salary", label: "Current salary", get: (r) => r.c.current_salary || "" },
  { id: "expected_salary", label: "Expected salary", get: (r) => r.c.expected_salary || "" },
  { id: "notice_period", label: "Notice period", get: (r) => r.c.notice_period || "" },
  { id: "city", label: "City", get: (r) => r.c.city || "" },
  { id: "department", label: "Department", get: (r) => r.c.department || "" },
  { id: "cv_url", label: "CV", get: (r) => r.c.cv_url || "" },
  { id: "phone", label: "Phone", get: (r) => r.c.phone || "" },
  { id: "email", label: "Email", get: (r) => r.c.email || "" },
  { id: "stage", label: "Stage", get: (r) => r.a?.stage || "" },
  { id: "status", label: "Status", get: (r) => r.c.status || "" },
  { id: "source", label: "Source", get: (r) => r.c.source || "" },
  { id: "interview_at", label: "Interview at", get: (r) => (r.c.interview_at ? formatDateTime(r.c.interview_at) : "") },
  { id: "notes", label: "Notes", get: (r) => r.c.notes || "" },
  { id: "created_at", label: "Added on", get: (r) => formatDate(r.c.created_at) },
].map((c) => ({ ...c, group: "Candidate" as const }));

/** What a client usually needs: no contact details, so they come back through you. */
const CLIENT_PRESET = ["full_name", "position", "experience", "current_employer", "current_salary", "expected_salary", "notice_period", "city", "cv_url"];
const HIDDEN_EXTRA = new Set(["Google Form", "Submitted at", "Imported from", "Website application", "Website enquiry"]);
const STORE = "hr.exportCols";

const CV_DAYS = 30;

const ExportDialog = ({ open, onOpenChange, rows, title, filename, heading, groupByVacancy, toolbar, preset = CLIENT_PRESET, storeKey = STORE }: {
  open: boolean; onOpenChange: (v: boolean) => void; rows: ExportRow[]; title: string; filename: string;
  /** Title band of the Excel; defaults to "Candidate list". */
  heading?: { title: string; subtitle: string };
  /** One section per vacancy plus a summary sheet. */
  groupByVacancy?: boolean;
  /** Extra controls shown above the column picker (e.g. which vacancies / rounds). */
  toolbar?: ReactNode;
  preset?: string[];
  storeKey?: string;
}) => {
  const { toast } = useToast();
  const [picked, setPicked] = useState<string[]>(preset);
  const [busy, setBusy] = useState(false);

  // Every column that has data in these rows: standard fields, the form's own questions, HR's own columns.
  const cols = useMemo(() => {
    const has = (c: Col) => rows.some((r) => c.get(r));
    const extra = new Map<string, Col>();
    const custom = new Map<string, Col>();
    rows.forEach((r) => {
      Object.entries((r.c.extra as Record<string, unknown>) || {}).forEach(([k, v]) => {
        if (k.startsWith("_") || HIDDEN_EXTRA.has(k) || v == null || v === "" || extra.has(k)) return;
        extra.set(k, { id: "x:" + k, label: k.replace(/[:?]+\s*$/, ""), group: "Form answers", get: (x) => String(((x.c.extra as Record<string, unknown>) || {})[k] ?? "") });
      });
      Object.entries((r.a?.custom as Record<string, unknown>) || {}).forEach(([k, v]) => {
        if (v == null || v === "" || custom.has(k)) return;
        custom.set(k, { id: "u:" + k, label: k, group: "Your columns", get: (x) => String(((x.a?.custom as Record<string, unknown>) || {})[k] ?? "") });
      });
    });
    return [...STD.filter((c) => c.id === "full_name" || c.id === "position" || has(c)), ...extra.values(), ...custom.values()];
  }, [rows]);

  useOpenReset(open, () => {
    let saved: string[] | null = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey) || "null"); } catch { saved = null; }
    setPicked(Array.isArray(saved) && saved.length ? saved : preset);
  });

  const available = new Set(cols.map((c) => c.id));
  const chosen = picked.filter((id) => available.has(id));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const download = async () => {
    const use = cols.filter((c) => chosen.includes(c.id)).sort((x, y) => chosen.indexOf(x.id) - chosen.indexOf(y.id));
    if (!use.length || !rows.length) return;
    setBusy(true);
    try {
      try { localStorage.setItem(storeKey, JSON.stringify(chosen)); } catch { /* per-browser convenience only */ }
      // CVs uploaded into the CRM are private: give the client a link that works for 30 days.
      const cvLink = new Map<string, string>();
      if (use.some((c) => c.id === "cv_url")) {
        for (const r of rows) {
          const v = r.c.cv_url || "";
          if (v.startsWith("crm-docs:")) {
            const { data } = await supabase.storage.from("crm-docs").createSignedUrl(v.slice(9), CV_DAYS * 86400);
            if (data?.signedUrl) cvLink.set(r.c.id, data.signedUrl);
          } else if (/^https?:\/\//i.test(v)) cvLink.set(r.c.id, v);
        }
      }
      const cvCol = use.findIndex((c) => c.id === "cv_url");
      // Inside a vacancy section the position and branch are already in the section title.
      const cols = groupByVacancy ? use.filter((c) => c.id !== "position" && c.id !== "branch") : use;
      const xcols = [{ label: "S.No.", kind: "index" as const }, ...cols.map((c) => ({ label: c.label, kind: c.id === "cv_url" ? ("link" as const) : ("text" as const) }))];
      const toRow = (r: ExportRow) => {
        const links: Record<number, string> = {};
        const values = ["", ...cols.map((c, j) => {
          if (c.id !== "cv_url") return c.get(r);
          const url = cvLink.get(r.c.id);
          if (url) links[j + 1] = url;
          return "";
        })];
        return { values, links };
      };
      let groups: XGroup[] = [{ title: title, rows: rows.map(toRow) }];
      let summary: { cols: string[]; rows: (string | number)[][] } | undefined;
      if (groupByVacancy) {
        const m = new Map<string, { title: string; branch: string; list: ExportRow[] }>();
        rows.forEach((r) => {
          const key = `${r.branch ?? ""}|${r.jobTitle ?? ""}`;
          const g = m.get(key) ?? { title: r.jobTitle || "Other", branch: r.branch || "", list: [] };
          g.list.push(r);
          m.set(key, g);
        });
        const sorted = [...m.values()].sort((a, b) => a.branch.localeCompare(b.branch) || a.title.localeCompare(b.title));
        groups = sorted.map((g) => ({ title: g.title, note: g.branch || undefined, rows: g.list.map(toRow) }));
        summary = { cols: ["Position", "Branch", "Candidates"], rows: sorted.map((g) => [g.title, g.branch || "—", g.list.length]) };
      }
      await downloadStyledWorkbook({
        filename,
        title: heading?.title ?? "Candidate List",
        subtitle: heading?.subtitle ?? `${title} · ${rows.length} candidate${rows.length === 1 ? "" : "s"}`,
        sheets: [{ name: "Candidates", cols: xcols, groups }],
        summary,
      });
      toast({ title: `Exported ${rows.length} candidate(s)`, description: cvCol >= 0 ? "CV cells are clickable links. Drive CVs must be shared as 'Anyone with the link'." : undefined });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const groups = ["Candidate", "Form answers", "Your columns"] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export {title}</DialogTitle>
          <DialogDescription>{rows.length} candidate(s). Choose the columns to include; they appear in the order you tick them.</DialogDescription>
        </DialogHeader>
        {toolbar}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setPicked(preset)}>For client (no phone/email)</Button>
          <Button size="sm" variant="outline" onClick={() => setPicked(cols.map((c) => c.id))}>Everything</Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked([])}>Clear</Button>
        </div>
        <div className="overflow-y-auto -mx-1 px-1 space-y-4">
          {groups.map((g) => {
            const list = cols.filter((c) => c.group === g);
            if (!list.length) return null;
            return (
              <div key={g}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{g}</p>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {list.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/50">
                      <Checkbox checked={chosen.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                      <span className="truncate">{c.label}</span>
                      {chosen.includes(c.id) && <span className="ml-auto text-xs text-muted-foreground">{chosen.indexOf(c.id) + 1}</span>}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={download} disabled={!chosen.length || !rows.length || busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}Download Excel ({chosen.length} columns)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
