import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEPARTMENTS } from "@/lib/site";

export type Candidate = Database["public"]["Tables"]["crm_candidates"]["Row"];
export type CandidateInsert = Database["public"]["Tables"]["crm_candidates"]["Insert"];
export type Activity = Database["public"]["Tables"]["crm_activities"]["Row"];

/** Overall candidate status. Progress on a specific job is tracked per application (see lib/hr/model). */
export const CRM_STATUSES = [
  { value: "New", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "Contacted", tone: "bg-sky-100 text-sky-800 border-sky-200" },
  { value: "Interested", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { value: "In Process", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "Placed", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "On Hold", tone: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "Not Interested", tone: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  { value: "Not Suitable", tone: "bg-rose-100 text-rose-800 border-rose-200" },
] as const;

export const STATUS_VALUES = CRM_STATUSES.map((s) => s.value) as string[];
export const statusTone = (s: string) =>
  CRM_STATUSES.find((x) => x.value === s)?.tone ?? "bg-muted text-muted-foreground border-border";

/** Statuses that mean the candidate is still being worked on. */
export const OPEN_STATUSES = ["New", "Contacted", "Interested", "In Process", "On Hold"];

export const CRM_SOURCES = [
  "WhatsApp", "Email", "Phone Call", "Website", "Job Portal", "Referral", "Walk-in", "Social Media", "Other",
];

export const DEPARTMENT_NAMES = DEPARTMENTS.map((d) => d.title);

export const ACTIVITY_KINDS = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "interview", label: "Interview" },
  { value: "status", label: "Status change" },
] as const;

export type FieldKey =
  | "full_name" | "phone" | "email" | "city" | "job_role" | "department" | "experience"
  | "current_employer" | "current_salary" | "expected_salary" | "notice_period"
  | "source" | "status" | "next_follow_up" | "notes" | "cv_url";

export interface FieldDef {
  key: FieldKey;
  label: string;
  kind: "text" | "status" | "source" | "department" | "date" | "long" | "url";
  width: number;
  /** Lower-case, alphanumeric-only header names that map to this field on import. */
  synonyms: string[];
}

export const FIELDS: FieldDef[] = [
  { key: "full_name", label: "Name", kind: "text", width: 190, synonyms: ["name", "fullname", "candidatename", "candidate", "applicantname", "employeename", "firstname"] },
  { key: "phone", label: "Phone", kind: "text", width: 170, synonyms: ["phone", "phoneno", "phonenumber", "mobile", "mobileno", "mobilenumber", "contact", "contactno", "contactnumber", "whatsapp", "whatsappno", "whatsappnumber", "cell", "number"] },
  { key: "email", label: "Email", kind: "text", width: 200, synonyms: ["email", "emailid", "emailaddress", "mail", "mailid"] },
  { key: "city", label: "City", kind: "text", width: 130, synonyms: ["city", "location", "currentlocation", "currentcity", "place", "state", "address", "preferredlocation"] },
  { key: "job_role", label: "Role / Position", kind: "text", width: 170, synonyms: ["role", "position", "designation", "jobrole", "jobtitle", "post", "appliedfor", "positionappliedfor", "profile", "currentdesignation", "title"] },
  { key: "department", label: "Department", kind: "department", width: 150, synonyms: ["department", "dept", "category", "function", "division"] },
  { key: "experience", label: "Experience", kind: "text", width: 110, synonyms: ["experience", "exp", "totalexperience", "yearsofexperience", "workexperience", "expyears", "years", "totalexp", "relevantexp", "expinyears", "experienceinyears", "yrs"] },
  { key: "current_employer", label: "Current Hotel / Employer", kind: "text", width: 180, synonyms: ["currentemployer", "employer", "company", "currentcompany", "hotel", "currenthotel", "organisation", "organization", "lastemployer"] },
  { key: "current_salary", label: "Current Salary", kind: "text", width: 120, synonyms: ["currentsalary", "salary", "currentctc", "ctc", "presentsalary", "lastdrawnsalary"] },
  { key: "expected_salary", label: "Expected Salary", kind: "text", width: 120, synonyms: ["expectedsalary", "expectedctc", "ectc", "expected", "salaryexpectation"] },
  { key: "notice_period", label: "Notice Period", kind: "text", width: 110, synonyms: ["noticeperiod", "notice", "availability", "joiningtime", "canjoin"] },
  { key: "source", label: "Source", kind: "source", width: 120, synonyms: ["source", "leadsource", "channel", "via", "medium"] },
  { key: "status", label: "Status", kind: "status", width: 160, synonyms: ["status", "stage", "leadstatus", "candidatestatus"] },
  { key: "next_follow_up", label: "Next Follow-up", kind: "date", width: 140, synonyms: ["followup", "nextfollowup", "followupdate", "nextfollowupdate", "callback", "reminder"] },
  { key: "notes", label: "Notes", kind: "long", width: 240, synonyms: ["notes", "note", "remarks", "remark", "comments", "comment", "feedback", "description"] },
  { key: "cv_url", label: "CV Link", kind: "url", width: 110, synonyms: ["cv", "cvlink", "resume", "resumelink", "cvurl", "resumeurl"] },
];

