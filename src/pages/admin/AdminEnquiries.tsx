import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Download, FileText, Trash2, Search, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ENQUIRY_TYPES, parseEnquiryType } from "@/lib/site";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  cv_url: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<string, string> = {
  "Hiring Requirement": "bg-green-100 text-green-800",
  "Job Seeker": "bg-blue-100 text-blue-800",
  "Visa & Documentation": "bg-amber-100 text-amber-800",
  "HR Consultancy": "bg-purple-100 text-purple-800",
  General: "bg-muted text-muted-foreground",
};

const stripTypePrefix = (m: string) => m.replace(/^\[.+?\]\n?/, "");
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`;

const AdminEnquiries = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("queries").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load enquiries", description: error.message, variant: "destructive" });
    setItems((data as Enquiry[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((e) => {
      if (typeFilter !== "all" && parseEnquiryType(e.message) !== typeFilter) return false;
      if (q && ![e.name, e.email, e.phone, e.message].some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, typeFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((e) => { const t = parseEnquiryType(e.message); c[t] = (c[t] || 0) + 1; });
    return c;
  }, [items]);

  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry? This cannot be undone.")) return;
    const { error } = await supabase.from("queries").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    setItems((prev) => prev.filter((e) => e.id !== id));
  };

  const exportCsv = () => {
    const headers = ["Date", "Type", "Name", "Email", "Phone", "Details", "CV URL"];
    const rows = filtered.map((e) => [
      new Date(e.created_at).toISOString(), parseEnquiryType(e.message), e.name, e.email, e.phone,
      stripTypePrefix(e.message), e.cv_url || "",
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Enquiries</h1>
            <p className="text-muted-foreground">Hiring requirements, CVs and other enquiries from the website.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild><Link to="/admin/jobs">Vacancies</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/applications">Applications</Link></Button>
            <Button onClick={exportCsv} disabled={!filtered.length}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {ENQUIRY_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === t ? "border-primary ring-1 ring-primary" : ""} ${TYPE_STYLES[t]}`}
            >
              {t} · {counts[t] || 0}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-[1fr_220px] gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, phone, city, role..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ENQUIRY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 border rounded-lg">No enquiries found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((e) => {
              const type = parseEnquiryType(e.message);
              const body = stripTypePrefix(e.message);
              const isOpen = expanded === e.id;
              return (
                <div key={e.id} className="border rounded-lg bg-card">
                  <button className="w-full text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-2" onClick={() => setExpanded(isOpen ? null : e.id)}>
                    <span className={`text-xs px-2 py-1 rounded-full ${TYPE_STYLES[type] || TYPE_STYLES.General}`}>{type}</span>
                    <span className="font-medium">{e.name}</span>
                    <span className="text-sm text-muted-foreground">{e.phone}</span>
                    <span className="text-sm text-muted-foreground truncate max-w-xs hidden md:inline">{body.split("\n")[0]}</span>
                    <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t pt-4 space-y-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">{body}</pre>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild><a href={`mailto:${e.email}`}>Email {e.email}</a></Button>
                        <Button size="sm" variant="outline" asChild><a href={`tel:${e.phone}`}>Call</a></Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={waLink(e.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</a>
                        </Button>
                        {e.cv_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={e.cv_url} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4 mr-1" /> View CV</a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(e.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminEnquiries;
