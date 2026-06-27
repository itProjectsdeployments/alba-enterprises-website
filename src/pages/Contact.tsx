import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Upload, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import contactHeroImage from "@/assets/contact-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const querySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number").max(20),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
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
    const result = querySchema.safeParse(formData);
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

    setLoading(true);

    try {
      let cvUrl = null;

      // Upload CV if provided
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `query_${Date.now()}_${formData.name.replace(/\s+/g, '_')}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(fileName, cvFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("cvs")
          .getPublicUrl(fileName);

        cvUrl = urlData.publicUrl;
      }

    
     // Insert query record
      const { error: insertError } = await supabase
      .from("queries")
      .insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      cv_url: cvUrl,
  });

if (insertError) throw insertError;

// Send email notification
await supabase.functions.invoke("notify-query", {
  body: {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    message: formData.message,
  },
});

setSuccess(true);

toast({
  title: "Query Submitted!",
  description: "Thank you for reaching out. We'll get back to you shortly.",
});

      // Reset form after delay
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: "", email: "", phone: "", message: "" });
        setCvFile(null);
      }, 3000);

    } catch (error: any) {
      console.error("Error submitting query:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/918527881258", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Alba Enterprise | Submit Your CV"
        description="Get in touch with Alba Enterprise. Submit your CV, ask a question or explore international career opportunities with our recruitment team."
        path="/contact"
      />
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={contactHeroImage}
              alt="Contact Alba Enterprise for overseas recruitment services, international job placements and manpower consultancy"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
              <p className="text-lg opacity-90">
                Have questions? We're here to help you with your recruitment needs. Submit your CV for future opportunities!
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-muted-foreground">
                        Office No. 827, 8th Floor, Puri Business Hub,<br />
                        Sector 81, Faridabad
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <a href="tel:+918527881258" className="text-muted-foreground hover:text-primary transition-colors">
                        +91 8527881258
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <a href="mailto:etalba87@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                        info@albaenterprise.in
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={handleWhatsApp}
                    className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                  >
                    Chat on WhatsApp
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = "mailto:etalba87@gmail.com"}
                  >
                    Get Free Quote
                  </Button>
                </div>

                {/* Map */}
                <div className="mt-8 rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3510.8891234567890!2d77.3712345!3d28.3912345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDIzJzI4LjQiTiA3N8KwMjInMTYuNCJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Alba Enterprise Location"
                  />
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-card p-8 rounded-lg shadow-lg border">
                  <h2 className="text-3xl font-bold mb-2">Send us a Message</h2>
                  <p className="text-muted-foreground mb-6">Upload your CV for future job opportunities</p>
                  
                  {success ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Query Submitted!</h3>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll contact you soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your name"
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@example.com"
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 XXXXXXXXXX"
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <Label htmlFor="message">Your Message *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us about your requirements..."
                          rows={4}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cv">Upload CV (Optional - PDF or DOC, max 5MB)</Label>
                        <div className="mt-2">
                          <label
                            htmlFor="cv"
                            className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              errors.cv 
                                ? "border-destructive bg-destructive/5" 
                                : cvFile 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center py-4">
                              <Upload className={`w-6 h-6 mb-2 ${cvFile ? "text-primary" : "text-muted-foreground"}`} />
                              {cvFile ? (
                                <p className="text-sm text-primary font-medium">{cvFile.name}</p>
                              ) : (
                                <>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Click to upload</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">PDF or DOC (max 5MB)</p>
                                </>
                              )}
                            </div>
                            <input
                              id="cv"
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {errors.cv && <p className="text-sm text-destructive mt-1">{errors.cv}</p>}
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
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