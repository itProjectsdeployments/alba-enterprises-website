import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    requirement: "",
  });

  const faqs = [
    { question: "What services do you offer?", answer: "We offer recruitment, visa services, holiday packages, air ticketing, and education assistance." },
    { question: "Which countries do you work with?", answer: "We specialize in European countries recruitment and deployment services." },
    { question: "How long does the process take?", answer: "The typical process takes 3-6 months depending on the country and visa requirements." },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:etalba87@gmail.com?subject=Inquiry from ${formData.name}&body=Name: ${formData.name}%0D%0APhone: ${formData.phone}%0D%0ARequirement: ${formData.requirement}`;
    window.location.href = mailtoLink;
    
    toast({
      title: "Query Submitted!",
      description: "We'll get back to you shortly.",
    });
    setFormData({ name: "", phone: "", requirement: "" });
    setShowForm(false);
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/918527881258", "_blank");
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Open chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card border rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4">
              <h3 className="font-semibold text-lg">Alba Enterprise</h3>
              <p className="text-sm opacity-90">How can we help you today?</p>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {!showForm ? (
                <div className="space-y-4">
                  {/* FAQs */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Quick Questions:</p>
                    {faqs.map((faq, index) => (
                      <button
                        key={index}
                        className="w-full text-left text-sm p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        onClick={() => {
                          toast({
                            title: faq.question,
                            description: faq.answer,
                          });
                        }}
                      >
                        {faq.question}
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4">
                    <Button
                      onClick={() => setShowForm(true)}
                      className="w-full"
                      variant="default"
                    >
                      Submit Your Query
                    </Button>
                    <Button
                      onClick={handleWhatsApp}
                      className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                    >
                      Continue on WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="chat-name" className="block text-sm font-medium mb-1">
                      Name *
                    </label>
                    <Input
                      id="chat-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="chat-phone" className="block text-sm font-medium mb-1">
                      Phone *
                    </label>
                    <Input
                      id="chat-phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="chat-requirement" className="block text-sm font-medium mb-1">
                      Requirement *
                    </label>
                    <Textarea
                      id="chat-requirement"
                      required
                      value={formData.requirement}
                      onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                      placeholder="Tell us your requirement..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      <Send className="w-4 h-4 mr-2" />
                      Send
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