export const fieldByKey = (k: string) => FIELDS.find((f) => f.key === k);

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Best-guess field for a spreadsheet column header, or null to keep it as an extra column. */
/** Serial-number style columns (S.No, Sr. No, #) carry no candidate data. */
export const isSerialHeader = (header: string) => /^(s|sr|sl)?no$|^serial(no|number)?$|^#$|^sno$|^srno$|^slno$/.test(squash(header) || header.trim());

export const guessField = (header: string): FieldKey | null => {
  const h = squash(header);
  if (!h || isSerialHeader(header)) return null;
  const exact = FIELDS.find((f) => f.synonyms.includes(h));
  if (exact) return exact.key;
  const partial = FIELDS.find((f) => f.synonyms.some((s) => s.length > 3 && h.includes(s)));
  return partial?.key ?? null;
};

/** Digits-only key used to spot the same person across imports (last 10 digits for Indian numbers). */
export const phoneKey = (p?: string | null) => {
  const d = (p || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : d;
};

export const cleanPhone = (p: string) => {
  const t = p.trim();
  const d = t.replace(/\D/g, "");
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return t;
};

export const waLink = (p?: string | null) => {
  const d = (p || "").replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? "91" + d : d}`;
};

export const normalizeStatus = (v: string): string => {
  const s = squash(v);
  if (!s) return "New";
  const exact = STATUS_VALUES.find((x) => squash(x) === s);
  if (exact) return exact;
  if (/join|placed/.test(s)) return "Placed";
  if (/select|offer|interview|schedul|cvshar|shared|forward|process|shortlist/.test(s)) return "In Process";
  if (/notinterest|declin/.test(s)) return "Not Interested";
  if (/reject|unfit|notsuit/.test(s)) return "Not Suitable";
  if (/hold|later|pending/.test(s)) return "On Hold";
  if (/interest|keen/.test(s)) return "Interested";
  if (/contact|called|spoke|talk/.test(s)) return "Contacted";
  return "New";
};

export const normalizeSource = (v: string, fallback = "Other"): string => {
  const s = squash(v);
  if (!s) return fallback;
  if (/whatsapp|wa$/.test(s)) return "WhatsApp";
  if (/mail/.test(s)) return "Email";
  if (/call|phone/.test(s)) return "Phone Call";
  if (/website|site|web/.test(s)) return "Website";
  if (/naukri|indeed|portal|monster|shine|apna|linkedinjob|workindia/.test(s)) return "Job Portal";
  if (/refer/.test(s)) return "Referral";
  if (/walk/.test(s)) return "Walk-in";
  if (/facebook|instagram|linkedin|social|insta|fb/.test(s)) return "Social Media";
  return CRM_SOURCES.find((x) => squash(x) === s) ?? fallback;
};

export const normalizeDepartment = (v: string): string => {
  const s = squash(v);
  if (!s) return "";
  const hit = DEPARTMENT_NAMES.find((d) => squash(d) === s);
  if (hit) return hit;
  if (/frontoffice|reception|fo$|guestrelation|concierge|bell/.test(s)) return DEPARTMENT_NAMES.find((d) => /front/i.test(d)) ?? v;
  if (/housekeep|hk$|room/.test(s)) return DEPARTMENT_NAMES.find((d) => /housekeep/i.test(d)) ?? v;
  if (/laundry|linen/.test(s)) return DEPARTMENT_NAMES.find((d) => /laundry/i.test(d)) ?? v;
  if (/kitchen|chef|cook|commis|production|bakery|pastry/.test(s)) return DEPARTMENT_NAMES.find((d) => /production/i.test(d)) ?? v;
  if (/service|steward|waiter|captain|restaurant|bar|banquet/.test(s)) return DEPARTMENT_NAMES.find((d) => /service/i.test(d)) ?? v;
  if (/mainten|engineer|electric|plumb|technic|hvac/.test(s)) return DEPARTMENT_NAMES.find((d) => /mainten/i.test(d)) ?? v;
  return v.trim();
};

const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());

/** Accepts Date objects, Excel serials, ISO and dd/mm/yyyy strings. */
export const parseDateCell = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return toISODate(v);
  if (typeof v === "number" && v > 20000 && v < 80000) {
    return toISODate(new Date(Math.round((v - 25569) * 86400 * 1000)));
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(+m[2])}-${pad(+m[1])}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : toISODate(d);
};

export const cellText = (v: unknown): string => {
  if (v == null) return "";
  if (v instanceof Date) return toISODate(v);
  return String(v).trim();
};

export const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const followUpState = (c: Pick<Candidate, "next_follow_up" | "status">) => {
  if (!c.next_follow_up || !OPEN_STATUSES.includes(c.status)) return null;
  const t = todayISO();
  if (c.next_follow_up < t) return "overdue" as const;
  if (c.next_follow_up === t) return "today" as const;
  return "upcoming" as const;
};

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export const fetchAllCandidates = async (): Promise<Candidate[]> => {
  const out: Candidate[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("crm_candidates")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < page) break;
  }
  return out;
};

export const logActivity = async (candidateId: string, kind: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({ candidate_id: candidateId, kind, content, created_by: user?.id ?? null, created_by_email: user?.email ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ---------------------------------------------------------------------------
// Excel helpers (SheetJS is loaded only when needed to keep the site fast)
// ---------------------------------------------------------------------------

const loadXlsx = () => import("xlsx");

export const readSpreadsheet = async (file: File) => {
  const XLSX = await loadXlsx();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  return wb.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: "", blankrows: false });
    return { name, rows };
  });
};

const exportRow = (c: Candidate) => ({
  Name: c.full_name,
  Phone: c.phone ?? "",
  Email: c.email ?? "",
  City: c.city ?? "",
  "Role / Position": c.job_role ?? "",
  Department: c.department ?? "",
  Experience: c.experience ?? "",
  "Current Hotel / Employer": c.current_employer ?? "",
  "Current Salary": c.current_salary ?? "",
  "Expected Salary": c.expected_salary ?? "",
  "Notice Period": c.notice_period ?? "",
  Source: c.source,
  Status: c.status,
  "Next Follow-up": c.next_follow_up ?? "",
  "Interview At": c.interview_at ? formatDateTime(c.interview_at) : "",
  Notes: c.notes ?? "",
  "CV Link": c.cv_url ?? "",
  Tags: (c.tags || []).join(", "),
  "Added On": formatDate(c.created_at),
});

export const exportCandidates = async (rows: Candidate[], filename: string) => {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.json_to_sheet(rows.map(exportRow));
  ws["!cols"] = Object.keys(exportRow(rows[0] ?? ({} as Candidate))).map((k) => ({ wch: Math.max(12, k.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, filename);
};

export const downloadTemplate = async () => {
  const XLSX = await loadXlsx();
  const headers = FIELDS.filter((f) => f.key !== "cv_url").map((f) => f.label);
  const sample = [
    "Rahul Sharma", "9876543210", "rahul@example.com", "Gurugram", "Front Office Associate", "Front Office",
    "3 years", "Hotel ABC", "22000", "26000", "30 days", "WhatsApp", "New", todayISO(), "Fluent English",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, "Alba_candidate_import_template.xlsx");
};
