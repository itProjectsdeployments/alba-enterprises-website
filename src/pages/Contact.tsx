import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Upload, Loader2, CheckCircle, MessageCircle, ArrowRight } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import PageHero from "@/components/PageHero";
import contactHeroImage from "@/assets/contact-hero.jpg";
import { DEPARTMENTS, SITE, formatEnquiryMessage, type EnquiryType } from "@/lib/site";
import { submitEnquiry, uploadCv, validateCvFile } from "@/lib/enquiries";
import SubmitFallback from "@/components/SubmitFallback";

const querySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20),
  message: z.string().trim().max(1500),
});

const TYPE_FROM_PARAM: Record<string, EnquiryType> = {
  hiring: "Hiring Requirement",
  "job-seeker": "Job Seeker",
  visa: "Visa & Documentation",
  "hr-consultancy": "HR Consultancy",
  general: "General",
};

const TYPE_OPTIONS: { value: EnquiryType; label: string }[] = [
  { value: "Job Seeker", label: "I'm looking for a hotel job" },
  { value: "Hiring Requirement", label: "I want to hire staff" },
  { value: "HR Consultancy", label: "HR consultancy" },
  { value: "Visa & Documentation", label: "Visa guidance / documentation" },
  { value: "General", label: "General enquiry" },
];

const EXPERIENCE = ["Fresher", "Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"];

