import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

interface Requirement {
  id: string;
  job_title: string;
  number_required: number | null;
  location: string | null;
  salary_range: string | null;
  skill_required: string | null;
  status: string | null;
  created_at: string;
}

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    job_title: "",
    number_required: "",
    location: "",
    salary_range: "",
    skill_required: "",
  });

  const fetchRequirements = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("recruiter_requirements")
      .select("*")
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false });
    setList((data as Requirement[]) || []);
  };

  useEffect(() => {
    fetchRequirements();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("recruiter_requirements").insert({
      recruiter_id: user.id,
      job_title: form.job_title,
      number_required: form.number_required ? parseInt(form.number_required) : null,
      location: form.location || null,
      salary_range: form.salary_range || null,
      skill_required: form.skill_required || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Requirement submitted" });
    setForm({ job_title: "", number_required: "", location: "", salary_range: "", skill_required: "" });
    fetchRequirements();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Recruiter Dashboard | Alba Enterprise" description="Submit and track your manpower hiring requirements." path="/recruiter/dashboard" />
      <Navbar />
      <main className="flex-1 pt-24 pb-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <Button asChild variant="outline"><Link to="/contact">Contact Alba</Link></Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Submit Manpower Requirement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <Input id="job_title" required value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="number_required">Number Required</Label>
                  <Input id="number_required" type="number" min={1} value={form.number_required} onChange={e => setForm({ ...form, number_required: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input id="salary_range" value={form.salary_range} onChange={e => setForm({ ...form, salary_range: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="skill_required">Skills Required</Label>
                <Textarea id="skill_required" value={form.skill_required} onChange={e => setForm({ ...form, skill_required: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Submitting..." : "Submit Requirement"}</Button>
            </form>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">My Requirements</h2>
            {list.length === 0 ? (
              <p className="text-muted-foreground">No requirements submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {list.map(r => (
                  <div key={r.id} className="bg-card border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{r.job_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {r.location || "—"} · {r.number_required ?? "?"} positions · {r.salary_range || "Salary N/A"}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{r.status || "pending"}</span>
                    </div>
                    {r.skill_required && <p className="text-sm mt-2">{r.skill_required}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecruiterDashboard;
