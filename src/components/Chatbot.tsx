import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, ChevronDown, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SITE, formatEnquiryMessage, type EnquiryType } from "@/lib/site";
import { submitEnquiry } from "@/lib/enquiries";
import SubmitFallback from "@/components/SubmitFallback";

const faqs = [
  {
    question: "What does Alba Enterprise do?",
    answer:
      "We are a hotel & hospitality recruitment agency serving clients across India. We hire for Front Office, Housekeeping, Laundry, F&B Production, F&B Service and Maintenance, from junior to senior level.",
  },
  {
    question: "Do you recruit for jobs abroad?",
    answer:
      "No. We recruit for hospitality roles within India only. Our international services are limited to HR consultancy and visa guidance & documentation assistance.",
  },
  {
    question: "How do I submit a hiring requirement?",
    answer: "Use our Hire Staff form. It takes about two minutes, and a recruiter will call you back.",
    link: { to: "/hire-staff", text: "Open Hire Staff form" },
  },
  {
    question: "How can I apply for a hotel job?",
    answer: "Browse current openings on our Hotel Jobs page, or send us your CV so we can contact you when a suitable role opens.",
    link: { to: "/vacancies", text: "View hotel jobs" },
  },
];

const PURPOSES: { label: string; type: EnquiryType }[] = [
  { label: "Hire staff", type: "Hiring Requirement" },
  { label: "Find a job", type: "Job Seeker" },
  { label: "Visa / documents", type: "Visa & Documentation" },
  { label: "Other", type: "General" },
];

const Chatbot = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [purpose, setPurpose] = useState<EnquiryType>("General");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", requirement: "" });
  const [fallback, setFallback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallback(null);
    if (formData.phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await submitEnquiry({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || "Not provided",
        message: formatEnquiryMessage(purpose, { Source: "Website chat widget" }, formData.requirement),
      });
      setDone(true);
      setFormData({ name: "", phone: "", email: "", requirement: "" });
    } catch (err: any) {
      console.error(err);
      setFallback(
        `Name: ${formData.name}\nPhone: ${formData.phone}${formData.email ? `\nEmail: ${formData.email}` : ""}\n[${purpose}]\n\n${formData.requirement}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setShowForm(false); setDone(false); };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="bg-primary text-primary-foreground p-4">
              <h3 className="font-semibold text-lg">{SITE.name}</h3>
              <p className="text-sm opacity-90">Hospitality recruitment across India. How can we help?</p>
            </div>

            <div className="p-4 max-h-[26rem] overflow-y-auto">
              {done ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold mb-1">Thanks, we've got your message.</p>
                  <p className="text-sm text-muted-foreground mb-4">Our team will contact you shortly.</p>
                  <Button variant="outline" size="sm" onClick={reset}>Back</Button>
                </div>
              ) : !showForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Quick answers</p>
                    {faqs.map((faq, index) => (
                      <div key={faq.question} className="bg-muted rounded-lg">
                        <button
                          className="w-full flex items-center justify-between text-left text-sm p-3"
                          onClick={() => setOpenFaq(openFaq === index ? null : index)}
                          aria-expanded={openFaq === index}
                        >
                          {faq.question}
                          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                        </button>
                        {openFaq === index && (
                          <div className="px-3 pb-3 text-sm text-muted-foreground">
                            {faq.answer}
                            {faq.link && (
                              <Link to={faq.link.to} onClick={() => setIsOpen(false)} className="block mt-2 text-primary font-medium hover:underline">
                                {faq.link.text} →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button onClick={() => setShowForm(true)} className="w-full">Leave a Message</Button>
                    <Button onClick={() => window.open(SITE.whatsappHref, "_blank")} className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white">
                      Continue on WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">I want to…</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PURPOSES.map((p) => (
                        <button
                          type="button"
                          key={p.type}
                          onClick={() => setPurpose(p.type)}
                          className={`text-sm rounded-md border px-2 py-1.5 transition-colors ${purpose === p.type ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Your name *" aria-label="Your name" />
                  <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone / WhatsApp *" aria-label="Phone" />
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email (optional)" aria-label="Email" />
                  <Textarea required value={formData.requirement} onChange={(e) => setFormData({ ...formData, requirement: e.target.value })} placeholder="How can we help? *" rows={3} aria-label="Message" />
                  {fallback && <SubmitFallback compact subject={`Website chat – ${formData.name}`} text={fallback} />}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Back</Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send</>}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
