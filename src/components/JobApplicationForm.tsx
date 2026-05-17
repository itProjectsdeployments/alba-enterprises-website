import { useState } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Job {
  id: string;
  title: string;
}

interface JobApplicationFormProps {
  job: Job;
  onSuccess: () => void;
}

const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number").max(20),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const JobApplicationForm = ({ job, onSuccess }: JobApplicationFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Please upload a PDF or DOC file only";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, cv: error }));
        setCvFile(null);
      } else {
        setErrors(prev => ({ ...prev, cv: "" }));
        setCvFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = applicationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!cvFile) {
      setErrors(prev => ({ ...prev, cv: "Please upload your CV" }));
      return;
    }

    setLoading(true);

    try {
      // Upload CV to storage
      const fileExt = cvFile.name.split('.').pop();
      const fileName = `${Date.now()}_${formData.name.replace(/\s+/g, '_')}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(fileName, cvFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("cvs")
        .getPublicUrl(fileName);

      // Insert applicant record
      const { error: insertError } = await supabase
        .from("applicants")
        .insert({
          job_id: job.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cv_url: urlData.publicUrl,
        });

      if (insertError) throw insertError;

      // Notify admin (best-effort, don't block on failure)
      supabase.functions.invoke("notify-application", {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cv_url: urlData.publicUrl,
          job_title: job.title,
        },
      }).catch((err) => console.warn("Notification failed:", err));

      setSuccess(true);
      toast({
        title: "Application Submitted!",
        description: `Your application for ${job.title} has been received. We'll contact you soon.`,
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
        <p className="text-muted-foreground">
          Thank you for applying. We'll review your application and contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="app-name">Full Name *</Label>
        <Input
          id="app-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter your full name"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="app-email">Email Address *</Label>
        <Input
          id="app-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your.email@example.com"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="app-phone">Phone Number *</Label>
        <Input
          id="app-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91 XXXXXXXXXX"
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="app-cv">Upload CV (PDF or DOC, max 5MB) *</Label>
        <div className="mt-2">
          <label
            htmlFor="app-cv"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              errors.cv 
                ? "border-destructive bg-destructive/5" 
                : cvFile 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary hover:bg-muted/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className={`w-8 h-8 mb-2 ${cvFile ? "text-primary" : "text-muted-foreground"}`} />
              {cvFile ? (
                <p className="text-sm text-primary font-medium">{cvFile.name}</p>
              ) : (
                <>
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF or DOC (max 5MB)</p>
                </>
              )}
            </div>
            <input
              id="app-cv"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>
        </div>
        {errors.cv && <p className="text-sm text-destructive mt-1">{errors.cv}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </Button>
    </form>
  );
};

export default JobApplicationForm;