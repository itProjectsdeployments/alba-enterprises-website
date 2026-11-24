import { useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENT_NAMES } from "@/lib/crm";
import { PRIORITIES, type Job, insertRow, logEvent, useCrm } from "@/lib/hr/model";
import { parseVacancies } from "@/lib/hr/parseVacancies";
import { ClientDialog, F, clean, useOpenReset } from "./dialogs";
import { NativeSelect, useAction } from "./ui";

interface BulkRow { key: number; title: string; openings: number; location: string; salary_range: string; benefits: string; skills: string; department: string; level: string }
const blankRow = (key: number): BulkRow => ({ key, title: "", openings: 1, location: "", salary_range: "", benefits: "", skills: "", department: "", level: "" });

const EXAMPLE = [
  "Folks Agra vacancy -",
  "",
  "Head chef",
  "Salary (50-70K) as per skills",
  "No accommodation",
  "Preferably continental cuisine background",
  "",
  "Senior Stewards - 2",
  "Salary (15-18K)",
  "Shared accommodation",
].join("\n");

/** Add many positions for one client at once, by pasting the client's vacancy message or typing rows. */
const BulkJobsDialog = ({ open, onOpenChange, clientId }: { open: boolean; onOpenChange: (v: boolean) => void; clientId?: string }) => {
  const run = useAction();
  const { toast } = useToast();
  const { clients } = useCrm();
  const [client, setClient] = useState("");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [priority, setPriority] = useState("Normal");
  const [busy, setBusy] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const nextKey = useRef(1);

  useOpenReset(open, () => { setClient(clientId ?? ""); setText(""); setRows([]); setPriority("Normal"); });

  const read = () => {
    const parsed = parseVacancies(text).map((p) => ({ ...p, key: nextKey.current++ }));
    if (!parsed.length) {
      toast({ title: "No positions found", description: "Put each position on its own line, with the Salary and accommodation lines under it.", variant: "destructive" });
      return;
    }
    setRows(parsed);
  };

  const upd = (key: number, patch: Partial<BulkRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const valid = rows.filter((r) => r.title.trim());
  const positions = valid.reduce((s, r) => s + (Number(r.openings) || 1), 0);

  const save = async () => {
    if (!valid.length) return;
    setBusy(true);
    const ok = await run(async () => {
      for (const r of valid) {
        const job = await insertRow<Job>("crm_jobs", clean({
          client_id: client || null, title: r.title, openings: Math.max(1, Number(r.openings) || 1), location: r.location,
          salary_range: r.salary_range, benefits: r.benefits, skills: r.skills, department: r.department, level: r.level, priority, status: "Open",
        }));
        await logEvent({ job_id: job.id, client_id: job.client_id, kind: "note", content: `Requirement created: ${job.openings} × ${job.title}` });
      }
      return true;
    }, { refresh: ["crm_jobs"] });
    setBusy(false);
    if (ok) {
      toast({ title: `${valid.length} requirement(s) created`, description: `${positions} positions to fill.` });
      onOpenChange(false);
    }
  };

  const cell = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[94vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add multiple positions</DialogTitle>
          <DialogDescription>
            Paste the vacancy message exactly as the client sent it on WhatsApp or email. Every position is read automatically, and you can correct anything before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-3 gap-4">
          <F label="Client" className="sm:col-span-2">
            <div className="flex gap-2">
              <NativeSelect value={client} onChange={setClient} options={clients.map((c) => ({ value: c.id, label: `${c.name}${c.city ? ` · ${c.city}` : ""}` }))} placeholder="Select client" />
              <Button type="button" variant="outline" onClick={() => setClientOpen(true)}>New client</Button>
            </div>
          </F>
          <F label="Priority for all"><NativeSelect value={priority} onChange={setPriority} options={PRIORITIES} /></F>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-3 items-end">
          <F label="Paste vacancy message">
            <Textarea rows={rows.length ? 4 : 10} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-xs" placeholder={EXAMPLE} />
          </F>
          <div className="flex lg:flex-col gap-2">
            <Button onClick={read} disabled={!text.trim()}><Sparkles className="w-4 h-4 mr-1" />Read positions</Button>
            <Button variant="outline" onClick={() => setRows((rs) => [...rs, blankRow(nextKey.current++)])}>Add row manually</Button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[1050px]">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-2 py-2 font-medium w-[210px]">Position *</th>
                  <th className="px-2 py-2 font-medium w-[80px]">Openings</th>
                  <th className="px-2 py-2 font-medium w-[130px]">Outlet / location</th>
                  <th className="px-2 py-2 font-medium w-[160px]">Salary</th>
                  <th className="px-2 py-2 font-medium w-[170px]">Accommodation / benefits</th>
                  <th className="px-2 py-2 font-medium w-[150px]">Department</th>
                  <th className="px-2 py-2 font-medium">Notes / must-haves</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t">
                    <td className="p-1.5"><input className={cell} value={r.title} onChange={(e) => upd(r.key, { title: e.target.value })} /></td>
                    <td className="p-1.5"><input className={cell} type="number" min={1} value={r.openings} onChange={(e) => upd(r.key, { openings: Number(e.target.value) })} /></td>
                    <td className="p-1.5"><input className={cell} value={r.location} onChange={(e) => upd(r.key, { location: e.target.value })} /></td>
                    <td className="p-1.5"><input className={cell} value={r.salary_range} onChange={(e) => upd(r.key, { salary_range: e.target.value })} /></td>
                    <td className="p-1.5"><input className={cell} value={r.benefits} onChange={(e) => upd(r.key, { benefits: e.target.value })} /></td>
                    <td className="p-1.5">
                      <select className={cell} value={r.department} onChange={(e) => upd(r.key, { department: e.target.value })}>
                        <option value="">—</option>
                        {DEPARTMENT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5"><input className={cell} value={r.skills} onChange={(e) => upd(r.key, { skills: e.target.value })} /></td>
                    <td className="p-1.5">
                      <button className="h-9 px-2 text-muted-foreground hover:text-rose-700" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label="Remove row">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter className="items-center gap-3">
          {valid.length > 0 && <span className="text-sm text-muted-foreground sm:mr-auto">{valid.length} requirement(s), {positions} positions</span>}
          <Button onClick={save} disabled={busy || !valid.length}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create {valid.length || ""} requirement{valid.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
        <ClientDialog open={clientOpen} onOpenChange={setClientOpen} onSaved={(c) => setClient(c.id)} />
      </DialogContent>
    </Dialog>
  );
};

export default BulkJobsDialog;
