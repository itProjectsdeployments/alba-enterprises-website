import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, UserPlus, Globe, Share2, Trash2, Building2, Phone, CalendarPlus, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime, waLink } from "@/lib/crm";
import { JOB_STATUSES, JOB_STATUS_TONE, PRIORITY_TONE, deleteRow, logEvent, updateRow, useActivities, useCrm, type Job } from "@/lib/hr/model";
import { Card, NativeSelect, Pill, useAction, useHrUi } from "@/components/hr/ui";
import { JobDialog } from "@/components/hr/dialogs";
import StageBoard from "@/components/hr/StageBoard";

export const jobPostText = (j: Job) => [
  `*Hiring: ${j.title}*${j.openings > 1 ? ` (${j.openings} positions)` : ""}`,
  j.location && `📍 ${j.location}`,
  j.salary_range && `💰 ₹${j.salary_range.replace(/^₹\s*/, "")} per month`,
  j.experience_required && `Experience: ${j.experience_required}`,
  j.shift && `Shift: ${j.shift}`,
  j.benefits && `Benefits: ${j.benefits}`,
  j.skills && `Requirements: ${j.skills}`,
  "",
  "Interested candidates can share their CV on WhatsApp: +91 85278 81258",
  "– Alba Enterprise, hospitality recruitment",
].filter((l): l is string => typeof l === "string").join("\n");

const Info = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div> : null;

const RequirementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const activities = useActivities({ job_id: id });
  const job = crm.job.get(id || "");

  if (!job) return crm.loading ? null : <p className="text-muted-foreground">Requirement not found. <Link to="/hr/requirements" className="text-primary">Back</Link></p>;

  const client = job.client_id ? crm.client.get(job.client_id) : undefined;
  const apps = crm.applications.filter((a) => a.job_id === job.id);
  const joined = apps.filter((a) => a.stage === "Joined").length;
  const closedCount = apps.filter((a) => a.stage === "Rejected" || a.stage === "Dropped").length;

  const publish = async () => {
    await run(async () => {
      if (job.public_job_id) {
        const { data: existing } = await supabase.from("jobs").select("status").eq("id", job.public_job_id).maybeSingle();
        const nextStatus = existing?.status === "open" ? "closed" : "open";
        const { error } = await supabase.from("jobs").update({ status: nextStatus }).eq("id", job.public_job_id);
        if (error) throw error;
        toast({ title: nextStatus === "open" ? "Visible on the website again" : "Removed from the website" });
        return;
      }
      const description = [
        job.description || `${job.title} required for a reputed hospitality property${job.location ? ` in ${job.location}` : ""}.`,
        job.experience_required && `Experience: ${job.experience_required}.`,
        job.skills && `Requirements: ${job.skills}.`,
        job.shift && `Shift: ${job.shift}.`,
        job.benefits && `Benefits: ${job.benefits}.`,
      ].filter(Boolean).join("\n");
      const { data, error } = await supabase.from("jobs").insert({
        title: job.title, category: job.department || "Hospitality", country: "India", location: job.location || null,
        description: description.length < 10 ? `${description} – apply now.` : description, salary: job.salary_range || null, status: "open",
      }).select().single();
      if (error) throw error;
      await updateRow("crm_jobs", job.id, { public_job_id: data.id });
      await logEvent({ job_id: job.id, kind: "note", content: "Published on the website (Hotel Jobs page)" });
      toast({ title: "Published on the website", description: "Candidates can now apply on the Hotel Jobs page. Applications appear in Website leads." });
    }, { refresh: ["crm_jobs"] });
  };

  const share = async () => {
    const text = jobPostText(job);
    await navigator.clipboard.writeText(text).catch(() => {});
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const remove = async () => {
    if (!confirm(`Delete "${job.title}" and its ${apps.length} pipeline record(s)? Candidates stay in your database.`)) return;
    const ok = await run(() => deleteRow("crm_jobs", job.id), { success: "Requirement deleted", refresh: ["all"] });
    if (ok !== undefined) navigate("/hr/requirements");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/hr/requirements" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />Requirements</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Pill tone={JOB_STATUS_TONE[job.status] ?? ""}>{job.status}</Pill>
              <Pill tone={PRIORITY_TONE[job.priority] ?? ""}>{job.priority} priority</Pill>
              {job.public_job_id && <Pill tone="bg-primary/10 text-primary border-primary/20"><Globe className="w-3 h-3 mr-1" />On website</Pill>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">
              {client ? <Link to={`/hr/clients/${client.id}`} className="hover:text-primary font-medium text-foreground">{client.name}</Link> : "No client"}
              {job.location && ` · ${job.location}`} · {joined} of {job.openings} filled
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => ui.openAddToJob({ jobId: job.id })}><UserPlus className="w-4 h-4 mr-1" />Add candidates</Button>
            <Button variant="outline" onClick={() => ui.openSchedule()}><CalendarPlus className="w-4 h-4 mr-1" />Schedule</Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" />Edit</Button>
            <Button variant="outline" onClick={publish}><Globe className="w-4 h-4 mr-1" />{job.public_job_id ? "Show/hide on website" : "Publish on website"}</Button>
            <Button variant="outline" onClick={share}><Share2 className="w-4 h-4 mr-1" />Share job post</Button>
            <Button variant="ghost" size="icon" onClick={() => ui.openNewTask({ job_id: job.id, client_id: job.client_id ?? undefined })} title="Add task"><ListTodo className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="text-rose-700" onClick={remove} title="Delete"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Candidate pipeline <span className="text-muted-foreground font-normal text-sm">· drag cards between stages, click to open</span></h2>
        {closedCount > 0 && <Button variant="ghost" size="sm" onClick={() => setShowClosed(!showClosed)}>{showClosed ? "Hide" : "Show"} rejected/dropped ({closedCount})</Button>}
      </div>
      {apps.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed bg-card p-8 text-center">
          <p className="font-medium">No candidates on this requirement yet</p>
          <p className="text-sm text-muted-foreground mb-4">Step 2: add matching candidates from your database. Best matches are suggested first.</p>
          <Button onClick={() => ui.openAddToJob({ jobId: job.id })}><UserPlus className="w-4 h-4 mr-1" />Add candidates</Button>
        </div>
      ) : <StageBoard applications={apps} hideClosed={!showClosed} />}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Requirement details" className="lg:col-span-2" actions={
          <div className="w-32"><NativeSelect value={job.status} onChange={(v) => run(() => updateRow("crm_jobs", job.id, { status: v }), { success: `Marked ${v}`, refresh: ["crm_jobs"] })} options={JOB_STATUSES} className="h-8" /></div>
        }>
          <div className="grid sm:grid-cols-3 gap-4">
            <Info label="Department" value={job.department} />
            <Info label="Level" value={job.level} />
            <Info label="Openings" value={job.openings} />
            <Info label="Salary (₹/month)" value={job.salary_range} />
            <Info label="Experience" value={job.experience_required} />
            <Info label="Shift" value={job.shift} />
            <Info label="Benefits" value={job.benefits} />
            <Info label="Target joining" value={job.target_date ? formatDate(job.target_date) : null} />
            <Info label="Created" value={formatDate(job.created_at)} />
            <Info label="Google Form (auto-import)" value={job.intake_key} />
          </div>
          {job.skills && <div className="mt-4"><p className="text-xs text-muted-foreground">Key skills / must-haves</p><p className="text-sm">{job.skills}</p></div>}
          {job.description && <div className="mt-4"><p className="text-xs text-muted-foreground">Description & client notes</p><p className="text-sm whitespace-pre-wrap">{job.description}</p></div>}
        </Card>
        <div className="space-y-6">
          {client && (
            <Card title="Client contact" icon={Building2}>
              <p className="font-medium">{client.contact_person || client.name}</p>
              {client.contact_designation && <p className="text-sm text-muted-foreground">{client.contact_designation}</p>}
              {client.terms && <p className="text-xs text-muted-foreground mt-2">Terms: {client.terms}</p>}
              <div className="flex gap-2 mt-3">
                {client.contact_phone && <Button size="sm" variant="outline" asChild><a href={`tel:${client.contact_phone.replace(/\s/g, "")}`}><Phone className="w-4 h-4 mr-1" />Call</a></Button>}
                {client.contact_phone && <Button size="sm" variant="outline" asChild><a href={waLink(client.contact_phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>}
              </div>
            </Card>
          )}
          <Card title="Activity">
            <ol className="space-y-2.5 max-h-80 overflow-y-auto">
              {(activities.data || []).slice(0, 30).map((a) => (
                <li key={a.id} className="text-sm"><p>{a.content}</p><p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p></li>
              ))}
              {!activities.data?.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </ol>
          </Card>
        </div>
      </div>

      <JobDialog open={editOpen} onOpenChange={setEditOpen} initial={job} onNewClient={() => ui.openNewClient()} />
    </div>
  );
};

export default RequirementDetail;
