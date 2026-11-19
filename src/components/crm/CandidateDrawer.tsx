import { useEffect, useState } from "react";
import { Phone, Mail, MessageCircle, FileText, Upload, Loader2, Trash2, Send, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadCv, validateCvFile } from "@/lib/enquiries";
import {
  ACTIVITY_KINDS, CRM_SOURCES, DEPARTMENT_NAMES, STATUS_VALUES, type Activity, type Candidate,
  formatDateTime, logActivity, statusTone, waLink,
} from "@/lib/crm";

interface Props {
  candidate: Candidate | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Candidate>) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const TEXT_FIELDS: { key: keyof Candidate; label: string; type?: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", type: "email" },
  { key: "city", label: "City / Location" },
  { key: "job_role", label: "Role / Position" },
  { key: "experience", label: "Experience" },
  { key: "current_employer", label: "Current hotel / employer" },
  { key: "current_salary", label: "Current salary" },
  { key: "expected_salary", label: "Expected salary" },
  { key: "notice_period", label: "Notice period" },
];

const kindLabel = (k: string) => ACTIVITY_KINDS.find((a) => a.value === k)?.label ?? k;

const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

const CandidateDrawer = ({ candidate, onClose, onSave, onDelete }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Candidate>>({});
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [noteKind, setNoteKind] = useState("note");
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!candidate) return;
    setForm(candidate);
    setTagsText((candidate.tags || []).join(", "));
    setNote("");
    setLoadingAct(true);
    supabase
      .from("crm_activities")
      .select("*")
      .eq("candidate_id", candidate.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setActivities(data || []); setLoadingAct(false); });
  }, [candidate?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!candidate) return null;

  const set = (k: keyof Candidate, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.full_name?.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const patch: Partial<Candidate> = {};
    (Object.keys(form) as (keyof Candidate)[]).forEach((k) => {
      if (["id", "created_at", "updated_at", "created_by", "extra", "source_ref"].includes(k)) return;
      const v = typeof form[k] === "string" ? ((form[k] as string).trim() || null) : form[k];
      if (v !== candidate[k]) (patch as any)[k] = v;
    });
    if (tags.join(",") !== (candidate.tags || []).join(",")) patch.tags = tags;
    if (patch.full_name === null) delete patch.full_name;
    if (!Object.keys(patch).length) { setSaving(false); toast({ title: "No changes to save" }); return; }
    const ok = await onSave(candidate.id, patch);
    setSaving(false);
    if (ok) {
      toast({ title: "Candidate updated" });
      if (patch.status) refreshActivities();
    }
  };

  const refreshActivities = async () => {
    const { data } = await supabase.from("crm_activities").select("*").eq("candidate_id", candidate.id).order("created_at", { ascending: false });
    setActivities(data || []);
  };

  const postNote = async () => {
    if (!note.trim()) return;
    setPosting(true);
    try {
      const a = await logActivity(candidate.id, noteKind, note.trim());
      setActivities((prev) => [a, ...prev]);
      setNote("");
    } catch (e: any) {
      toast({ title: "Couldn't add note", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const onCv = async (file?: File) => {
    if (!file) return;
    const err = validateCvFile(file);
    if (err) { toast({ title: "Invalid file", description: err, variant: "destructive" }); return; }
    setUploading(true);
    try {
      const url = await uploadCv(file, candidate.full_name);
      const ok = await onSave(candidate.id, { cv_url: url });
      if (ok) { set("cv_url", url); toast({ title: "CV uploaded" }); }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const extra = Object.entries((candidate.extra as Record<string, string>) || {});

  return (
    <Sheet open={!!candidate} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30 text-left">
          <SheetTitle className="text-2xl">{candidate.full_name}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusTone(candidate.status)}`}>{candidate.status}</span>
            <span>{[candidate.job_role, candidate.city].filter(Boolean).join(" · ") || "No role or city yet"}</span>
          </SheetDescription>
          <div className="flex flex-wrap gap-2 pt-3">
            {candidate.phone && (
              <>
                <Button size="sm" variant="outline" asChild><a href={`tel:${candidate.phone.replace(/\s/g, "")}`}><Phone className="w-4 h-4 mr-1" /> Call</a></Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={waLink(candidate.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</a>
                </Button>
              </>
            )}
            {candidate.email && (
              <Button size="sm" variant="outline" asChild><a href={`mailto:${candidate.email}`}><Mail className="w-4 h-4 mr-1" /> Email</a></Button>
            )}
            {form.cv_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={form.cv_url} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4 mr-1" /> View CV</a>
              </Button>
            )}
            <Button size="sm" variant="outline" asChild disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                {form.cv_url ? "Replace CV" : "Upload CV"}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => onCv(e.target.files?.[0])} />
              </label>
            </Button>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-8">
          <section className="space-y-4">
            <h3 className="font-semibold">Pipeline</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => set("source", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CRM_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Next follow-up</Label>
                <Input type="date" value={form.next_follow_up || ""} onChange={(e) => set("next_follow_up", e.target.value || null)} />
              </div>
              <div>
                <Label>Interview date & time</Label>
                <Input
                  type="datetime-local"
                  value={toLocalInput(form.interview_at)}
                  onChange={(e) => set("interview_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold">Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {TEXT_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input type={f.type || "text"} value={(form[f.key] as string) || ""} onChange={(e) => set(f.key, e.target.value)} />
                </div>
              ))}
              <div>
                <Label>Department</Label>
                <Select value={form.department || "__none"} onValueChange={(v) => set("department", v === "__none" ? null : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Not set</SelectItem>
                    {[...new Set([...DEPARTMENT_NAMES, ...(form.department ? [form.department] : [])])].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. urgent, Delhi NCR, fresher" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={4} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
            {extra.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-2">Extra info from import</p>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {extra.map(([k, v]) => (
                    <div key={k} className="flex gap-2"><dt className="text-muted-foreground">{k}:</dt><dd className="break-all">{String(v)}</dd></div>
                  ))}
                </dl>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <Button variant="ghost" className="text-destructive" onClick={() => onDelete(candidate.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save changes</Button>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Activity</h3>
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex gap-2">
                <Select value={noteKind} onValueChange={setNoteKind}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_KINDS.filter((k) => k.value !== "status").map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && postNote()}
                  placeholder="e.g. Called, interested, will share CV tomorrow"
                />
                <Button onClick={postNote} disabled={posting || !note.trim()} size="icon" aria-label="Add activity">
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {loadingAct ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet. Log calls, WhatsApp chats and interviews here.</p>
            ) : (
              <ol className="relative border-l pl-5 space-y-4">
                {activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{kindLabel(a.kind)}</span> · {formatDateTime(a.created_at)}
                      {a.created_by_email ? ` · ${a.created_by_email}` : ""}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-xs text-muted-foreground">
              Added {formatDateTime(candidate.created_at)} · Last updated {formatDateTime(candidate.updated_at)}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CandidateDrawer;
