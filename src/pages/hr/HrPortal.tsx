import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Table2, KanbanSquare, FileSpreadsheet, Download, RefreshCw, Loader2, Briefcase, Inbox, FileText, Globe,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { parseEnquiryType } from "@/lib/site";
import {
  type Candidate, type CandidateInsert, exportCandidates, fetchAllCandidates, logActivity, normalizeDepartment, cleanPhone,
} from "@/lib/crm";
import CandidateGrid, { EMPTY_FILTERS, type GridFilters } from "@/components/crm/CandidateGrid";
import CandidateDrawer from "@/components/crm/CandidateDrawer";
import ImportDialog from "@/components/crm/ImportDialog";
import PipelineBoard from "@/components/crm/PipelineBoard";
import CrmOverview from "@/components/crm/CrmOverview";

const parseFields = (message: string) => {
  const out: Record<string, string> = {};
  const lines = message.split("\n").slice(1);
  const notes: string[] = [];
  for (const l of lines) {
    const m = l.match(/^([A-Za-z /]+):\s*(.+)$/);
    if (m) out[m[1].trim()] = m[2].trim();
    else if (l.trim()) notes.push(l.trim());
  }
  return { fields: out, note: notes.join("\n") };
};

const HrPortal = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState<GridFilters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const filteredRef = useRef<Candidate[]>([]);

  const load = useCallback(async () => {
    try {
      setCandidates(await fetchAllCandidates());
    } catch (e: any) {
      toast({
        title: "Couldn't load candidates",
        description: e?.message?.includes("crm_candidates") ? "The CRM tables are not set up in the database yet." : e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openCandidate = candidates.find((c) => c.id === openId) ?? null;

  const updateCandidate = async (id: string, patch: Partial<Candidate>) => {
    const before = candidates.find((c) => c.id === id);
    if (!before) return false;
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { data, error } = await supabase.from("crm_candidates").update(patch).eq("id", id).select().single();
    if (error) {
      setCandidates((prev) => prev.map((c) => (c.id === id ? before : c)));
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return false;
    }
    setCandidates((prev) => prev.map((c) => (c.id === id ? data : c)));
    if (patch.status && patch.status !== before.status) {
      logActivity(id, "status", `Status changed: ${before.status} → ${patch.status}`).catch(() => {});
    }
    return true;
  };

  const createCandidate = async (rec: CandidateInsert) => {
    const { data, error } = await supabase.from("crm_candidates").insert({ ...rec, created_by: user?.id ?? null }).select().single();
    if (error) { toast({ title: "Couldn't add candidate", description: error.message, variant: "destructive" }); return false; }
    setCandidates((prev) => [data, ...prev]);
    toast({ title: "Candidate added", description: data.full_name });
    return true;
  };

  const bulkUpdate = async (ids: string[], patch: Partial<Candidate>) => {
    const { error } = await supabase.from("crm_candidates").update(patch).in("id", ids);
    if (error) { toast({ title: "Bulk update failed", description: error.message, variant: "destructive" }); return; }
    if (patch.status) {
      const changed = candidates.filter((c) => ids.includes(c.id) && c.status !== patch.status);
      await Promise.allSettled(changed.map((c) => logActivity(c.id, "status", `Status changed: ${c.status} → ${patch.status}`)));
    }
    toast({ title: `${ids.length} candidates updated` });
    load();
  };

  const bulkDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} candidate(s)? This cannot be undone.`)) return;
    const { error } = await supabase.from("crm_candidates").delete().in("id", ids);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    setCandidates((prev) => prev.filter((c) => !ids.includes(c.id)));
    toast({ title: `${ids.length} deleted` });
  };

  const deleteOne = async (id: string) => {
    if (!confirm("Delete this candidate and their activity history? This cannot be undone.")) return;
    const { error } = await supabase.from("crm_candidates").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    setOpenId(null);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  /** Copies website job applications and "Job Seeker" enquiries into the CRM (each only once). */
  const syncWebsite = async () => {
    setSyncing(true);
    try {
      const [{ data: apps, error: e1 }, { data: queries, error: e2 }] = await Promise.all([
        supabase.from("applicants").select("*, jobs(title, category, location)").order("uploaded_at", { ascending: false }),
        supabase.from("queries").select("*").order("created_at", { ascending: false }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const records: CandidateInsert[] = [];
      for (const a of apps || []) {
        const job = (a as any).jobs as { title?: string; category?: string; location?: string } | null;
        records.push({
          source_ref: `applicant:${a.id}`,
          full_name: a.name,
          phone: a.phone ? cleanPhone(a.phone) : null,
          email: a.email || null,
          job_role: job?.title ?? null,
          department: job?.category ? normalizeDepartment(job.category) : null,
          city: job?.location ?? null,
          cv_url: a.cv_url || null,
          source: "Website",
          status: "New",
          notes: `Applied online for "${job?.title ?? "a vacancy"}" on ${new Date(a.uploaded_at).toLocaleDateString("en-IN")}.`,
          extra: { "Website application": job?.title ?? "" },
          created_by: user?.id ?? null,
        });
      }
      for (const q of queries || []) {
        if (parseEnquiryType(q.message) !== "Job Seeker") continue;
        const { fields, note } = parseFields(q.message);
        records.push({
          source_ref: `query:${q.id}`,
          full_name: q.name,
          phone: q.phone ? cleanPhone(q.phone) : null,
          email: q.email && q.email !== "Not provided" ? q.email : null,
          job_role: fields["Role / Designation"] ?? null,
          department: fields.Department ? normalizeDepartment(fields.Department) : null,
          experience: fields.Experience ?? null,
          city: fields["Current City"] ?? null,
          cv_url: q.cv_url || null,
          source: "Website",
          status: "New",
          notes: [note, fields["Preferred Location"] ? `Preferred location: ${fields["Preferred Location"]}` : ""].filter(Boolean).join("\n") || null,
          extra: { "Website enquiry": new Date(q.created_at).toLocaleDateString("en-IN") },
          created_by: user?.id ?? null,
        });
      }

      const known = new Set(candidates.map((c) => c.source_ref).filter(Boolean));
      const fresh = records.filter((r) => !known.has(r.source_ref!));
      if (fresh.length) {
        const { error } = await supabase.from("crm_candidates").upsert(fresh, { onConflict: "source_ref", ignoreDuplicates: true });
        if (error) throw error;
      }
      toast({
        title: fresh.length ? `${fresh.length} new website lead(s) added` : "Already up to date",
        description: "Website job applications and CV submissions are now in your candidate sheet.",
      });
      if (fresh.length) load();
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const doExport = async () => {
    // On the sheet tab export exactly what the filters show; elsewhere export everyone.
    const data = tab === "sheet" ? filteredRef.current : candidates;
    if (!data.length) { toast({ title: "Nothing to export" }); return; }
    await exportCandidates(data, `Alba_candidates_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const showFollowUps = (which: "overdue" | "today") => {
    setFilters({ ...EMPTY_FILTERS, status: "active", followUp: which });
    setTab("sheet");
  };

  const firstName = (profile?.full_name || user?.email || "").split(/[ @]/)[0];

  const actionButtons = (
    <>
      <Button onClick={() => setImportOpen(true)}><FileSpreadsheet className="w-4 h-4 mr-2" /> Import Excel / CSV</Button>
      <Button variant="outline" onClick={syncWebsite} disabled={syncing}>
        {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />} Sync website leads
      </Button>
      <Button variant="outline" onClick={doExport}><Download className="w-4 h-4 mr-2" /> Export</Button>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <SEO title="HR Portal | Alba Enterprise" description="Internal candidate management." path="/hr" noindex />
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back{firstName ? `, ${firstName}` : ""}</p>
            <h1 className="text-3xl font-bold">HR Portal</h1>
            <p className="text-muted-foreground">Manage candidates from WhatsApp, email, job portals and the website in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to="/admin/jobs"><Briefcase className="w-4 h-4 mr-2" /> Vacancies</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/applications"><FileText className="w-4 h-4 mr-2" /> Applications</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/enquiries"><Inbox className="w-4 h-4 mr-2" /> Enquiries</Link></Button>
            <Button variant="ghost" size="icon" onClick={() => { setLoading(true); load(); }} title="Refresh" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="sheet" className="gap-2"><Table2 className="w-4 h-4" /> Candidates sheet</TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2"><KanbanSquare className="w-4 h-4" /> Pipeline</TabsTrigger>
          </TabsList>

          {loading && candidates.length === 0 ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <TabsContent value="overview" className="space-y-6">
                {candidates.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed bg-card p-8 text-center">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-primary mb-3" />
                    <h3 className="text-lg font-semibold">Get started</h3>
                    <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                      Import your existing candidate sheet, pull in leads from the website, or add candidates one by one in the Candidates sheet.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">{actionButtons}</div>
                  </div>
                )}
                <CrmOverview candidates={candidates} onOpen={(c) => setOpenId(c.id)} onShowFollowUps={showFollowUps} />
              </TabsContent>

              <TabsContent value="sheet">
                <CandidateGrid
                  candidates={candidates}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onUpdate={updateCandidate}
                  onCreate={createCandidate}
                  onOpen={(c) => setOpenId(c.id)}
                  onBulkUpdate={bulkUpdate}
                  onBulkDelete={bulkDelete}
                  onFilteredChange={(rows) => { filteredRef.current = rows; }}
                  actions={actionButtons}
                />
              </TabsContent>

              <TabsContent value="pipeline">
                <PipelineBoard candidates={candidates} onMove={(id, status) => updateCandidate(id, { status })} onOpen={(c) => setOpenId(c.id)} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <CandidateDrawer candidate={openCandidate} onClose={() => setOpenId(null)} onSave={updateCandidate} onDelete={deleteOne} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} existing={candidates} onImported={load} />
    </div>
  );
};

export default HrPortal;
