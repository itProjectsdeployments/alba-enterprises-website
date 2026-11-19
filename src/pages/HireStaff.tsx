import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { CheckCircle, Loader2, Phone, MessageCircle, Clock, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, HIRING_LEVELS, SITE, formatEnquiryMessage } from "@/lib/site";
import { submitEnquiry } from "@/lib/enquiries";
import SubmitFallback from "@/components/SubmitFallback";

const schema = z.object({
  company: z.string().trim().min(2, "Please enter your hotel / company name").max(150),
  contactName: z.string().trim().min(2, "Please enter your name").max(100),
  designation: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20),
  city: z.string().trim().min(2, "Please enter the property location").max(100),
  department: z.string().min(1, "Please select a department"),
  positions: z.string().trim().min(2, "Please enter the role(s) you are hiring for").max(300),
  level: z.string().optional(),
  count: z.string().optional(),
  joining: z.string().optional(),
  budget: z.string().trim().max(100).optional(),
  details: z.string().trim().max(1500).optional(),
});

type FormState = z.infer<typeof schema>;

const empty: FormState = {
  company: "", contactName: "", designation: "", email: "", phone: "", city: "",
  department: "", positions: "", level: "", count: "", joining: "", budget: "", details: "",
};

const JOINING_OPTIONS = ["Immediate", "Within 15 days", "Within 30 days", "Within 60 days", "Flexible / Pre-opening"];

const HireStaff = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((err) => { if (err.path[0]) fe[String(err.path[0])] = err.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setFallback(null);
    setLoading(true);
    const message = formatEnquiryMessage(
      "Hiring Requirement",
      {
        "Hotel / Company": form.company,
        "Contact Person": form.contactName,
        Designation: form.designation,
        "Property Location": form.city,
        Department: form.department,
        "Position(s)": form.positions,
        Level: form.level,
        "No. of Positions": form.count,
        "Expected Joining": form.joining,
        "Salary Budget": form.budget,
      },
      form.details,
    );
    try {
      await submitEnquiry({ name: form.contactName, email: form.email, phone: form.phone, message });
      setSuccess(true);
      setForm(empty);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setFallback(`Name: ${form.contactName}\nPhone: ${form.phone}\nEmail: ${form.email}\n${message}`);
      toast({ title: "Couldn't submit online", description: "Please send your requirement via WhatsApp or email below.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (k: string) => errors[k] && <p className="text-sm text-destructive mt-1">{errors[k]}</p>;
  const cls = (k: string) => (errors[k] ? "border-destructive" : "");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Hire Hotel Staff | Submit a Hiring Requirement | Alba Enterprise"
        description="Hiring for your hotel, resort or restaurant in India? Share your requirement for Front Office, Housekeeping, Laundry, F&B or Maintenance staff and our recruiters will call you back."
        path="/hire-staff"
      />
      <Navbar />

      <main className="pt-20">
        <section className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-accent mb-3">For hotels & employers</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Submit a Hiring Requirement</h1>
            <p className="text-lg text-primary-foreground/85">
              Tell us who you need. It takes about two minutes, and a recruiter will call you to discuss the
              requirement, usually within one working day.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[2fr_1fr] gap-10 max-w-6xl mx-auto">
              <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
                {success ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Requirement received</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Thank you. Our recruitment team will contact you shortly. For urgent requirements you can also
                      reach us on WhatsApp.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => setSuccess(false)}>Submit another requirement</Button>
                      <Button variant="outline" asChild>
                        <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold mb-2">Your details</legend>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company">Hotel / Company name *</Label>
                          <Input id="company" value={form.company} onChange={(e) => set("company")(e.target.value)} className={cls("company")} />
                          {fieldError("company")}
                        </div>
                        <div>
                          <Label htmlFor="city">Property location (city) *</Label>
                          <Input id="city" value={form.city} onChange={(e) => set("city")(e.target.value)} placeholder="e.g. Gurugram" className={cls("city")} />
                          {fieldError("city")}
                        </div>
                        <div>
                          <Label htmlFor="contactName">Contact person *</Label>
                          <Input id="contactName" value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} className={cls("contactName")} />
                          {fieldError("contactName")}
                        </div>
                        <div>
                          <Label htmlFor="designation">Designation</Label>
                          <Input id="designation" value={form.designation} onChange={(e) => set("designation")(e.target.value)} placeholder="e.g. HR Manager" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} className={cls("email")} />
                          {fieldError("email")}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone / WhatsApp *</Label>
                          <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+91" className={cls("phone")} />
                          {fieldError("phone")}
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold mb-2">Requirement</legend>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Department *</Label>
                          <Select value={form.department} onValueChange={set("department")}>
                            <SelectTrigger className={cls("department")}><SelectValue placeholder="Select department" /></SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((d) => <SelectItem key={d.title} value={d.title}>{d.title}</SelectItem>)}
                              <SelectItem value="Multiple departments">Multiple departments</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldError("department")}
                        </div>
                        <div>
                          <Label>Level</Label>
                          <Select value={form.level} onValueChange={set("level")}>
                            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                            <SelectContent>
                              {HIRING_LEVELS.map((l) => <SelectItem key={l.title} value={l.title}>{l.title}</SelectItem>)}
                              <SelectItem value="Mixed levels">Mixed levels</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="positions">Position(s) you are hiring for *</Label>
                          <Input id="positions" value={form.positions} onChange={(e) => set("positions")(e.target.value)} placeholder="e.g. 2 Commis II (Indian), 1 Front Office Supervisor" className={cls("positions")} />
                          {fieldError("positions")}
                        </div>
                        <div>
                          <Label htmlFor="count">Total number of positions</Label>
                          <Input id="count" type="number" min={1} value={form.count} onChange={(e) => set("count")(e.target.value)} />
                        </div>
                        <div>
                          <Label>Expected joining</Label>
                          <Select value={form.joining} onValueChange={set("joining")}>
                            <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                            <SelectContent>
                              {JOINING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="budget">Salary budget (optional)</Label>
                          <Input id="budget" value={form.budget} onChange={(e) => set("budget")(e.target.value)} placeholder="e.g. ₹18,000–22,000 per month + food & accommodation" />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="details">Additional details</Label>
                          <Textarea id="details" rows={4} value={form.details} onChange={(e) => set("details")(e.target.value)} placeholder="Experience required, brand background, shift timings, accommodation, etc." />
                        </div>
                      </div>
                    </fieldset>

                    {fallback && <SubmitFallback subject={`Hiring Requirement – ${form.company}`} text={fallback} />}
                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : "Submit Requirement"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to be contacted by Alba Enterprise about this requirement. See our{" "}
                      <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
                    </p>
                  </form>
                )}
              </div>

              <aside className="space-y-6">
                <div className="bg-muted rounded-xl p-6 space-y-5">
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Quick response</h3>
                      <p className="text-sm text-muted-foreground">A recruiter will call you to understand the requirement in detail.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Pre-screened profiles</h3>
                      <p className="text-sm text-muted-foreground">You interview only candidates who match your brief.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Prefer to talk?</h3>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline" asChild>
                      <a href={SITE.phoneHref}><Phone className="w-4 h-4 mr-2" /> {SITE.phoneDisplay}</a>
                    </Button>
                    <Button className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white" asChild>
                      <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</a>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Regular hiring partner?{" "}
                  <Link to="/register?role=recruiter" className="text-primary hover:underline">Create an employer account</Link>{" "}
                  to submit and track requirements from your dashboard.
                </p>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default HireStaff;
