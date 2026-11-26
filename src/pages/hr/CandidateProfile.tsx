import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Mail, FileText, Upload, Pencil, Briefcase, ListTodo, Trash2, Loader2, Send, CalendarClock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatDateTime, normalizeCvLink, statusTone, STATUS_VALUES, waLink } from "@/lib/crm";
import {
  RESULT_TONE, deleteRow, logEvent, openCv, screeningScore, stageTone, updateRow, uploadPrivateCv, useActivities, useCrm, type Candidate,
} from "@/lib/hr/model";
import { Card, NativeSelect, Pill, ScoreInput, useAction, useHrUi } from "@/components/hr/ui";
import { CandidateDialog } from "@/components/hr/dialogs";
import { DocumentsPanel } from "@/components/hr/ApplicationSheet";

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between gap-4 py-2 border-b last:border-0 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium text-right">{value || "—"}</span></div>
);

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const activities = useActivities({ candidate_id: id });
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const c = crm.candidate.get(id || "");

  if (!c) return crm.loading ? null : <p className="text-muted-foreground">Candidate not found. <Link to="/hr/candidates" className="text-primary">Back</Link></p>;

  const apps = crm.applications.filter((a) => a.candidate_id === c.id);
  const docs = crm.documents.filter((d) => d.candidate_id === c.id);
  const interviews = crm.interviews.filter((i) => apps.some((a) => a.id === i.application_id)).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const extra = Object.entries((c.extra as Record<string, string>) || {}).filter(([k]) => !k.startsWith("_"));

  const upd = (patch: Partial<Candidate>, success?: string) => run(() => updateRow("crm_candidates", c.id, patch), { success, refresh: ["crm_candidates"] });

  const uploadCv = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    await run(async () => {
      const ref = await uploadPrivateCv(c.id, file);
      await updateRow("crm_candidates", c.id, { cv_url: ref });
      await logEvent({ candidate_id: c.id, kind: "note", content: "CV uploaded" });
    }, { success: "CV uploaded", refresh: ["crm_candidates"] });
    setUploading(false);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await run(() => logEvent({ candidate_id: c.id, kind: "note", content: note.trim() }), { refresh: ["crm_activities"] });
    setNote("");
    activities.refetch();
  };

  const remove = async () => {
    if (!confirm(`Delete ${c.full_name}, including their pipeline history and documents? This cannot be undone.`)) return;
    const ok = await run(() => deleteRow("crm_candidates", c.id), { success: "Candidate deleted", refresh: ["all"] });
    if (ok !== undefined) navigate("/hr/candidates");
  };

  return (
    <div className="space-y-6">
      <Link to="/hr/candidates" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Candidates</Link>

      <div className="rounded-xl border bg-card p-6 flex flex-wrap gap-6 items-start">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase shrink-0">{c.full_name[0]}</div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl font-bold">{c.full_name}</h1>
          <p className="text-muted-foreground">{[c.job_role, c.current_employer, c.city].filter(Boolean).join(" · ") || "No role details yet"}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="w-40"><NativeSelect value={c.status} onChange={(v) => upd({ status: v }, `Status: ${v}`)} options={STATUS_VALUES} className={`h-8 text-xs font-medium ${statusTone(c.status)}`} /></div>
            <Pill tone="bg-muted text-muted-foreground border-border">Source: {c.source}</Pill>
            {(c.tags || []).map((t) => <Pill key={t} tone="bg-primary/5 text-primary border-primary/20">{t}</Pill>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && <Button variant="outline" asChild><a href={`tel:${c.phone.replace(/\s/g, "")}`}><Phone className="w-4 h-4 mr-1" />Call</a></Button>}
          {c.phone && <Button variant="outline" asChild><a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</a></Button>}
          {c.email && <Button variant="outline" asChild><a href={`mailto:${c.email}`}><Mail className="w-4 h-4 mr-1" />Email</a></Button>}
          {c.cv_url && <Button variant="outline" onClick={() => openCv(c.cv_url!)}><FileText className="w-4 h-4 mr-1" />View CV</Button>}
          <Button variant="outline" asChild>
            <label className="cursor-pointer">{uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}{c.cv_url ? "Replace CV" : "Upload CV"}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => uploadCv(e.target.files?.[0])} />
            </label>
          </Button>
          <Button variant="outline" onClick={() => {
            const v = prompt("Paste the CV link (Google Drive or any link):", c.cv_url && !c.cv_url.startsWith("crm-docs:") ? c.cv_url : "");
            if (v === null) return;
            const url = normalizeCvLink(v);
            if (v.trim() && !url) { alert("That doesn't look like a link. Please paste the full Drive link."); return; }
            upd({ cv_url: url }, url ? "CV link saved" : "CV link removed");
          }}><Link2 className="w-4 h-4 mr-1" />{c.cv_url ? "Change CV link" : "Add CV link"}</Button>
          <Button onClick={() => ui.openAddToJob({ candidateIds: [c.id] })}><Briefcase className="w-4 h-4 mr-1" />Add to requirement</Button>
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Edit"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => ui.openNewTask({ candidate_id: c.id })} title="Add task"><ListTodo className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-rose-700" onClick={remove} title="Delete"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Requirements (${apps.length})`} icon={Briefcase}>
            {apps.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">Not on any requirement yet. <button className="text-primary" onClick={() => ui.openAddToJob({ candidateIds: [c.id] })}>Add to one</button></div>
            ) : (
              <ul className="divide-y">
                {apps.map((a) => {
                  const j = crm.job.get(a.job_id);
                  const score = screeningScore(a);
                  return (
                    <li key={a.id}>
                      <button onClick={() => ui.openApplication(a.id)} className="w-full flex flex-wrap items-center gap-3 py-3 text-left hover:bg-muted/40 rounded px-2 -mx-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{j?.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{[j?.client_id ? crm.client.get(j.client_id)?.name : null, j?.location].filter(Boolean).join(" · ")}</p>
                        </div>
                        {score != null && <ScoreInput value={Math.round(score)} size="w-3.5 h-3.5" />}
                        <Pill tone={stageTone(a.stage)}>{a.stage}</Pill>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {interviews.length > 0 && (
            <Card title="Interviews & trials" icon={CalendarClock}>
              <ul className="divide-y">
                {interviews.map((i) => (
                  <li key={i.id} className="py-2.5 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium">{i.kind}</span>
                    <span className="text-muted-foreground">{crm.job.get(crm.application.get(i.application_id)?.job_id || "")?.title}</span>
                    <span className="text-muted-foreground ml-auto">{formatDateTime(i.scheduled_at)}</span>
                    <Pill tone={RESULT_TONE[i.result] ?? ""}>{i.result}</Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Documents (Step 5)">
            <DocumentsPanel candidateId={c.id} docs={docs} />
          </Card>

          <Card title="Activity & notes">
            <div className="flex gap-2 mb-4">
              <Input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Log a call, WhatsApp chat or note..." />
              <Button onClick={addNote} disabled={!note.trim()}><Send className="w-4 h-4" /></Button>
            </div>
            <ol className="relative border-l pl-5 space-y-3">
              {(activities.data || []).map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}{a.created_by_email ? ` · ${a.created_by_email}` : ""}</p>
                  <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                </li>
              ))}
              {!activities.data?.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details" actions={<Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>}>
            <Row label="Phone" value={c.phone} />
            <Row label="Email" value={c.email} />
            <Row label="City" value={c.city} />
            <Row label="Department" value={c.department} />
            <Row label="Experience" value={c.experience} />
            <Row label="Current employer" value={c.current_employer} />
            <Row label="Current salary" value={c.current_salary} />
            <Row label="Expected salary" value={c.expected_salary} />
            <Row label="Notice period" value={c.notice_period} />
            <Row label="Next follow-up" value={c.next_follow_up ? formatDate(c.next_follow_up) : null} />
            <Row label="Added" value={formatDate(c.created_at)} />
          </Card>
          {c.notes && <Card title="Notes"><p className="text-sm whitespace-pre-wrap">{c.notes}</p></Card>}
          {extra.length > 0 && (
            <Card title="Imported info">
              {extra.map(([k, v]) => <Row key={k} label={k} value={String(v)} />)}
            </Card>
          )}
        </div>
      </div>

      <CandidateDialog open={editOpen} onOpenChange={setEditOpen} initial={c} />
    </div>
  );
};

export default CandidateProfile;
