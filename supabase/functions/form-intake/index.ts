// Receives Google Form responses (sent by an Apps Script on the response sheet)
// and adds them to the HR CRM as candidates.
// Deploy with: supabase functions deploy form-intake --no-verify-jwt
//
// Body: { token, form, sheet_id, sheet_name, rows: [{ row, data: { "<question>": "<answer>" } }] }
// - token must match crm_settings.form_intake_token
// - each person is imported once per spreadsheet tab (source_ref = gform:<sheet_id>:<sheet_name>:<row>,
//   plus phone/email), so the whole sheet can be re-sent safely
// - action "sources" lists the spreadsheets linked to open requirements; "status" records sync health
// - an existing candidate with the same phone/email is not duplicated; they are
//   just linked to the requirement and get an activity note
// - if a requirement's "Google Form name" matches the form title, the candidate is
//   added to that requirement's pipeline at the Sourced stage
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const FIELDS: [string, string[]][] = [
  ["full_name", ["name", "fullname", "candidatename", "yourname", "applicantname", "firstname"]],
  ["phone", ["phone", "phoneno", "phonenumber", "mobile", "mobileno", "mobilenumber", "contact", "contactno", "contactnumber", "whatsapp", "whatsappno", "whatsappnumber"]],
  ["email", ["email", "emailid", "emailaddress", "mail", "mailid"]],
  ["city", ["city", "location", "currentlocation", "currentcity", "place", "state", "address"]],
  ["job_role", ["role", "position", "designation", "jobrole", "jobtitle", "post", "appliedfor", "positionappliedfor", "currentdesignation"]],
  ["department", ["department", "dept", "category"]],
  ["experience", ["experience", "exp", "totalexperience", "yearsofexperience", "workexperience", "totalexp"]],
  ["current_employer", ["currentemployer", "employer", "company", "currentcompany", "hotel", "currenthotel", "lastemployer"]],
  ["current_salary", ["currentsalary", "salary", "currentctc", "ctc", "lastdrawnsalary"]],
  ["expected_salary", ["expectedsalary", "expectedctc", "ectc", "expected"]],
  ["notice_period", ["noticeperiod", "notice", "availability", "canjoin", "joiningtime"]],
  ["cv_url", ["cv", "resume", "uploadcv", "uploadresume", "uploadyourcv", "uploadyourresume", "cvlink", "resumelink"]],
];

const guess = (header: string): string | null => {
  const h = squash(header);
  if (!h) return null;
  for (const [k, syn] of FIELDS) if (syn.includes(h)) return k;
  for (const [k, syn] of FIELDS) if (syn.some((s) => s.length > 3 && h.includes(s))) return k;
  return null;
};

const phoneKey = (p?: string | null) => {
  const d = (p || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : d;
};
const cleanPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return p.trim();
};

// How well a form answer like "Commis 1" matches a requirement title like "Commie 1 - continental".
const STOP = new Set(["the", "and", "for", "of", "in", "at", "a", "an", "job", "post", "position", "vacancy"]);
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
  .filter((w) => w && !STOP.has(w)).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
  .map((w) => (w === "commi" || w === "commie" ? "commis" : w));
