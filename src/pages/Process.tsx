import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ClipboardList, Search, UserCheck, Video, FileSignature, HeartHandshake } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import processHeroImage from "@/assets/process-hero.jpg";
import ctaGetStartedBg from "@/assets/cta-process-get-started.jpg";

const Process = () => {
  const steps = [
    {
      icon: ClipboardList,
      title: "Requirement Briefing",
      description:
        "We discuss the role, department, level, property location, salary budget, shift pattern and joining timeline so we understand exactly who you need.",
    },
    {
      icon: Search,
      title: "Sourcing",
      description:
        "We search our hospitality candidate database and networks for professionals with the right experience, including candidates who are not actively applying.",
    },
    {
      icon: UserCheck,
      title: "Screening & Shortlisting",
      description:
        "Candidates are screened for experience, skills, communication, grooming and availability. You receive only relevant, pre-checked profiles.",
    },
    {
      icon: Video,
      title: "Interview Coordination",
      description:
        "We schedule telephonic, video or in-person interviews and trade tests, brief candidates beforehand and collect feedback afterwards.",
    },
    {
      icon: FileSignature,
      title: "Offer & Joining",
      description:
        "We help close the offer, coordinate documents and notice periods, and keep in touch with the candidate until they join.",
    },
    {
      icon: HeartHandshake,
      title: "Post-Joining Follow-Up",
      description:
        "We check in with both you and the candidate after joining to make sure the placement is working, with replacement support as per agreed terms.",
    },
  ];

  const candidateSteps = [
    { title: "Apply or send your CV", text: "Apply for a listed vacancy or submit your CV through our website or WhatsApp." },
    { title: "Screening call", text: "A recruiter calls you to understand your experience, preferences and expectations." },
    { title: "Interview", text: "If there is a match, we arrange your interview with the hotel and help you prepare." },
    { title: "Offer & joining", text: "We stay in touch through the offer and joining process." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Hospitality Recruitment Process | Alba Enterprise"
        description="How Alba Enterprise recruits for hotels in India: requirement briefing, sourcing, screening, interview coordination, offer and joining, and post-joining follow-up."
        path="/process"
      />
      <Navbar />

      <div className="pt-20">
        <PageHero
          image={processHeroImage}
          imageAlt="Recruiter reviewing candidate profiles"
          eyebrow="How we work"
          title="A Clear, Six-Step Hiring Process"
          subtitle="A structured process that respects your time. You get relevant candidates, regular updates and support until your new team member joins."
        />

        {/* Steps */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">For hotels & employers</p>
              <h2 className="text-3xl md:text-4xl font-bold">From Brief to Joining</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="relative bg-card border rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-primary/15">0{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-10 max-w-2xl mx-auto">
              Timelines depend on the role, level and location. For most junior and supervisory positions we start
              sharing suitable profiles within a few working days of the brief.
            </p>
          </div>
        </section>

        {/* Candidate journey */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">For job seekers</p>
              <h2 className="text-3xl md:text-4xl font-bold">Your Path to a Hotel Job in India</h2>
            </div>
            <ol className="grid md:grid-cols-4 gap-6">
              {candidateSteps.map((s, i) => (
                <li key={s.title} className="bg-card border rounded-xl p-6">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="text-center mt-10">
              <Button asChild size="lg"><Link to="/vacancies">See Current Openings</Link></Button>
            </div>
          </div>
        </section>

        {/* CTA */}
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
                <img src={ctaGetStartedBg} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary-dark/95" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Have an Opening to Fill?</h2>
                <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                  Share your requirement in two minutes and our team will call you back.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild><Link to="/hire-staff">Submit Requirement</Link></Button>
                  <Button size="lg" variant="outline" asChild className="bg-transparent text-white border-white/60 hover:bg-white hover:text-primary">
                    <a href={SITE.phoneHref}>Call {SITE.phoneDisplay}</a>
                  </Button>
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