const Contact = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<EnquiryType>(TYPE_FROM_PARAM[searchParams.get("type") || ""] || "General");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [seeker, setSeeker] = useState({ department: "", role: "", experience: "", currentCity: "", preferredLocation: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    const t = TYPE_FROM_PARAM[searchParams.get("type") || ""];
    if (t) setType(t);
  }, [searchParams]);

  const isSeeker = type === "Job Seeker";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateCvFile(file);
    setErrors((prev) => ({ ...prev, cv: error || "" }));
    setCvFile(error ? null : file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors: Record<string, string> = {};
    const result = querySchema.safeParse(formData);
    if (!result.success) {
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[String(err.path[0])] = err.message; });
    }
    if (isSeeker && !seeker.department) fieldErrors.department = "Please select a department";
    if (!isSeeker && formData.message.trim().length < 10) fieldErrors.message = "Message must be at least 10 characters";
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    setErrors({});
    setFallback(null);
    setLoading(true);
    const fields = isSeeker
      ? {
          Department: seeker.department,
          "Role / Designation": seeker.role,
          Experience: seeker.experience,
          "Current City": seeker.currentCity,
          "Preferred Location": seeker.preferredLocation,
        }
      : {};
    try {
      const cvUrl = cvFile ? await uploadCv(cvFile, formData.name) : null;
      const message = formatEnquiryMessage(type, { ...fields, ...(isSeeker && { CV: cvUrl ? "Attached" : "Not attached" }) }, formData.message);
      await submitEnquiry({ ...formData, message, cvUrl });

      setSuccess(true);
      toast({ title: "Message sent", description: "Thank you. We'll get back to you shortly." });
      setFormData({ name: "", email: "", phone: "", message: "" });
      setSeeker({ department: "", role: "", experience: "", currentCity: "", preferredLocation: "" });
      setCvFile(null);
    } catch (error: any) {
      console.error("Error submitting query:", error);
      const summary = formatEnquiryMessage(type, fields, formData.message);
      setFallback(
        `Name: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\n${summary}` +
          (cvFile ? "\n\n(I will attach my CV to this message.)" : ""),
      );
      toast({ title: "Couldn't submit online", description: "Please send your message via WhatsApp or email below.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive mt-1">{errors[k]}</p>;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Alba Enterprise | Hospitality Recruitment in India"
        description="Contact Alba Enterprise in Faridabad for hotel staff hiring, hotel job opportunities in India, HR consultancy or visa documentation assistance."
        path="/contact"
      />
      <Navbar />

      <div className="pt-20">
        <PageHero
          image={contactHeroImage}
          imageAlt="Alba Enterprise office reception"
          eyebrow="Contact us"
          title="Let's Talk"
          subtitle="Hiring for your hotel, looking for your next hospitality role, or need documentation help? Send us a message and the right person will get back to you."
        />

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[2fr_3fr] gap-12">
              {/* Info */}
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><MapPin className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold mb-1">Office</h3>
                      <p className="text-muted-foreground">{SITE.addressLines[0]},<br />{SITE.addressLines[1]}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><Phone className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone / WhatsApp</h3>
                      <a href={SITE.phoneHref} className="text-muted-foreground hover:text-primary transition-colors">{SITE.phoneDisplay}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><Mail className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <a href={`mailto:${SITE.email}`} className="text-muted-foreground hover:text-primary transition-colors">{SITE.email}</a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-[#25D366] hover:bg-[#20BA5A] text-white" asChild>
                    <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2" /> Chat on WhatsApp</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/hire-staff">Hire Staff</Link>
                  </Button>
                </div>

                <div className="mt-8 rounded-xl overflow-hidden border">
                  <iframe
                    src={SITE.mapEmbed}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Alba Enterprise office location"
                  />
                </div>
              </motion.div>

              {/* Form */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border">
                  <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

                  {success ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Message received</h3>
                      <p className="text-muted-foreground mb-6">Thank you for reaching out. We'll contact you soon.</p>
                      <Button variant="outline" onClick={() => setSuccess(false)}>Send another message</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      <div>
                        <Label>What can we help you with? *</Label>
                        <Select value={type} onValueChange={(v) => setType(v as EnquiryType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {type === "Hiring Requirement" && (
                        <Link to="/hire-staff" className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm hover:bg-primary/10 transition-colors">
                          <span>For faster service, use our <strong>hiring requirement form</strong>. It captures department, positions and timelines in one go.</span>
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 ml-3" />
                        </Link>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
                          {err("name")}
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
                          {err("email")}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone / WhatsApp *</Label>
                          <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91" className={errors.phone ? "border-destructive" : ""} />
                          {err("phone")}
                        </div>
                      </div>

                      {isSeeker && (
                        <div className="grid sm:grid-cols-2 gap-4 rounded-lg bg-muted/60 p-4">
                          <div>
                            <Label>Department *</Label>
                            <Select value={seeker.department} onValueChange={(v) => setSeeker({ ...seeker, department: v })}>
                              <SelectTrigger className={errors.department ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {DEPARTMENTS.map((d) => <SelectItem key={d.title} value={d.title}>{d.title}</SelectItem>)}
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {err("department")}
                          </div>
                          <div>
                            <Label htmlFor="role">Current / desired role</Label>
                            <Input id="role" value={seeker.role} onChange={(e) => setSeeker({ ...seeker, role: e.target.value })} placeholder="e.g. Commis I" />
                          </div>
                          <div>
                            <Label>Experience</Label>
                            <Select value={seeker.experience} onValueChange={(v) => setSeeker({ ...seeker, experience: v })}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {EXPERIENCE.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="currentCity">Current city</Label>
                            <Input id="currentCity" value={seeker.currentCity} onChange={(e) => setSeeker({ ...seeker, currentCity: e.target.value })} />
                          </div>
                          <div className="sm:col-span-2">
                            <Label htmlFor="preferredLocation">Preferred job location(s) in India</Label>
                            <Input id="preferredLocation" value={seeker.preferredLocation} onChange={(e) => setSeeker({ ...seeker, preferredLocation: e.target.value })} placeholder="e.g. Delhi NCR, Jaipur, Anywhere" />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="message">{isSeeker ? "Anything else we should know?" : "Your Message *"}</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder={isSeeker ? "Notice period, expected salary, etc." : "How can we help?"}
                          rows={4}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {err("message")}
                      </div>

                      {(isSeeker || type === "General") && (
                        <div>
                          <Label htmlFor="cv">Upload CV {isSeeker ? "(recommended)" : "(optional)"}: PDF or DOC, max 5MB</Label>
                          <label
                            htmlFor="cv"
                            className={`mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              errors.cv ? "border-destructive bg-destructive/5" : cvFile ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-muted/50"
                            }`}
                          >
                            <Upload className={`w-5 h-5 mb-1 ${cvFile ? "text-primary" : "text-muted-foreground"}`} />
                            <p className={`text-sm ${cvFile ? "text-primary font-medium" : "text-muted-foreground"}`}>
                              {cvFile ? cvFile.name : "Click to upload"}
                            </p>
                            <input id="cv" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                          </label>
                          {err("cv")}
                        </div>
                      )}

                      {fallback && <SubmitFallback subject={`Website enquiry – ${type} – ${formData.name}`} text={fallback} />}
                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : <><Send className="w-5 h-5 mr-2" /> Send Message</>}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        We use your details only to respond to your enquiry. See our <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
                      </p>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Contact;
