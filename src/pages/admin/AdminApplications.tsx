import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  cv_url: string;
  job_id: string;
  uploaded_at: string;
  status: string;
}
interface Job { id: string; title: string; }

const STATUSES = ["new", "reviewed", "shortlisted", "rejected", "hired"];

const AdminApplications = () => {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    const [a, j] = await Promise.all([
      supabase.from("applicants").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("jobs").select("id,title"),
    ]);
    if (a.error) toast({ title: "Failed to load applications", description: a.error.message, variant: "destructive" });
    setApps((a.data as Application[]) || []);
    setJobs((j.data as Job[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const jobMap = useMemo(() => Object.fromEntries(jobs.map(j => [j.id, j.title])), [jobs]);

  const filtered = useMemo(() => apps.filter(a => {
    if (jobFilter !== "all" && a.job_id !== jobFilter) return false;
    if (statusFilter !== "all" && (a.status || "new") !== statusFilter) return false;
    if (dateFrom && new Date(a.uploaded_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(a.uploaded_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  }), [apps, jobFilter, statusFilter, dateFrom, dateTo]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applicants").update({ status }).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Job", "CV URL", "Date Applied", "Status"];
    const rows = filtered.map(a => [
      a.name, a.email, a.phone, jobMap[a.job_id] || a.job_id,
      a.cv_url, new Date(a.uploaded_at).toISOString(), a.status || "new",
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Applications</h1>
            <p className="text-muted-foreground">Review candidate applications.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/admin/jobs">Manage Vacancies</Link></Button>
            <Button onClick={exportCsv} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger><SelectValue placeholder="Job" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Candidate</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Job</th>
                  <th className="text-left p-3">CV</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-medium">{a.name}</td>
                    <td className="p-3"><a href={`mailto:${a.email}`} className="text-primary hover:underline">{a.email}</a></td>
                    <td className="p-3">{a.phone}</td>
                    <td className="p-3">{jobMap[a.job_id] || "—"}</td>
                    <td className="p-3">
                      <a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
                        <FileText className="w-4 h-4 mr-1" /> View
                      </a>
                    </td>
                    <td className="p-3 whitespace-nowrap">{new Date(a.uploaded_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Select value={a.status || "new"} onValueChange={(v) => updateStatus(a.id, v)}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No applications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminApplications;
