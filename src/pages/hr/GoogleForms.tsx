import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, FileSpreadsheet, RefreshCw, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/crm";
import { useCrm } from "@/lib/hr/model";
import { Card, PageHeader, Pill, StatCard } from "@/components/hr/ui";
import { FormsTable } from "@/components/hr/FormLink";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/form-intake`;

const buildScript = (token: string) => `// Alba Recruit: ONE script that syncs every Google Form spreadsheet linked in the CRM.
// Install once at script.google.com (New project), paste this, save, then run "setup".
// After that, just paste a spreadsheet link into a requirement in the CRM: nothing to install per sheet.
const ENDPOINT = "${ENDPOINT}";
const TOKEN = "${token}";

// Run once: checks every 5 minutes and imports everything already in the linked sheets.
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(t => ["syncAll", "onFormResponse", "syncNewRows"].indexOf(t.getHandlerFunction()) >= 0)
    .forEach(t => ScriptApp.deleteTrigger(t));
  PropertiesService.getScriptProperties().deleteAllProperties();
  ScriptApp.newTrigger("syncAll").timeBased().everyMinutes(5).create();
  syncAll();
}

// Every 5 minutes: asks the CRM which spreadsheets are linked and sends their new rows.
function syncAll() {
  const props = PropertiesService.getScriptProperties();
  const sources = (call_({ action: "sources" }).sources || []);
  sources.forEach(src => {
    let ss;
    try { ss = SpreadsheetApp.openById(src.sheet_id); }
    catch (err) {
      call_({ action: "status", sheet_id: src.sheet_id, error: "This Google account cannot open the spreadsheet. Share it with the account that installed the script." });
      return;
    }
    ensureInstantSync_(ss, props);
    let total = 0;
    tabs_(ss, src.gid).forEach(sheet => {
      const key = "last_" + src.sheet_id + "_" + sheet.getSheetId();
      const last = Number(props.getProperty(key) || 1);
      const all = sheet.getDataRange().getDisplayValues();
      total += Math.max(0, all.length - 1);
      if (all.length <= last) return;
      const rows = [];
      for (let r = last; r < all.length; r++) if (all[r].some(v => v !== "")) rows.push({ row: r + 1, values: all[r] });
      for (let i = 0; i < rows.length; i += 200) send_(ss, sheet, all[0], rows.slice(i, i + 200));
      props.setProperty(key, String(all.length));
    });
    call_({ action: "status", sheet_id: src.sheet_id, rows: total });
  });
}

// Instant sync when someone submits a form linked to one of these spreadsheets.
function onFormResponse(e) {
  const sheet = e.range.getSheet();
  const all = sheet.getDataRange().getDisplayValues();
  send_(sheet.getParent(), sheet, all[0], [{ row: e.range.getRow(), values: all[e.range.getRow() - 1] }]);
}

function ensureInstantSync_(ss, props) {
  const key = "trigger_" + ss.getId();
  if (props.getProperty(key)) return;
  try { ScriptApp.newTrigger("onFormResponse").forSpreadsheet(ss).onFormSubmit().create(); props.setProperty(key, "1"); } catch (err) {}
}

function tabs_(ss, gid) {
  const sheets = ss.getSheets();
  if (gid) { const t = sheets.filter(s => String(s.getSheetId()) === String(gid)); if (t.length) return t; }
  const formSheets = sheets.filter(s => s.getFormUrl());
  return formSheets.length ? formSheets : [sheets[0]];
}

function send_(ss, sheet, headers, rows) {
  let form = sheet.getName();
  try { const url = sheet.getFormUrl(); if (url) form = FormApp.openByUrl(url).getTitle(); } catch (err) {}
  const res = call_({
    form, sheet_id: ss.getId(), sheet_name: sheet.getName(), sheet_gid: sheet.getSheetId(),
    rows: rows.map(r => { const data = {}; headers.forEach((h, i) => { if (h) data[h] = r.values[i]; }); return { row: r.row, data }; }),
  });
  console.log(form + ": " + JSON.stringify(res));
}

