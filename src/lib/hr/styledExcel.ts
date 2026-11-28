/**
 * Client-ready Excel: title band, branded header, zebra rows, vacancy group bands,
 * clickable CV links, frozen header and filters. Built with ExcelJS (SheetJS CE cannot style cells).
 */
export type XCol = { label: string; kind?: "text" | "link" | "index"; width?: number };
export type XRow = { values: string[]; links?: Record<number, string> };
export type XGroup = { title: string; note?: string; rows: XRow[] };
export type XSheet = { name: string; cols: XCol[]; groups: XGroup[] };

const NAVY = "FF1F3A5F";
const GOLD = "FFC9A227";
const BAND = "FFE8EEF5";
const ZEBRA = "FFF7F9FC";
const LINE = "FFD5DCE6";
const MUTED = "FF5B6B7F";
const LINK = "FF1A5FB4";

const thin = { style: "thin" as const, color: { argb: LINE } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const safeName = (s: string) => s.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Sheet";

export const downloadStyledWorkbook = async (opts: {
  filename: string;
  title: string; // e.g. "Candidate Shortlist"
  subtitle: string; // e.g. "Folks Brewpub · Client Interview round"
  sheets: XSheet[];
  summary?: { cols: string[]; rows: (string | number)[][] };
  company?: string;
}) => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const company = opts.company ?? "Alba Enterprise";
  wb.creator = company;
  wb.created = new Date();
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const banner = (ws: import("exceljs").Worksheet, width: number, title: string, subtitle: string) => {
    const span = Math.max(width, 3);
    ws.mergeCells(1, 1, 1, span);
    const t = ws.getCell(1, 1);
    t.value = title;
    t.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(1).height = 34;

    ws.mergeCells(2, 1, 2, span);
    const s = ws.getCell(2, 1);
    s.value = subtitle;
    s.font = { name: "Calibri", size: 11, color: { argb: "FFFFFFFF" } };
    s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(2).height = 20;

    ws.mergeCells(3, 1, 3, span);
    const g = ws.getCell(3, 1);
    g.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    ws.getRow(3).height = 4;

    ws.mergeCells(4, 1, 4, span);
    const m = ws.getCell(4, 1);
    m.value = `Prepared by ${company} · ${today} · Confidential`;
    m.font = { name: "Calibri", size: 9, italic: true, color: { argb: MUTED } };
    m.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(4).height = 18;
    return 6; // first row after a spacer
  };

  const header = (ws: import("exceljs").Worksheet, r: number, labels: string[]) => {
    const row = ws.getRow(r);
    labels.forEach((l, i) => {
      const c = row.getCell(i + 1);
      c.value = l;
      c.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      c.border = border;
    });
    row.height = 26;
  };

  // Summary sheet
  if (opts.summary && opts.summary.rows.length) {
    const ws = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
    const cols = opts.summary.cols;
    let r = banner(ws, cols.length, opts.title, opts.subtitle);
    header(ws, r, cols);
    r++;
    opts.summary.rows.forEach((vals, i) => {
      const row = ws.getRow(r++);
      vals.forEach((v, j) => {
        const c = row.getCell(j + 1);
        c.value = v;
        c.font = { name: "Calibri", size: 11, bold: j === 0 };
        c.alignment = { vertical: "middle", horizontal: typeof v === "number" ? "center" : "left", indent: typeof v === "number" ? 0 : 1 };
        c.border = border;
        if (i % 2) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      });
      row.height = 22;
    });
    const total = opts.summary.rows.reduce((n, v) => n + (typeof v[v.length - 1] === "number" ? (v[v.length - 1] as number) : 0), 0);
    const tr = ws.getRow(r);
    cols.forEach((_, j) => {
      const c = tr.getCell(j + 1);
      c.value = j === 0 ? "Total candidates" : j === cols.length - 1 ? total : "";
      c.font = { name: "Calibri", size: 11, bold: true, color: { argb: NAVY } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
      c.alignment = { vertical: "middle", horizontal: j === cols.length - 1 ? "center" : "left", indent: j === cols.length - 1 ? 0 : 1 };
      c.border = border;
    });
    tr.height = 22;
    ws.columns = cols.map((c, j) => ({ width: j === cols.length - 1 ? 14 : Math.max(18, c.length + 4, ...opts.summary!.rows.map((v) => String(v[j] ?? "").length + 4)) }));
  }

  for (const sh of opts.sheets) {
    const ws = wb.addWorksheet(safeName(sh.name), {
      views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    const n = sh.cols.length;
    let r = banner(ws, n, opts.title, opts.subtitle);
    header(ws, r, sh.cols.map((c) => c.label));
    const headerRow = r;
    r++;
    const multi = sh.groups.length > 1;
    let idx = 0;
    for (const g of sh.groups) {
      if (multi) {
        ws.mergeCells(r, 1, r, n);
        const c = ws.getCell(r, 1);
        c.value = `${g.title}${g.note ? "   ·   " + g.note : ""}   ·   ${g.rows.length} candidate${g.rows.length === 1 ? "" : "s"}`;
        c.font = { name: "Calibri", size: 11, bold: true, color: { argb: NAVY } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
        c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        c.border = { top: { style: "medium", color: { argb: GOLD } }, bottom: thin, left: thin, right: thin };
        ws.getRow(r).height = 24;
        r++;
      }
      g.rows.forEach((x, i) => {
        idx++;
        const row = ws.getRow(r++);
        sh.cols.forEach((col, j) => {
          const c = row.getCell(j + 1);
          const v = col.kind === "index" ? (multi ? i + 1 : idx) : x.values[j] ?? "";
          const url = x.links?.[j];
          if (col.kind === "link") {
            c.value = url ? { text: "View CV", hyperlink: url, tooltip: "Open CV" } : "—";
            c.font = url ? { name: "Calibri", size: 11, color: { argb: LINK }, underline: true } : { name: "Calibri", size: 11, color: { argb: MUTED } };
            c.alignment = { vertical: "middle", horizontal: "center" };
          } else {
            c.value = v;
            c.font = { name: "Calibri", size: 11, bold: j === 1 && sh.cols[0]?.kind === "index" };
            c.alignment = { vertical: "middle", horizontal: col.kind === "index" ? "center" : "left", wrapText: true, indent: col.kind === "index" ? 0 : 1 };
          }
          c.border = border;
          if (i % 2) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
        });
        row.height = 22;
      });
    }
    if (!multi) ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: Math.max(headerRow, r - 1), column: n } };
    ws.columns = sh.cols.map((col, j) => {
      if (col.width) return { width: col.width };
      if (col.kind === "index") return { width: 7 };
      if (col.kind === "link") return { width: 12 };
      const longest = Math.max(col.label.length, ...sh.groups.flatMap((g) => g.rows.slice(0, 80).map((x) => String(x.values[j] ?? "").length)));
      return { width: Math.min(45, Math.max(12, longest + 3)) };
    });
    // Footer note
    r++;
    ws.mergeCells(r, 1, r, Math.max(n, 3));
    const f = ws.getCell(r, 1);
    f.value = "Click \"View CV\" to open each candidate's résumé. Please share interview feedback and availability with your Alba Enterprise contact.";
    f.font = { name: "Calibri", size: 9, italic: true, color: { argb: MUTED } };
    f.alignment = { indent: 1, wrapText: true };
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = opts.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
