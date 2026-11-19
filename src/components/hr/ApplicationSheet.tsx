import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone, MessageCircle, Mail, FileText, Check, ChevronRight, Loader2, Upload, Eye, Plus, CalendarPlus, Send, Copy, XCircle, PartyPopper,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, todayISO, waLink } from "@/lib/crm";
import {
  DOC_STATUSES, DOC_TONE, DOC_TYPES, INTERVIEW_RESULTS, INTERVIEW_STATUSES, OFFER_STATUSES, PROCESS_STEPS, RESULT_TONE, STAGES, STAGE_VALUES,
  type Application, type CrmDocument, type Followup, type Interview,
  deleteRow, insertRow, logEvent, moveStage, openCv, openDocument, screeningScore, stageTone, updateRow, uploadDocument, useActivities, useCrm,
} from "@/lib/hr/model";
import { NativeSelect, Pill, ScoreInput, useAction, useHrUi } from "./ui";

const FLOW = STAGE_VALUES.filter((s) => !["Rejected", "Dropped"].includes(s));

const ApplicationSheet = ({ id, onClose }: { id: string | null; onClose: () => void }) => {
  const crm = useCrm();
  const run = useAction();
  const { toast } = useToast();
  const ui = useHrUi();
  const app = crm.applications.find((a) => a.id === id) ?? null;
  const candidate = app ? crm.candidate.get(app.candidate_id) : undefined;
  const job = app ? crm.job.get(app.job_id) : undefined;
  const client = job?.client_id ? crm.client.get(job.client_id) : undefined;
  const [tab, setTab] = useState("screening");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [offer, setOffer] = useState<Partial<Application>>({});
  const [note, setNote] = useState("");
  const activities = useActivities({ candidate_id: app?.candidate_id });

  useEffect(() => {
    if (!app) return;
    setNotes(app.screening_notes ?? "");
    setOffer({ offer_salary: app.offer_salary, offer_date: app.offer_date, offer_status: app.offer_status, joining_date: app.joining_date, joined_on: app.joined_on });
    setReason("");
    const step = STAGES.find((s) => s.value === app.stage)?.step ?? 3;
    setTab(app.stage === "Joined" ? "followups" : step >= 6 ? "offer" : step === 5 ? "documents" : step === 4 ? "interviews" : "screening");
  }, [app?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const interviews = useMemo(() => crm.interviews.filter((i) => i.application_id === id).sort((a, b) => (a.scheduled_at < b.scheduled_at ? 1 : -1)), [crm.interviews, id]);
  const docs = useMemo(() => crm.documents.filter((d) => d.candidate_id === app?.candidate_id), [crm.documents, app?.candidate_id]);
  const followups = useMemo(() => crm.followups.filter((f) => f.application_id === id), [crm.followups, id]);

  if (!app || !candidate || !job) {
    return <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}><SheetContent className="w-full sm:max-w-3xl"><Loader2 className="w-6 h-6 animate-spin text-primary m-6" /></SheetContent></Sheet>;
  }

  const ctx = { job, candidate, applications: crm.applications, documents: crm.documents };
  const currentStep = app.stage === "Joined" ? 7 : (STAGES.find((s) => s.value === app.stage)?.step ?? 0);
  const closed = app.stage === "Rejected" || app.stage === "Dropped";
  const flowIdx = FLOW.indexOf(app.stage);
  const next = flowIdx >= 0 && flowIdx < FLOW.length - 1 ? FLOW[flowIdx + 1] : null;

  const go = async (stage: string, extra: Partial<Application> = {}) => {
    setBusy(true);
    const r = await run(() => moveStage(app, stage, ctx, extra), { refresh: ["all"] });
    setBusy(false);
    if (r) toast({ title: `Moved to ${stage}`, description: r.notes.join(" · ") || undefined });
  };

  const patchApp = (patch: Partial<Application>, success?: string) => run(() => updateRow("crm_applications", app.id, patch), { success, refresh: ["crm_applications"] });

  const profileText = [
    `*Candidate profile: ${candidate.full_name}*`,
    `Position: ${job.title}${client ? ` (${client.name})` : ""}`,
    candidate.job_role && `Current role: ${candidate.job_role}`,
    candidate.current_employer && `Current employer: ${candidate.current_employer}`,
    candidate.experience && `Experience: ${candidate.experience}`,
    candidate.city && `Location: ${candidate.city}`,
    candidate.current_salary && `Current salary: ${candidate.current_salary}`,
    candidate.expected_salary && `Expected salary: ${candidate.expected_salary}`,
    candidate.notice_period && `Notice period: ${candidate.notice_period}`,
    screeningScore(app) != null && `Screening score: ${screeningScore(app)!.toFixed(1)}/5`,
    app.screening_notes && `Notes: ${app.screening_notes}`,
    `– Alba Enterprise`,
  ].filter(Boolean).join("\n");

  const sendToClient = async () => {
    if (client?.contact_phone) window.open(`${waLink(client.contact_phone)}?text=${encodeURIComponent(profileText)}`, "_blank", "noopener,noreferrer");
    else { await navigator.clipboard.writeText(profileText).catch(() => {}); toast({ title: "Profile copied", description: "Client has no phone saved, so paste it into WhatsApp or email." }); }
    if (app.stage !== "CV Sent to Client" && flowIdx < FLOW.indexOf("CV Sent to Client")) go("CV Sent to Client");
  };

  const joiningText = [
    `Dear ${candidate.full_name.split(" ")[0]},`,
    `Congratulations! Your joining details for ${job.title}${client ? ` at ${client.name}` : ""}:`,
    offer.joining_date && `Joining date: ${formatDate(offer.joining_date)}`,
    offer.offer_salary && `Salary: ${offer.offer_salary}`,
    client?.address && `Address: ${client.address}`,
    client?.contact_person && `Report to: ${client.contact_person}${client.contact_designation ? ` (${client.contact_designation})` : ""}`,
    `Please carry your original documents and ID. – Alba Enterprise`,
  ].filter(Boolean).join("\n");

  const addNote = async () => {
    if (!note.trim()) return;
    await run(() => logEvent({ candidate_id: app.candidate_id, job_id: app.job_id, application_id: app.id, kind: "note", content: note.trim() }), { refresh: ["crm_activities"] });
    setNote("");
    activities.refetch();
  };

  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-br from-primary/5 to-transparent text-left space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={stageTone(app.stage)}>{app.stage}</Pill>
            {screeningScore(app) != null && <span className="text-xs text-muted-foreground">Screening {screeningScore(app)!.toFixed(1)}/5</span>}
          </div>
          <SheetTitle className="text-2xl">
            <Link to={`/hr/candidates/${candidate.id}`} onClick={onClose} className="hover:text-primary">{candidate.full_name}</Link>
          </SheetTitle>
          <SheetDescription>
            for <Link to={`/hr/requirements/${job.id}`} onClick={onClose} className="font-medium text-foreground hover:text-primary">{job.title}</Link>
            {client && <> at <span className="font-medium text-foreground">{client.name}</span></>}
            {job.location && <> · {job.location}</>}
          </SheetDescription>
          <div className="flex flex-wrap gap-2 pt-1">
            {candidate.phone && <Button size="sm" variant="outline" asChild><a href={`tel:${candidate.phone.replace(/\s/g, "")}`}><Phone className="w-4 h-4 mr-1" />Call</a></Button>}
            {candidate.phone && <Button size="sm" variant="outline" asChild><a href={waLink(candidate.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</a></Button>}
            {candidate.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${candidate.email}`}><Mail className="w-4 h-4 mr-1" />Email</a></Button>}
            {candidate.cv_url && <Button size="sm" variant="outline" onClick={() => openCv(candidate.cv_url!)}><FileText className="w-4 h-4 mr-1" />CV</Button>}
          </div>
        </SheetHeader>

        {/* 7-step progress */}
        <div className="px-6 py-4 border-b">
          <ol className="grid grid-cols-7 gap-1">
            {PROCESS_STEPS.map((s) => {
              const done = !closed && s.n < currentStep;
              const active = !closed && s.n === currentStep;
              return (
                <li key={s.n} className="flex flex-col items-center text-center gap-1">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? "bg-primary border-primary text-primary-foreground" : active ? "border-primary text-primary bg-primary/10" : "border-muted text-muted-foreground"}`}>
                    {done ? <Check className="w-4 h-4" /> : s.n}
                  </span>
                  <span className={`text-[10px] leading-tight ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>{s.short}</span>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {closed ? (
              <>
                <span className="text-sm text-muted-foreground">Closed: {app.rejection_reason || app.stage}</span>
                <Button size="sm" variant="outline" onClick={() => go("Screening", { rejection_reason: null })} disabled={busy}>Reopen</Button>
              </>
            ) : (
              <>
                {next && (
                  <Button size="sm" onClick={() => go(next)} disabled={busy}>
                    {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : next === "Joined" ? <PartyPopper className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    Move to {next}
                  </Button>
                )}
                <div className="w-48"><NativeSelect value={app.stage} onChange={(v) => v !== app.stage && go(v)} options={FLOW} className="h-9" /></div>
                <div className="flex items-center gap-1 ml-auto">
                  <Input className="h-9 w-48" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Button size="sm" variant="ghost" className="text-rose-700" onClick={() => go("Rejected", { rejection_reason: reason || "Rejected" })} disabled={busy}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                  <Button size="sm" variant="ghost" onClick={() => go("Dropped", { rejection_reason: reason || "Candidate dropped out" })} disabled={busy}>Drop</Button>
                </div>
              </>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="p-6">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="screening">3 · Screening</TabsTrigger>
            <TabsTrigger value="interviews">4 · Interviews ({interviews.length})</TabsTrigger>
            <TabsTrigger value="documents">5 · Documents ({docs.filter((d) => d.status === "Verified").length}/{docs.length})</TabsTrigger>
            <TabsTrigger value="offer">6 · Offer & Joining</TabsTrigger>
            <TabsTrigger value="followups">7 · Follow-ups</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Step 3 */}
          <TabsContent value="screening" className="space-y-5 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {([["score_skill", "Skills"], ["score_experience", "Experience"], ["score_communication", "Communication"], ["score_grooming", "Grooming"]] as const).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <span className="text-sm font-medium">{label}</span>
                  <ScoreInput value={app[k]} onChange={(v) => patchApp({ [k]: v })} />
                </div>
              ))}
            </div>
            <div>
              <Label>Screening notes</Label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (app.screening_notes ?? "") && patchApp({ screening_notes: notes || null }, "Notes saved")} placeholder="Communication, grooming, salary expectations, availability..." />
            </div>
            <div className="flex flex-wrap gap-2">
              {flowIdx < FLOW.indexOf("Shortlisted") && <Button variant="outline" onClick={() => go("Shortlisted")} disabled={busy}><Check className="w-4 h-4 mr-1" />Shortlist</Button>}
              <Button onClick={sendToClient}><Send className="w-4 h-4 mr-1" />Send profile to client{client?.contact_phone ? " on WhatsApp" : ""}</Button>
              <Button variant="ghost" onClick={async () => { await navigator.clipboard.writeText(profileText); toast({ title: "Profile summary copied" }); }}><Copy className="w-4 h-4 mr-1" />Copy summary</Button>
            </div>
            {app.cv_sent_at && <p className="text-xs text-muted-foreground">Profile sent to client on {formatDateTime(app.cv_sent_at)}</p>}
          </TabsContent>

          {/* Step 4 */}
          <TabsContent value="interviews" className="space-y-4 pt-4">
            <Button onClick={() => ui.openSchedule(app.id)}><CalendarPlus className="w-4 h-4 mr-1" />Schedule interview / trial</Button>
            {interviews.length === 0 && <p className="text-sm text-muted-foreground">No interviews yet.</p>}
            {interviews.map((iv) => <InterviewRow key={iv.id} iv={iv} onPassed={() => next && FLOW.indexOf(app.stage) <= FLOW.indexOf("Interview / Trial") && go("Documents")} />)}
          </TabsContent>

          {/* Step 5 */}
          <TabsContent value="documents" className="pt-4">
            <DocumentsPanel candidateId={candidate.id} docs={docs} />
          </TabsContent>

          {/* Step 6 */}
          <TabsContent value="offer" className="space-y-5 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Offered salary</Label><Input value={offer.offer_salary ?? ""} onChange={(e) => setOffer({ ...offer, offer_salary: e.target.value })} placeholder="e.g. ₹24,000/month + food & stay" /></div>
              <div><Label>Offer status</Label><NativeSelect value={offer.offer_status} onChange={(v) => setOffer({ ...offer, offer_status: v || null })} options={OFFER_STATUSES} placeholder="Not set" /></div>
              <div><Label>Offer date</Label><Input type="date" value={offer.offer_date ?? ""} onChange={(e) => setOffer({ ...offer, offer_date: e.target.value || null })} /></div>
              <div><Label>Expected joining date</Label><Input type="date" value={offer.joining_date ?? ""} onChange={(e) => setOffer({ ...offer, joining_date: e.target.value || null })} /></div>
              <div><Label>Actually joined on</Label><Input type="date" value={offer.joined_on ?? ""} onChange={(e) => setOffer({ ...offer, joined_on: e.target.value || null })} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => patchApp({ ...offer, offer_salary: offer.offer_salary || null }, "Offer details saved")}>Save offer details</Button>
              {app.stage !== "Offer" && app.stage !== "Joined" && <Button variant="outline" onClick={() => go("Offer", { ...offer, offer_status: offer.offer_status || "Sent", offer_date: offer.offer_date || todayISO() })} disabled={busy}>Move to Offer</Button>}
              {app.stage !== "Joined" && <Button onClick={() => go("Joined", { ...offer, offer_status: "Accepted", joined_on: offer.joined_on || offer.joining_date || todayISO() })} disabled={busy}><PartyPopper className="w-4 h-4 mr-1" />Mark as Joined</Button>}
              {candidate.phone && offer.joining_date && (
                <Button variant="ghost" asChild><a href={`${waLink(candidate.phone)}?text=${encodeURIComponent(joiningText)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" />Send joining details</a></Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Marking as Joined schedules the Step 7 follow-ups automatically and marks the candidate as Placed.</p>
          </TabsContent>

          {/* Step 7 */}
          <TabsContent value="followups" className="space-y-3 pt-4">
            {followups.length === 0 && <p className="text-sm text-muted-foreground">Follow-ups are created automatically when the candidate joins. You can also add one manually.</p>}
            {followups.map((f) => <FollowupRow key={f.id} f={f} />)}
            <Button variant="outline" size="sm" onClick={() => run(() => insertRow("crm_followups", { application_id: app.id, title: "Check-in call", due_date: todayISO() }), { refresh: ["crm_followups"] })}>
              <Plus className="w-4 h-4 mr-1" />Add follow-up
            </Button>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a note: call summary, client feedback..." />
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
            </ol>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

/* ---------------------------------------------------------------- pieces */

const InterviewRow = ({ iv, onPassed }: { iv: Interview; onPassed: () => void }) => {
  const run = useAction();
  const [fb, setFb] = useState(iv.feedback ?? "");
  const upd = (patch: Partial<Interview>) => run(() => updateRow("crm_interviews", iv.id, patch), { refresh: ["crm_interviews"] });
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{iv.kind}</span>
        <span className="text-sm text-muted-foreground">· {iv.mode} · {formatDateTime(iv.scheduled_at)}</span>
        <Pill tone={RESULT_TONE[iv.result] ?? ""} className="ml-auto">{iv.result}</Pill>
      </div>
      {(iv.location || iv.interviewer) && <p className="text-sm text-muted-foreground">{[iv.interviewer && `With ${iv.interviewer}`, iv.location].filter(Boolean).join(" · ")}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <NativeSelect value={iv.status} onChange={(v) => upd({ status: v })} options={INTERVIEW_STATUSES} className="h-9" />
        <NativeSelect value={iv.result} onChange={async (v) => { await upd({ result: v, status: v !== "Pending" ? "Completed" : iv.status }); if (v === "Passed") onPassed(); }} options={INTERVIEW_RESULTS} className="h-9" />
      </div>
      <Textarea rows={2} value={fb} onChange={(e) => setFb(e.target.value)} onBlur={() => fb !== (iv.feedback ?? "") && upd({ feedback: fb || null })} placeholder="Client feedback / trial result" />
      <button className="text-xs text-rose-700 hover:underline" onClick={() => confirm("Delete this interview?") && run(() => deleteRow("crm_interviews", iv.id), { refresh: ["crm_interviews"] })}>Delete</button>
    </div>
  );
};

export const DocumentsPanel = ({ candidateId, docs }: { candidateId: string; docs: CrmDocument[] }) => {
  const run = useAction();
  const [uploading, setUploading] = useState<string | null>(null);
  const [newType, setNewType] = useState("");
  const verified = docs.filter((d) => d.status === "Verified").length;

  const setStatus = async (d: CrmDocument, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await run(() => updateRow("crm_documents", d.id, { status, verified_at: status === "Verified" ? new Date().toISOString() : null, verified_by_email: status === "Verified" ? user?.email ?? null : null }), { refresh: ["crm_documents"] });
  };

  const upload = async (d: CrmDocument, file?: File) => {
    if (!file) return;
    setUploading(d.id);
    await run(() => uploadDocument(d, file), { success: "Document uploaded", refresh: ["crm_documents"] });
    setUploading(null);
  };

  const missingTypes = DOC_TYPES.filter((t) => !docs.some((d) => d.doc_type === t));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1"><span>{verified} of {docs.length} verified</span><span className="text-muted-foreground">Files are private to staff</span></div>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${docs.length ? (verified / docs.length) * 100 : 0}%` }} /></div>
      </div>
      {docs.length === 0 && <p className="text-sm text-muted-foreground">No checklist yet. It is created automatically at the Documents stage, or add items below.</p>}
      <div className="divide-y border rounded-lg">
        {docs.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-medium">{d.doc_type}</p>
              {d.verified_at && <p className="text-xs text-muted-foreground">Verified {formatDate(d.verified_at)}{d.verified_by_email ? ` by ${d.verified_by_email}` : ""}</p>}
            </div>
            <Pill tone={DOC_TONE[d.status] ?? ""}>{d.status}</Pill>
            <div className="w-32"><NativeSelect value={d.status} onChange={(v) => setStatus(d, v)} options={DOC_STATUSES} className="h-8" /></div>
            {d.file_path && <Button size="sm" variant="ghost" onClick={() => openDocument(d.file_path!)}><Eye className="w-4 h-4" /></Button>}
            <Button size="sm" variant="ghost" asChild>
              <label className="cursor-pointer" title="Upload file">
                {uploading === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => upload(d, e.target.files?.[0])} />
              </label>
            </Button>
            <button className="text-xs text-muted-foreground hover:text-rose-700" onClick={() => confirm(`Remove ${d.doc_type}?`) && run(() => deleteRow("crm_documents", d.id), { refresh: ["crm_documents"] })}>×</button>
          </div>
        ))}
      </div>
      {missingTypes.length > 0 && (
        <div className="flex gap-2">
          <NativeSelect value={newType} onChange={setNewType} options={missingTypes} placeholder="Add a document to the checklist..." />
          <Button variant="outline" disabled={!newType} onClick={async () => { await run(() => insertRow("crm_documents", { candidate_id: candidateId, doc_type: newType }), { refresh: ["crm_documents"] }); setNewType(""); }}><Plus className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
};

export const FollowupRow = ({ f, showContext }: { f: Followup; showContext?: React.ReactNode }) => {
  const run = useAction();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ candidate_feedback: f.candidate_feedback ?? "", client_feedback: f.client_feedback ?? "", satisfaction: f.satisfaction, notes: f.notes ?? "" });
  const overdue = f.status === "Pending" && f.due_date < todayISO();
  const save = (done: boolean) => run(() => updateRow("crm_followups", f.id, {
    candidate_feedback: d.candidate_feedback || null, client_feedback: d.client_feedback || null, satisfaction: d.satisfaction, notes: d.notes || null,
    ...(done ? { status: "Done", done_at: new Date().toISOString() } : {}),
  }), { success: done ? "Follow-up completed" : "Saved", refresh: ["crm_followups"] }).then(() => done && setOpen(false));

  return (
    <div className={`rounded-lg border ${overdue ? "border-rose-200 bg-rose-50/50" : ""}`}>
      <button className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(!open)}>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${f.status === "Done" ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/40"}`}>{f.status === "Done" && <Check className="w-3 h-3" />}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${f.status === "Done" ? "line-through text-muted-foreground" : ""}`}>{f.title}</p>
          {showContext}
        </div>
        {f.satisfaction && <ScoreInput value={f.satisfaction} size="w-3.5 h-3.5" />}
        <span className={`text-xs whitespace-nowrap ${overdue ? "text-rose-700 font-semibold" : "text-muted-foreground"}`}>{overdue ? "Overdue · " : ""}{formatDate(f.due_date)}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3 border-t pt-3">
          <div><Label className="text-xs">Candidate feedback</Label><Textarea rows={2} value={d.candidate_feedback} onChange={(e) => setD({ ...d, candidate_feedback: e.target.value })} /></div>
          <div><Label className="text-xs">Client feedback</Label><Textarea rows={2} value={d.client_feedback} onChange={(e) => setD({ ...d, client_feedback: e.target.value })} /></div>
          <div className="flex items-center gap-3"><Label className="text-xs">Client satisfaction</Label><ScoreInput value={d.satisfaction} onChange={(v) => setD({ ...d, satisfaction: v })} /></div>
          <div><Input value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Notes / action (e.g. replacement needed)" /></div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => save(false)}>Save</Button>
            {f.status !== "Done" && <Button size="sm" onClick={() => save(true)}><Check className="w-4 h-4 mr-1" />Mark done</Button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationSheet;