function call_(payload) {
  payload.token = TOKEN;
  const res = UrlFetchApp.fetch(ENDPOINT, { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true });
  try { return JSON.parse(res.getContentText()); } catch (err) { return {}; }
}
`;

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="flex gap-4">
    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">{n}</span>
    <div className="pt-1"><p className="font-semibold">{title}</p><div className="text-sm text-muted-foreground mt-1 space-y-1">{children}</div></div>
  </li>
);

const GoogleForms = () => {
  const crm = useCrm();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const token = useQuery({
    queryKey: ["crm", "crm_settings", "form_intake_token"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_settings").select("value").eq("key", "form_intake_token").maybeSingle();
      if (error) throw error;
      return data?.value ?? "";
    },
  });

  const formCandidates = crm.candidates.filter((c) => c.source === "Google Form");
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const linkedJobs = crm.jobs.filter((j) => j.intake_key);
  const script = token.data ? buildScript(token.data) : "";

  const copy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast({ title: "Script copied", description: "Paste it into Apps Script in your response spreadsheet." });
    setTimeout(() => setCopied(false), 2500);
  };

  const regenerate = async () => {
    if (!confirm("Create a new secret key? Every spreadsheet already connected will stop syncing until you paste the new script into it.")) return;
    setRegenerating(true);
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const value = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("crm_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "form_intake_token");
    setRegenerating(false);
    if (error) toast({ title: "Couldn't change key", description: error.message, variant: "destructive" });
    else { toast({ title: "New key created", description: "Copy the script again and paste it into each spreadsheet." }); token.refetch(); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Form leads"
        subtitle="Responses to your Google Forms (from ads and job posts) arrive in the CRM automatically: no downloading or importing."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FileSpreadsheet} label="Candidates from Google Forms" value={formCandidates.length} />
        <StatCard icon={FileSpreadsheet} label="Received this week" value={formCandidates.filter((c) => c.created_at >= weekAgo).length} tone="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Link2} label="Requirements linked to a form" value={linkedJobs.length} tone="bg-indigo-100 text-indigo-700" />
      </div>

      <FormsTable />

      <div className="grid xl:grid-cols-5 gap-6">
        <Card title="One-time setup (about 3 minutes, once for all forms)" className="xl:col-span-3">
          <ol className="space-y-5">
            <Step n={1} title="Open Google Apps Script (one time only)">
              <p>Go to <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener noreferrer" className="text-primary underline">script.google.com → New project</a>, signed in with the Google account that owns your form spreadsheets.</p>
            </Step>
            <Step n={2} title="Paste the script and save">
              <p>Delete the sample code, click <strong>Copy script</strong> on this page, paste it, and press <strong>Ctrl + S</strong>. Name the project "Alba Recruit sync".</p>
            </Step>
            <Step n={3} title='Run "setup" once'>
              <p>Choose <strong>setup</strong> in the function menu at the top and click <strong>Run</strong>. Allow the permissions: <strong>Review permissions → your account → Advanced → Go to project → Allow</strong>.</p>
            </Step>
            <Step n={4} title="Link each form to its requirement">
              <p>For every vacancy, open the requirement in the CRM and paste the link of its <strong>response spreadsheet</strong> in the <strong>Google Form</strong> box. (In the form: <strong>Responses → View in Sheets</strong>, then copy the browser address.)</p>
              <p>Applicants arrive within 5 minutes, instantly for new submissions. <strong>Nothing needs to be installed in the spreadsheets themselves.</strong></p>
            </Step>
          </ol>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <Card title="Your script" actions={
            <Button size="sm" onClick={copy} disabled={!script}>{copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}{copied ? "Copied" : "Copy script"}</Button>
          }>
            {token.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : token.error ? (
              <p className="text-sm text-rose-700">Couldn't load your secret key. Ask the administrator to run the Google Form setup in the database.</p>
            ) : (
              <>
                <pre className="text-[11px] leading-relaxed bg-slate-950 text-slate-100 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre">{script}</pre>
                <p className="text-xs text-muted-foreground mt-2">The script contains a private key. Paste it only into your own spreadsheets.</p>
                <Button variant="ghost" size="sm" className="mt-1 text-muted-foreground" onClick={regenerate} disabled={regenerating}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${regenerating ? "animate-spin" : ""}`} />Create a new key
                </Button>
              </>
            )}
          </Card>

          <Card title="Send responses straight into a requirement">
            <p className="text-sm text-muted-foreground mb-3">
              Open a requirement → <strong>Edit</strong> → type the Google Form's title in <strong>"Google Form name"</strong>. Everyone who answers that form is then added to that requirement's pipeline automatically.
            </p>
            {linkedJobs.length === 0 ? <p className="text-sm">No requirements linked yet.</p> : (
              <ul className="divide-y text-sm">
                {linkedJobs.map((j) => (
                  <li key={j.id} className="py-2 flex items-center gap-2">
                    <Link to={`/hr/requirements/${j.id}`} className="font-medium hover:text-primary flex-1 truncate">{j.title}</Link>
                    <Pill tone="bg-emerald-50 text-emerald-700 border-emerald-200">{j.intake_key}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Latest Google Form responses">
        {formCandidates.length === 0 ? <p className="text-sm text-muted-foreground">Nothing received yet. Responses appear here once a spreadsheet is connected.</p> : (
          <ul className="divide-y">
            {formCandidates.slice(0, 15).map((c) => (
              <li key={c.id}>
                <Link to={`/hr/candidates/${c.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:text-primary text-sm">
                  <span className="font-medium flex-1 min-w-[160px]">{c.full_name}</span>
                  <span className="text-muted-foreground">{[c.job_role, c.city, c.phone].filter(Boolean).join(" · ")}</span>
                  <span className="text-xs text-muted-foreground">{String((c.extra as Record<string, string>)?.["Google Form"] ?? "")}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default GoogleForms;
