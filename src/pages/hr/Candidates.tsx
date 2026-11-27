import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Download, Globe, Loader2, UserPlus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type CandidateInsert } from "@/lib/crm";
import ExportDialog, { type ExportRow } from "@/components/hr/ExportDialog";
import { type Candidate, deleteRow, insertRow, logEvent, updateRow, useCrm } from "@/lib/hr/model";
import { syncWebsiteLeads } from "@/lib/hr/websiteSync";
import CandidateGrid, { EMPTY_FILTERS, type GridFilters } from "@/components/crm/CandidateGrid";
import { PageHeader, useAction, useHrUi } from "@/components/hr/ui";
import { supabase } from "@/integrations/supabase/client";

const Candidates = ({ onImport }: { onImport: () => void }) => {
  const crm = useCrm();
  const ui = useHrUi();
  const run = useAction();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<GridFilters>({ ...EMPTY_FILTERS, status: "all" });
  const [exportRows, setExportRows] = useState<ExportRow[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const filteredRef = useRef<Candidate[]>([]);

  const onUpdate = async (id: string, patch: Partial<Candidate>) => {
    const before = crm.candidate.get(id);
    const r = await run(() => updateRow<Candidate>("crm_candidates", id, patch), { refresh: ["crm_candidates"] });
    if (r && patch.status && before && before.status !== patch.status) logEvent({ candidate_id: id, kind: "status", content: `Status: ${before.status} → ${patch.status}` });
    return r !== undefined;
  };

  const onCreate = async (rec: CandidateInsert) => {
    const r = await run(async () => {
      const c = await insertRow<Candidate>("crm_candidates", rec as Record<string, unknown>);
      await logEvent({ candidate_id: c.id, kind: "note", content: `Candidate added (source: ${c.source})` });
      return c;
    }, { success: "Candidate added", refresh: ["crm_candidates"] });
    return r !== undefined;
  };

  const onBulkUpdate = async (ids: string[], patch: Partial<Candidate>) => {
    await run(async () => { const { error } = await supabase.from("crm_candidates").update(patch).in("id", ids); if (error) throw error; }, { success: `${ids.length} updated`, refresh: ["crm_candidates"] });
  };

  const onBulkDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} candidate(s) and their pipeline history? This cannot be undone.`)) return;
    await run(async () => { for (const id of ids) await deleteRow("crm_candidates", id); }, { success: `${ids.length} deleted`, refresh: ["all"] });
  };

  const sync = async () => {
    setSyncing(true);
    const n = await run(() => syncWebsiteLeads(), { refresh: ["crm_candidates", "crm_applications"] });
    setSyncing(false);
    if (n !== undefined) toast({ title: n ? `${n} new website lead(s) added` : "Already up to date", description: "Website applications and CV submissions are in your database." });
  };

  return (
    <div>
      <PageHeader
        step={2}
        title="Candidate Sourcing"
        subtitle="Your talent database: WhatsApp, email, job portal, referral and website candidates. Click any cell to edit it like a spreadsheet."
        actions={<Button onClick={() => ui.openNewCandidate()}><UserPlus className="w-4 h-4 mr-1" />Add candidate</Button>}
      />
      <CandidateGrid
        candidates={crm.candidates}
        filters={filters}
        onFiltersChange={setFilters}
        onUpdate={onUpdate}
        onCreate={onCreate}
        onOpen={(c) => navigate(`/hr/candidates/${c.id}`)}
        onBulkUpdate={onBulkUpdate}
        onBulkDelete={onBulkDelete}
        onFilteredChange={(rows) => { filteredRef.current = rows; }}
        bulkActions={(ids) => (
          <Button size="sm" variant="outline" onClick={() => ui.openAddToJob({ candidateIds: ids })}><Briefcase className="w-4 h-4 mr-1" />Add to requirement</Button>
        )}
        actions={
          <>
            <Button variant="outline" onClick={onImport}><FileSpreadsheet className="w-4 h-4 mr-2" />Import Excel / CSV</Button>
            <Button variant="outline" onClick={sync} disabled={syncing}>{syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}Sync website leads</Button>
            <Button variant="outline" onClick={() => filteredRef.current.length ? setExportRows(filteredRef.current.map((c) => ({ c }))) : toast({ title: "Nothing to export" })}>
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </>
        }
      />
      <ExportDialog open={!!exportRows} onOpenChange={(v) => !v && setExportRows(null)} rows={exportRows ?? []}
        title={filters.position && filters.position !== "all" ? `candidates: ${filters.position}` : "candidates"}
        filename={`Alba_candidates_${filters.position && filters.position !== "all" ? filters.position.replace(/[^a-z0-9]+/gi, "_") + "_" : ""}${new Date().toISOString().slice(0, 10)}.xlsx`} />
      {crm.candidates.length === 0 && !crm.loading && (
        <p className="text-sm text-muted-foreground mt-4">Tip: use <strong>Import Excel / CSV</strong> to bring in your existing sheet, or <strong>Sync website leads</strong> to pull in everyone who applied on the website.</p>
      )}
    </div>
  );
};

export default Candidates;