export const positionScore = (answer: string, title: string) => {
  const strip = (s: string) => s.replace(/\([^)]*\)/g, " ");
  const a = squash(strip(answer)) || squash(answer), t = squash(strip(title)) || squash(title);
  if (!a || !t) return 0;
  if (a === t || squash(answer) === squash(title)) return 100;
  const ta = new Set(tokens(strip(answer))), tt = tokens(strip(title));
  const overlap = tt.filter((w) => ta.has(w)).length;
  const contains = t.includes(a) || a.includes(t);
  if (!overlap && !contains) return 0;
  // Extra words in the title count slightly against it, so "Restaurant Manager" picks
  // "Restaurant Manager (RM)" over "Assistant Restaurant Manager (ARM)".
  return Math.max(1, overlap * 10 + (contains ? 5 : 0) - (tt.length - overlap) * 2);
};

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json();
    const { token, form, sheet_id, sheet_name, sheet_gid } = body ?? {};
    const rows: { row: number; data: Record<string, unknown> }[] = Array.isArray(body?.rows) ? body.rows : [];
    const action = typeof body?.action === "string" ? body.action : "rows";
    if (typeof token !== "string" || (action === "rows" && !rows.length)) return json({ error: "token and rows are required" }, 400);
    if (rows.length > 500) return json({ error: "Send at most 500 rows per request" }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const { data: setting } = await db.from("crm_settings").select("value").eq("key", "form_intake_token").maybeSingle();
    if (!setting?.value || !safeEqual(token, setting.value)) return json({ error: "Invalid token" }, 401);

    const setStatus = async (id: string, patch: Record<string, unknown>) => {
      if (!id) return;
      const key = `sheet_status:${id}`.slice(0, 200);
      const { data: prev } = await db.from("crm_settings").select("value").eq("key", key).maybeSingle();
      let old: Record<string, unknown> = {};
      try { old = prev?.value ? JSON.parse(prev.value) : {}; } catch { old = {}; }
      await db.from("crm_settings").upsert({ key, value: JSON.stringify({ ...old, ...patch }), updated_at: new Date().toISOString() });
    };

    // The master Apps Script asks which spreadsheets are linked to requirements.
    if (action === "sources") {
      const { data } = await db.from("crm_jobs").select("intake_key, status").not("intake_key", "is", null);
      const seen = new Set<string>();
      const sources: { sheet_id: string; gid: string | null }[] = [];
      const add = (id: string, gid: string | null) => {
        const k = id + "|" + (gid ?? "");
        if (!seen.has(k)) { seen.add(k); sources.push({ sheet_id: id, gid }); }
      };
      const byTitle = new Set<string>();
      for (const j of data || []) {
        if (j.status === "Closed" || j.status === "Filled") continue;
        const id = String(j.intake_key).match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        if (id) add(id, String(j.intake_key).match(/[#&?]gid=(\d+)/)?.[1] ?? null);
        else if (squash(String(j.intake_key))) byTitle.add(squash(String(j.intake_key)));
      }
      // Requirements linked by form name: find that form's spreadsheet from responses already received.
      if (byTitle.size) {
        const { data: got } = await db.from("crm_candidates").select("extra").eq("source", "Google Form").limit(20000);
        for (const c of got || []) {
          const e = (c.extra || {}) as Record<string, unknown>;
          if (e._sheet_id && byTitle.has(squash(String(e["Google Form"] ?? "")))) add(String(e._sheet_id), e._sheet_gid ? String(e._sheet_gid) : null);
        }
      }
      return json({ success: true, sources });
    }
    // The script reports whether it could open a spreadsheet.
    if (action === "status") {
      const id = String(sheet_id ?? "");
      await setStatus(id, body.error ? { checked_at: new Date().toISOString(), error: String(body.error).slice(0, 300) } : { checked_at: new Date().toISOString(), error: null, rows: body.rows ?? null });
      return json({ success: true });
    }

    const formTitle = String(form || sheet_name || "Google Form").slice(0, 200);
    const { data: jobs } = await db.from("crm_jobs").select("id, title, intake_key, status").not("intake_key", "is", null);
    // A requirement is linked either by the response spreadsheet link (optionally a specific tab via #gid=)
    // or by the form title.
    const byLink = (key: string) => {
      const id = key.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (!id || id !== sheet_id) return null;
      const gid = key.match(/[#&?]gid=(\d+)/)?.[1];
      return !gid || sheet_gid == null || String(sheet_gid) === gid ? (gid ? 2 : 1) : null;
    };
    const ranked = (jobs || [])
      .map((j) => {
        const key = j.intake_key || "";
        const link = byLink(key);
        const score = link ? link + 10 : squash(key) && squash(key) === squash(formTitle) ? 5 : squash(key) && squash(formTitle).includes(squash(key)) ? 1 : 0;
        return { j, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    // All requirements linked to this form. One form can serve several positions: then each
    // applicant goes to the requirement matching the position they chose in the form.
    // Linking by spreadsheet link and by exact form name are equally valid: one vacancy may be linked one
    // way and its sister vacancy the other, and they must still share the form. Loose name matches (score 1)
    // only count when nothing links properly.
    const strong = ranked.filter((x) => x.score >= 5);
    const linkedJobs = (strong.length ? strong : ranked).map((x) => x.j);
    const pickJob = (answer: string) => {
      if (linkedJobs.length <= 1) return linkedJobs[0] ?? null;
      const best = linkedJobs.map((j) => ({ j, s: positionScore(answer, j.title) })).sort((a, b) => b.s - a.s)[0];
      return best && best.s > 0 ? best.j : null;
    };

    // Existing candidates for duplicate detection.
    // The script re-sends the whole sheet every few minutes, so rows can shift when someone deletes
    // a row. A person is therefore imported once per spreadsheet tab: anyone already received from
    // this tab (by row, phone or email) is skipped, and HR's removals in the CRM stay removed.
    const tabKey = `${sheet_id ?? "?"}:${sheet_name ?? "?"}`;
    const { data: existing } = await db.from("crm_candidates").select("id, full_name, phone, email, source_ref, extra").limit(20000);
    const byPhone = new Map<string, string>();
    const byEmail = new Map<string, string>();
    const refs = new Set<string>();
    const fromTab = new Set<string>();
    const tabsOf = new Map<string, string[]>();
    const tabNames = new Map<string, boolean>(); // name -> has a usable phone/email
    (existing || []).forEach((c) => {
      const k = phoneKey(c.phone);
      if (k.length >= 10) byPhone.set(k, c.id);
      const em = String(c.email ?? "").toLowerCase();
      if (em.includes("@")) byEmail.set(em, c.id);
      if (c.source_ref) refs.add(c.source_ref);
      const seenTabs = Array.isArray((c.extra as Record<string, unknown> | null)?._tabs) ? ((c.extra as Record<string, unknown>)._tabs as string[]) : [];
      tabsOf.set(c.id, seenTabs);
      if (String(c.source_ref ?? "").startsWith(`gform:${tabKey}:`) || seenTabs.includes(tabKey)) {
        fromTab.add(c.id);
        tabNames.set(squash(String(c.full_name ?? "")), k.length >= 10 || em.includes("@"));
      }
    });

    let added = 0, matched = 0, skipped = 0, linked = 0, unrouted = 0;
    for (const { row, data } of rows) {
      // Rows move when people sort, insert or delete rows, so the row number alone never decides who is new.
      const baseRef = `gform:${tabKey}:${row}`.slice(0, 280);
      const rec: Record<string, unknown> = { source: "Google Form", status: "New" };
      const extra: Record<string, string> = { "Google Form": formTitle, _sheet_id: String(sheet_id ?? ""), _sheet_gid: String(sheet_gid ?? "") };
      const notes: string[] = [];
      for (const [header, raw] of Object.entries(data || {})) {
        const value = raw == null ? "" : String(raw).trim();
        if (!value) continue;
        if (/^timestamp$/i.test(header.trim())) { extra["Submitted at"] = value; continue; }
        const key = guess(header);
        if (key && rec[key] == null) {
          if (key === "phone") rec.phone = cleanPhone(value);
          else if (key === "cv_url") { if (/^https?:\/\//i.test(value)) rec.cv_url = value.split(",")[0].trim(); else extra[header] = value; }
          else rec[key] = value.slice(0, 2000);
        } else {
          extra[header.slice(0, 120)] = value.slice(0, 2000);
          if (/remark|comment|message|anything|note/i.test(header)) notes.push(value);
        }
      }
      if (!rec.full_name) {
        const fallback = (rec.phone as string) || (rec.email as string);
        if (!fallback) { skipped++; continue; }
        rec.full_name = `Unknown (${fallback})`;
      }
      if (notes.length) rec.notes = notes.join("\n");
      rec.extra = extra;

      const pk = phoneKey(rec.phone as string);
      const ek = ((rec.email as string) || "").toLowerCase().includes("@") ? String(rec.email).toLowerCase() : "";
      let candidateId = (pk.length >= 10 && byPhone.get(pk)) || (ek && byEmail.get(ek)) || null;

      if (candidateId && fromTab.has(candidateId)) { skipped++; continue; }
      const hasContact = pk.length >= 10 || !!ek;
      if (!candidateId) {
        // Same name already received from this tab, and one of the two rows has no usable phone/email: same person.
        const nk = squash(String(rec.full_name));
        if (tabNames.has(nk) && (!hasContact || !tabNames.get(nk))) { skipped++; continue; }
        if (!hasContact && refs.has(baseRef)) { skipped++; continue; }
      }
      const ref = refs.has(baseRef) ? `${baseRef}:${pk || ek || squash(String(rec.full_name))}`.slice(0, 300) : baseRef;
      rec.source_ref = ref;
      if (candidateId) {
        matched++;
        fromTab.add(candidateId);
        const { data: cur } = await db.from("crm_candidates").select("extra").eq("id", candidateId).single();
        const curExtra = (cur?.extra || {}) as Record<string, unknown>;
        await db.from("crm_candidates").update({ extra: { ...curExtra, _tabs: [...(tabsOf.get(candidateId) || []), tabKey] } }).eq("id", candidateId);
        await db.from("crm_activities").insert({ candidate_id: candidateId, kind: "note", content: `Applied again via Google Form "${formTitle}"`, created_by_email: "Google Form" });
      } else {
        const { data: ins, error } = await db.from("crm_candidates").insert(rec).select("id").single();
        if (error) { if (error.code === "23505") { skipped++; continue; } throw error; }
        candidateId = ins.id;
        added++;
        fromTab.add(candidateId!);
        tabNames.set(squash(String(rec.full_name)), hasContact);
        if (pk.length >= 10) byPhone.set(pk, candidateId!);
        if (ek) byEmail.set(ek, candidateId!);
        await db.from("crm_activities").insert({ candidate_id: candidateId, kind: "note", content: `Applied via Google Form "${formTitle}"`, created_by_email: "Google Form" });
      }
      refs.add(ref);

      const positionAnswer = String(rec.job_role ?? "") || Object.entries(extra).find(([h]) => /position|post|vacanc|role|apply|applying/i.test(h))?.[1] || "";
      const job = pickJob(positionAnswer);
      if (!job && linkedJobs.length > 1) unrouted++;
      if (job && candidateId) {
        const { data: app } = await db.from("crm_applications")
          .upsert({ job_id: job.id, candidate_id: candidateId, stage: "Sourced" }, { onConflict: "job_id,candidate_id", ignoreDuplicates: true })
          .select("id");
        if (app?.length) {
          linked++;
          await db.from("crm_candidates").update({ status: "In Process" }).eq("id", candidateId).in("status", ["New", "Contacted", "Interested"]);
        }
      }
    }

    await setStatus(String(sheet_id ?? ""), { last_received: new Date().toISOString(), error: null });
    return json({ success: true, form: formTitle, requirements: linkedJobs.map((j) => j.title), added, matched_existing: matched, skipped, added_to_requirement: linked, position_not_matched: unrouted });
  } catch (err) {
    console.error("form-intake error:", err);
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
