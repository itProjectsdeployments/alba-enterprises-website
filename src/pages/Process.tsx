import { motion } from "framer-motion";
import { FileText, Video, Heart, FileCheck, FileSignature, Plane } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import processHeroImage from "@/assets/process-hero.jpg";
import cvSelectionImage from "@/assets/process-cv-selection.jpg";
import interviewImage from "@/assets/process-interview.jpg";
import medicalImage from "@/assets/process-medical.jpg";
import visaImage from "@/assets/process-visa.jpg";
import attestationImage from "@/assets/process-attestation.jpg";
import emigrationImage from "@/assets/process-emigration.jpg";
import processTimelineBg from "@/assets/process-timeline-bg.jpg";
import ctaGetStartedBg from "@/assets/cta-process-get-started.jpg";

const Process = () => {
  const steps = [
    {
      icon: FileText,
      image: cvSelectionImage,
      title: "CV Selection",
      description: "Comprehensive CV screening and candidate shortlisting based on employer requirements, qualifications, skills and overseas job eligibility.",
    },
    {
      icon: Video,
      image: interviewImage,
      title: "Interview Mode",
      description: "Technical and HR interviews are conducted to evaluate professional skills, communication abilities and suitability for international employment.",
    },
    {
      icon: Heart,
      image: medicalImage,
      title: "Medical Check-up",
      description: "Candidates undergo complete medical examinations according to destination country regulations before visa approval.",
    },
    {
      icon: FileCheck,
      image: visaImage,
      title: "VISA Process Services",
      description: "Complete work visa processing including documentation, embassy submission, visa stamping and application tracking.",
    },
    {
      icon: FileSignature,
      image: attestationImage,
      title: "Document Attestation",
      description: "Educational, professional and personal documents are authenticated and attested according to destination country requirements.",
    },
    {
      icon: Plane,
      image: emigrationImage,
      title: "Emigration Services",
      description: "We provide complete emigration clearance, travel guidance and pre-departure orientation for a smooth overseas transition.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
       title="International Recruitment Process | Overseas Job Placement | Alba Enterprise"

      description="Learn Alba Enterprise's step-by-step international recruitment process including CV selection, 
      interviews, medical examination, work visa processing, document attestation and overseas emigration support."
        path="/process"
      />
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={processHeroImage} alt="International recruitment process for overseas jobs by Alba Enterprise" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">International Recruitment Process</h1>
              <p className="text-lg opacity-90">
                Our proven six-step international recruitment process ensures quality overseas placements, work visa compliance and smooth candidate onboarding.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Process Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-20 w-0.5 h-full bg-primary/20 -z-10" />
                  )}

                  <div className="flex flex-col md:flex-row gap-6 mb-12">
                    {/* Step Image and Number */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img 
                          src={step.image} 
                          alt={ step.title === "CV Selection"
                          ? "CV selection for international recruitment"
                          : step.title === "Interview Mode"
                          ? "Candidate interview process for overseas jobs"
                          : step.title === "Medical Check-up"
                          ? "Medical examination for overseas employment"
                          : step.title === "VISA Process Services"
                          ? "Work visa processing and visa stamping"
                          : step.title === "Document Attestation"
                          ? "Document attestation for international employment"
                          : "Emigration services for overseas job placement"
                      }
                          className="w-full md:w-64 h-48 object-cover rounded-lg shadow-lg"
                         loading="lazy" decoding="async" />
                        <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                          {index + 1}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-primary/90 p-3 rounded-lg">
                          <step.icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-lg text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Duration */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0">
            <img src={processTimelineBg} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center bg-background/95 backdrop-blur-sm p-12 rounded-2xl shadow-xl"
            >
              <h2 className="text-3xl font-bold mb-6">International Recruitment Timeline</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Our international recruitment process generally takes <strong>3–6 months</strong> depending on the destination country,
                 employer requirements, visa approval timelines and document verification procedures.
              </p>
              <p className="text-lg text-muted-foreground">
                Throughout the recruitment journey, Alba Enterprise provides regular updates, documentation support and complete guidance to both employers and overseas job candidates.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative text-primary-foreground rounded-2xl p-12 text-center overflow-hidden"
            >
              <div className="absolute inset-0">
                <img src={ctaGetStartedBg} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/90" />
              </div>
              <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Overseas Career?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Whether you are an employer looking for skilled manpower or a professional seeking overseas employment, our international recruitment team is ready to assist you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+918527881258"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors"
                >
                  Call +91 8527881258
                </a>
                <a
                  href="mailto:info@albaenterprise.in"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
                >
                  Email Us
                </a>
              </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Process;
