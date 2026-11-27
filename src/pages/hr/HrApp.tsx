import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCrm, useRefresh } from "@/lib/hr/model";
import { HrUiContext, type HrUi } from "@/components/hr/ui";
import HrLayout from "@/components/hr/HrLayout";
import HrLogin from "@/components/hr/HrLogin";
import ApplicationSheet from "@/components/hr/ApplicationSheet";
import { AddToJobDialog, CandidateDialog, ClientDialog, JobDialog, ScheduleDialog, TaskDialog } from "@/components/hr/dialogs";
import ImportDialog from "@/components/crm/ImportDialog";
import BulkJobsDialog from "@/components/hr/BulkJobsDialog";
import Dashboard from "./Dashboard";
import Requirements, { ClientRequirements } from "./Requirements";
import RequirementDetail from "./RequirementDetail";
import Candidates from "./Candidates";
import CandidateProfile from "./CandidateProfile";
import { Screening, Documents, Offers, Followups } from "./Steps";
import InterviewsPage from "./InterviewsPage";
import BulkScheduleDialog from "@/components/hr/BulkScheduleDialog";
import MoveDialog from "@/components/hr/MoveDialog";
import { Pipeline, Clients, ClientDetail, Tasks, Reports } from "./Workspace";
import { Inbox, WebsiteJobs } from "./Website";
import GoogleForms from "./GoogleForms";

const FullScreen = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-[hsl(210_25%_97%)] p-6">{children}</div>
);

const SetupNotice = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900 max-w-2xl">
    <h2 className="font-semibold flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5" />The CRM database isn't set up yet</h2>
    <p className="text-sm">Ask your administrator to run the HR portal setup script in Supabase (SQL Editor). Details: {message}</p>
  </div>
);

