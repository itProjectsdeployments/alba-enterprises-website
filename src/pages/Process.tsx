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
      description: "Comprehensive review and shortlisting of candidate profiles based on job requirements and qualifications.",
    },
    {
      icon: Video,
      image: interviewImage,
      title: "Interview Mode",
      description: "Structured interviews conducted to assess technical skills, experience, and cultural fit.",
    },
    {
      icon: Heart,
      image: medicalImage,
      title: "Medical Check-up",
      description: "Complete medical examination as per destination country requirements to ensure fitness for work.",
    },
    {
      icon: FileCheck,
      image: visaImage,
      title: "VISA Process Services",
      description: "End-to-end visa application support including documentation, submission, and follow-up.",
    },
    {
      icon: FileSignature,
      image: attestationImage,
      title: "Document Attestation",
      description: "Authentication and attestation of all required documents from relevant authorities.",
    },
    {
      icon: Plane,
      image: emigrationImage,
      title: "Emigration Services",
      description: "Complete emigration clearance and pre-departure orientation for smooth transition.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Recruitment Process | Alba Enterprises"
        description="From CV selection and interviews to medical, visa, attestation and emigration — see Alba Enterprises' transparent end-to-end recruitment process."
        path="/process"
      />
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={processHeroImage} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Recruitment Process</h1>
              <p className="text-lg opacity-90">
                Our streamlined 6-step process ensures quality placements and compliance
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
                          alt={step.title}
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
              <h2 className="text-3xl font-bold mb-6">Process Timeline</h2>
              <p className="text-lg text-muted-foreground mb-4">
                The complete recruitment process typically takes <strong>3 to 6 months</strong>, 
                depending on the destination country, visa requirements, and document processing times.
              </p>
              <p className="text-lg text-muted-foreground">
                We maintain transparent communication throughout the process and provide regular 
                updates to both employers and candidates.
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
                Ready to Get Started?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Let us guide you through our proven recruitment process. 
                Contact us today to begin your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+919599591769"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors"
                >
                  Call +91 9599591769
                </a>
                <a
                  href="mailto:info@albaenterprises.co.in"
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
