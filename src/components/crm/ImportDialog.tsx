import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  CRM_SOURCES, FIELDS, type Candidate, type CandidateInsert, type FieldKey,
  cellText, cleanPhone, downloadTemplate, guessField, isSerialHeader, normalizeDepartment, normalizeSource,
  normalizeStatus, parseDateCell, phoneKey, readSpreadsheet,
} from "@/lib/crm";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: Candidate[];
  onImported: () => void;
}

type Sheet = { name: string; rows: unknown[][] };
type Step = "pick" | "map" | "done";
const SKIP = "__skip";
const EXTRA = "__extra";

const ImportDialog = ({ open, onOpenChange, existing, onImported }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [mapping, setMapping] = useState<string[]>([]);
  const [defaultSource, setDefaultSource] = useState("WhatsApp");
  const [dupMode, setDupMode] = useState<"skip" | "update">("skip");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number; invalid: number } | null>(null);

  const reset = () => {
    setStep("pick"); setFileName(""); setSheets([]); setSheetIdx(0); setMapping([]); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const close = (v: boolean) => { if (!busy) { onOpenChange(v); if (!v) setTimeout(reset, 200); } };

  const sheet = sheets[sheetIdx];
  const headerRowIdx = useMemo(() => {
    if (!sheet) return 0;
    // First row (within the first 10) with at least two non-empty cells is treated as the header.
    const i = sheet.rows.slice(0, 10).findIndex((r) => r.filter((c) => cellText(c)).length >= 2);
    return i < 0 ? 0 : i;
  }, [sheet]);
  const headers = useMemo(() => (sheet?.rows[headerRowIdx] || []).map((h, i) => cellText(h) || `Column ${i + 1}`), [sheet, headerRowIdx]);
  const dataRows = useMemo(
    () => (sheet?.rows.slice(headerRowIdx + 1) || []).filter((r) => r.some((c) => cellText(c))),
    [sheet, headerRowIdx],
  );

  const autoMap = (hs: string[]) => {
    const used = new Set<string>();
    return hs.map((h) => {
      const g = guessField(h);
      if (g && !used.has(g)) { used.add(g); return g; }
      return h.startsWith("Column ") || isSerialHeader(h) ? SKIP : EXTRA;
    });
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "File too large", description: "Please use a file under 10 MB.", variant: "destructive" }); return; }
    setReading(true);
    try {
      const all = (await readSpreadsheet(file)).filter((s) => s.rows.length > 0);
      if (!all.length) throw new Error("The file has no data.");
      setFileName(file.name);
      setSheets(all);
      setSheetIdx(0);
      const first = all[0];
      const hi = Math.max(0, first.rows.slice(0, 10).findIndex((r) => r.filter((c) => cellText(c)).length >= 2));
      setMapping(autoMap((first.rows[hi] || []).map((h, i) => cellText(h) || `Column ${i + 1}`)));
      setStep("map");
    } catch (e: any) {
      toast({ title: "Couldn't read file", description: e?.message || "Use .xlsx, .xls or .csv", variant: "destructive" });
    } finally {
      setReading(false);
    }
  };

  const changeSheet = (i: number) => {
    setSheetIdx(i);
    const s = sheets[i];
    const hi = Math.max(0, s.rows.slice(0, 10).findIndex((r) => r.filter((c) => cellText(c)).length >= 2));
    setMapping(autoMap((s.rows[hi] || []).map((h, j) => cellText(h) || `Column ${j + 1}`)));
  };

  const setMap = (col: number, value: string) => {
    setMapping((prev) => prev.map((m, i) => {
      if (i === col) return value;
      // A field can only be mapped once; free up the previous column.
      if (value !== SKIP && value !== EXTRA && m === value) return EXTRA;
      return m;
    }));
  };

  const hasName = mapping.includes("full_name");
  const hasContact = mapping.includes("phone") || mapping.includes("email");

  const buildRecords = () => {
    const records: CandidateInsert[] = [];
    let invalid = 0;
    for (const row of dataRows) {
      const rec: Record<string, unknown> = { source: defaultSource, status: "New" };
      const extra: Record<string, string> = {};
      mapping.forEach((m, i) => {
        const raw = row[i];
        const text = cellText(raw);
        if (m === SKIP || !text) return;
        if (m === EXTRA) { extra[headers[i]] = text; return; }
        const key = m as FieldKey;
        if (key === "next_follow_up") rec[key] = parseDateCell(raw);
        else if (key === "status") rec[key] = normalizeStatus(text);
        else if (key === "source") rec[key] = normalizeSource(text, defaultSource);
        else if (key === "department") rec[key] = normalizeDepartment(text);
        else if (key === "phone") rec[key] = cleanPhone(text);
        else if (key === "cv_url") rec[key] = /^https?:\/\//i.test(text) ? text : null;
        else if (key === "notes" && rec.notes) rec.notes = `${rec.notes}\n${text}`;
        else rec[key] = text.slice(0, 2000);
      });
      if (!rec.full_name) {
        const fallbackName = (rec.phone as string) || (rec.email as string);
        if (!fallbackName) { invalid++; continue; }
        rec.full_name = `Unknown (${fallbackName})`;
      }
      if (Object.keys(extra).length) rec.extra = { ...extra, "Imported from": fileName };
      else rec.extra = { "Imported from": fileName };
      records.push(rec as CandidateInsert);
    }
    return { records, invalid };
  };

  const preview = useMemo(() => (step === "map" ? buildRecords().records.slice(0, 5) : []), [step, mapping, dataRows, defaultSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const runImport = async () => {
    setBusy(true);
    try {
      const { records, invalid } = buildRecords();
      const byPhone = new Map<string, Candidate>();
      const byEmail = new Map<string, Candidate>();
      existing.forEach((c) => {
        const k = phoneKey(c.phone);
        if (k.length >= 10) byPhone.set(k, c);
        if (c.email) byEmail.set(c.email.toLowerCase(), c);
      });

      const toInsert: CandidateInsert[] = [];
      const toUpdate: { id: string; patch: Partial<CandidateInsert> }[] = [];
      const seenInFile = new Set<string>();
      let skipped = 0;

      const { data: { user } } = await supabase.auth.getUser();

      for (const r of records) {
        const pk = phoneKey(r.phone);
        const ek = r.email?.toLowerCase() || "";
        const fileKey = pk.length >= 10 ? `p${pk}` : ek ? `e${ek}` : "";
        if (fileKey && seenInFile.has(fileKey)) { skipped++; continue; }
        if (fileKey) seenInFile.add(fileKey);

        const match = (pk.length >= 10 && byPhone.get(pk)) || (ek && byEmail.get(ek)) || null;
        if (match) {
          if (dupMode === "skip") { skipped++; continue; }
          // Fill in only the fields the sheet provides; never blank out existing data.
          const patch: Partial<CandidateInsert> = {};
          (Object.keys(r) as (keyof CandidateInsert)[]).forEach((k) => {
            const v = r[k];
            if (k === "extra") patch.extra = { ...(match.extra as object), ...(v as object) };
            else if (v !== null && v !== undefined && v !== "" && !(k === "status" && v === "New") && !(k === "source" && v === defaultSource && match.source)) {
              (patch as any)[k] = v;
            }
          });
          toUpdate.push({ id: match.id, patch });
        } else {
          toInsert.push({ ...r, created_by: user?.id ?? null });
        }
      }

      for (let i = 0; i < toInsert.length; i += 500) {
        const { error } = await supabase.from("crm_candidates").insert(toInsert.slice(i, i + 500));
        if (error) throw error;
      }
      for (const u of toUpdate) {
        const { error } = await supabase.from("crm_candidates").update(u.patch).eq("id", u.id);
        if (error) throw error;
      }

      setResult({ added: toInsert.length, updated: toUpdate.length, skipped, invalid });
      setStep("done");
      onImported();
    } catch (e: any) {
      toast({ title: "Import failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-primary" /> Import candidates</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls) or CSV file of leads from WhatsApp, email, job portals or anywhere else.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="w-full border-2 border-dashed rounded-xl p-10 text-center hover:border-primary hover:bg-primary/5 transition-colors"
              disabled={reading}
            >
              {reading ? <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" /> : <Upload className="w-10 h-10 mx-auto text-primary" />}
              <p className="mt-3 font-medium">{reading ? "Reading file..." : "Click to choose a file, or drag it here"}</p>
              <p className="text-sm text-muted-foreground mt-1">The first row should contain column names such as Name, Phone, Email, Position.</p>
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="flex items-center justify-between flex-wrap gap-3 text-sm bg-muted/50 rounded-lg p-4">
              <span className="text-muted-foreground">Not sure about the format? Start from our template.</span>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate()}><Download className="w-4 h-4 mr-2" /> Download template</Button>
            </div>
          </div>
        )}

        {step === "map" && sheet && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="text-sm">
                <p className="font-medium">{fileName}</p>
                <p className="text-muted-foreground">{dataRows.length} rows found</p>
              </div>
              {sheets.length > 1 && (
                <div className="w-48">
                  <Label className="text-xs">Sheet</Label>
                  <Select value={String(sheetIdx)} onValueChange={(v) => changeSheet(+v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{sheets.map((s, i) => <SelectItem key={s.name} value={String(i)}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="w-48">
                <Label className="text-xs">Source (if the sheet has no Source column)</Label>
                <Select value={defaultSource} onValueChange={setDefaultSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CRM_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">1. Match your columns</h4>
              <p className="text-sm text-muted-foreground mb-3">We matched what we could. Columns set to "Keep as extra info" are saved and shown on the candidate's profile.</p>
              <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
                {headers.map((h, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_220px] gap-3 items-center px-3 py-2 text-sm">
                    <span className="font-medium truncate" title={h}>{h}</span>
                    <span className="text-muted-foreground truncate">{cellText(dataRows[0]?.[i]) || "—"}</span>
                    <Select value={mapping[i] ?? SKIP} onValueChange={(v) => setMap(i, v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EXTRA}>Keep as extra info</SelectItem>
                        <SelectItem value={SKIP}>Don't import</SelectItem>
                        {FIELDS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {(!hasName || !hasContact) && (
                <p className="text-sm text-amber-700 mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {!hasName ? "No column is matched to Name. Rows will be named by phone/email." : "No Phone or Email column matched, so duplicates can't be detected."}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. If a candidate already exists (same phone or email)</h4>
              <RadioGroup value={dupMode} onValueChange={(v) => setDupMode(v as "skip" | "update")} className="flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="skip" /> Skip them</label>
                <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="update" /> Update them with the sheet's details</label>
              </RadioGroup>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Preview</h4>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr>{["Name", "Phone", "Email", "City", "Role", "Department", "Status", "Source"].map((h) => <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-t">
                        {[r.full_name, r.phone, r.email, r.city, r.job_role, r.department, r.status, r.source].map((v, j) => (
                          <td key={j} className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate">{(v as string) || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={reset} disabled={busy}>Choose another file</Button>
              <Button onClick={runImport} disabled={busy || !dataRows.length}>
                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : `Import ${dataRows.length} rows`}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-semibold">Import complete</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-sm">
              <div className="border rounded-lg p-3"><p className="text-2xl font-bold text-emerald-700">{result.added}</p>added</div>
              <div className="border rounded-lg p-3"><p className="text-2xl font-bold text-sky-700">{result.updated}</p>updated</div>
              <div className="border rounded-lg p-3"><p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>duplicates skipped</div>
              <div className="border rounded-lg p-3"><p className="text-2xl font-bold text-rose-700">{result.invalid}</p>rows without name/contact</div>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={reset}>Import another file</Button>
              <Button onClick={() => close(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