export const HrShell = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const crm = useCrm();
  const refresh = useRefresh();
  // ?app=<id> deep-links straight to a candidate's application panel.
  const [appId, setAppId] = useState<string | null>(params.get("app"));
  const [job, setJob] = useState<{ open: boolean; clientId?: string }>({ open: false });
  const [clientOpen, setClientOpen] = useState(false);
  const [bulk, setBulk] = useState<{ open: boolean; clientId?: string }>({ open: false });
  const [candOpen, setCandOpen] = useState(false);
  const [task, setTask] = useState<{ open: boolean; preset?: { candidate_id?: string; job_id?: string; client_id?: string } }>({ open: false });
  const [addTo, setAddTo] = useState<{ open: boolean; jobId?: string; candidateIds?: string[] }>({ open: false });
  const [schedule, setSchedule] = useState<{ open: boolean; applicationId?: string; level?: "internal" | "client" }>({ open: false });
  const [bulkSchedule, setBulkSchedule] = useState<{ open: boolean; jobId?: string; level?: "internal" | "client" }>({ open: false });
  const [importOpen, setImportOpen] = useState(false);
  const [move, setMove] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });

  const ui: HrUi = useMemo(() => ({
    openApplication: (id) => setAppId(id),
    openNewJob: (clientId) => setJob({ open: true, clientId }),
    openNewClient: () => setClientOpen(true),
    openBulkJobs: (clientId) => setBulk({ open: true, clientId }),
    openNewCandidate: () => setCandOpen(true),
    openNewTask: (preset) => setTask({ open: true, preset }),
    openAddToJob: (o) => setAddTo({ open: true, ...o }),
    openSchedule: (applicationId, level) => setSchedule({ open: true, applicationId, level }),
    openBulkSchedule: (jobId, level) => setBulkSchedule({ open: true, jobId, level }),
    openMove: (ids) => setMove({ open: true, ids }),
  }), []);

  const tablesMissing = crm.error && /crm_|schema cache|does not exist/i.test(crm.error.message);

  return (
    <HrUiContext.Provider value={ui}>
      <Helmet><title>Alba Recruit · HR Workspace</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <HrLayout onImport={() => setImportOpen(true)}>
        {tablesMissing ? <SetupNotice message={crm.error!.message} /> : crm.loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="requirements/client/:clientId" element={<ClientRequirements />} />
            <Route path="requirements/:id" element={<RequirementDetail />} />
            <Route path="candidates" element={<Candidates onImport={() => setImportOpen(true)} />} />
            <Route path="candidates/:id" element={<CandidateProfile />} />
            <Route path="screening" element={<Screening />} />
            <Route path="interviews" element={<InterviewsPage level="internal" key="internal" />} />
            <Route path="client-interviews" element={<InterviewsPage level="client" key="client" />} />
            <Route path="documents" element={<Documents />} />
            <Route path="offers" element={<Offers />} />
            <Route path="followups" element={<Followups />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="google-forms" element={<GoogleForms />} />
            <Route path="website-jobs" element={<WebsiteJobs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/hr" replace />} />
          </Routes>
        )}
      </HrLayout>

      <ApplicationSheet id={appId} onClose={() => setAppId(null)} />
      <JobDialog open={job.open} onOpenChange={(v) => setJob({ open: v })} initial={job.clientId ? { client_id: job.clientId } : null}
        onNewClient={() => setClientOpen(true)} onSaved={(j) => navigate(`/hr/requirements/${j.id}`)} />
      <ClientDialog open={clientOpen} onOpenChange={setClientOpen} />
      <BulkJobsDialog open={bulk.open} onOpenChange={(v) => setBulk((b) => ({ ...b, open: v }))} clientId={bulk.clientId} />
      <CandidateDialog open={candOpen} onOpenChange={setCandOpen} onSaved={(c) => navigate(`/hr/candidates/${c.id}`)} />
      <TaskDialog open={task.open} onOpenChange={(v) => setTask({ open: v })} initial={task.preset ?? null} />
      <AddToJobDialog open={addTo.open} onOpenChange={(v) => setAddTo({ open: v })} jobId={addTo.jobId} candidateIds={addTo.candidateIds} />
      <BulkScheduleDialog open={bulkSchedule.open} onOpenChange={(v) => setBulkSchedule((b) => ({ ...b, open: v }))} jobId={bulkSchedule.jobId} level={bulkSchedule.level ?? "internal"}
        onScheduled={(jobId, level) => navigate(`/hr/${level === "client" ? "client-interviews" : "interviews"}?job=${jobId}`)} />
      <ScheduleDialog open={schedule.open} onOpenChange={(v) => setSchedule({ open: v })} applicationId={schedule.applicationId} level={schedule.level} />
      <MoveDialog open={move.open} onOpenChange={(v) => setMove((m) => ({ ...m, open: v }))} applicationIds={move.ids} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} existing={crm.candidates} onImported={() => refresh("crm_candidates")} />
    </HrUiContext.Provider>
  );
};

/** /hr/*: the HR workspace. Has its own login and never shows the public website. */
const HrApp = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (user && !profile) { const t = setTimeout(() => setSlow(true), 5000); return () => clearTimeout(t); }
    setSlow(false);
  }, [user, profile]);

  if (loading) return <FullScreen><Loader2 className="w-8 h-8 animate-spin text-primary" /></FullScreen>;
  if (!user) return <><Helmet><title>Sign in · Alba Recruit</title><meta name="robots" content="noindex,nofollow" /></Helmet><HrLogin /></>;
  if (!profile) {
    return (
      <FullScreen>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          {slow && <><p className="text-sm text-muted-foreground">Still loading your account…</p><Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button></>}
        </div>
      </FullScreen>
    );
  }
  if (profile.role !== "hr" && profile.role !== "admin") {
    return (
      <FullScreen>
        <div className="max-w-md text-center bg-card border rounded-2xl p-8 space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h1 className="text-xl font-bold">No access to the HR workspace</h1>
          <p className="text-sm text-muted-foreground">You're signed in as {user.email}, which isn't an HR account.</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild><a href="/">Go to website</a></Button>
            <Button onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>
      </FullScreen>
    );
  }
  return <HrShell />;
};

export default HrApp;
