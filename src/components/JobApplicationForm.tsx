import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { validateCvFile } from "@/lib/enquiries";
import SubmitFallback from "@/components/SubmitFallback";

interface Job {
  id: string;
  title: string;
}

interface JobApplicationFormProps {
  job: Job;
  onSuccess: () => void;
}

const applicationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20),
});

const JobApplicationForm = ({ job, onSuccess }: JobApplicationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const result = applicationSchema.safeParse(formData);
    if (!result.success) {
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[String(err.path[0])] = err.message; });
    }
    if (!cvFile) fieldErrors.cv = "Please upload your CV";
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    setErrors({});
    setFallback(null);
    setLoading(true);

    try {
      const ext = cvFile!.name.split(".").pop();
      const fileName = `${Date.now()}_${formData.name.replace(/[^a-zA-Z0-9]+/g, "_")}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("cvs").upload(fileName, cvFile!);
      if (uploadError) throw uploadError;
      const cvUrl = supabase.storage.from("cvs").getPublicUrl(fileName).data.publicUrl;

      const { error: insertError } = await supabase.from("applicants").insert({
        job_id: job.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cv_url: cvUrl,
      });
      if (insertError) throw insertError;

      // Best-effort admin alert; the application is already saved.
      supabase.functions
        .invoke("notify-application", {
          body: { name: formData.name, email: formData.email, phone: formData.phone, cv_url: cvUrl, job_title: job.title },
        })
        .catch((err) => console.warn("Notification failed:", err));

      setSuccess(true);
      setTimeout(onSuccess, 2500);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      setFallback(
        `Job application: ${job.title}\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\n\n(I will attach my CV to this message.)`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Application submitted</h3>
        <p className="text-muted-foreground">Thank you for applying. Our team will review your profile and contact you.</p>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive mt-1">{errors[k]}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <Label htmlFor="app-name">Full Name *</Label>
        <Input id="app-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
        {err("name")}
      </div>
      <div>
        <Label htmlFor="app-email">Email *</Label>
        <Input id="app-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
        {err("email")}
      </div>
      <div>
        <Label htmlFor="app-phone">Phone / WhatsApp *</Label>
        <Input id="app-phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91" className={errors.phone ? "border-destructive" : ""} />
        {err("phone")}
      </div>
      <div>
        <Label htmlFor="app-cv">CV (PDF or DOC, max 5MB) *</Label>
        <label
          htmlFor="app-cv"
          className={`mt-2 flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            errors.cv ? "border-destructive bg-destructive/5" : cvFile ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-muted/50"
          }`}
        >
          <Upload className={`w-6 h-6 mb-2 ${cvFile ? "text-primary" : "text-muted-foreground"}`} />
          <p className={`text-sm ${cvFile ? "text-primary font-medium" : "text-muted-foreground"}`}>{cvFile ? cvFile.name : "Click to upload your CV"}</p>
          <input id="app-cv" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        </label>
        {err("cv")}
      </div>

      {fallback && <SubmitFallback compact subject={`Job application – ${job.title} – ${formData.name}`} text={fallback} />}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Your CV is shared only with relevant employers. See our <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
};

export default JobApplicationForm;
