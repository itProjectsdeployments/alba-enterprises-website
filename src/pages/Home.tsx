import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Award,
  Users,
  MapPin,
  Building2,
  ChevronRight,
  CheckCircle,
  ShieldCheck,
  Clock,
  UserCheck,
  Handshake,
  FileText,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import ScopeNotice from "@/components/ScopeNotice";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DEPARTMENTS, HIRING_LEVELS, SITE } from "@/lib/site";
import directorImage from "@/assets/azam-ali-khan.png";
import heroImage from "@/assets/industry-hospitality.jpg";
import teamCollaborationImage from "@/assets/hero-recruitment.jpg";
import ctaNextStepBg from "@/assets/cta-home-next-step.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const FAQS = [
  {
    q: "Which locations do you recruit for?",
    a: "We recruit for hotels and hospitality businesses across India, both metros and tier-2/3 cities, including resorts and leisure destinations.",
  },
  {
    q: "Which positions can you hire for?",
    a: "Front Office, Housekeeping, Laundry, F&B Production (kitchen), F&B Service and Maintenance, at junior, supervisory, managerial and senior levels.",
  },
  {
    q: "How quickly can you share candidates?",
    a: "It depends on the role and location. For most junior and supervisory positions we start sharing suitable, pre-screened profiles within a few working days of the brief.",
  },
  {
    q: "Can you handle bulk hiring or a new hotel opening?",
    a: "Yes. We support bulk and pre-opening hiring across multiple departments, coordinated through a single point of contact.",
  },
  {
    q: "Do you recruit candidates for jobs outside India?",
    a: "No. Our recruitment services cover hospitality roles within India only. Our international work is limited to HR consultancy and visa guidance & documentation assistance.",
  },
];

const Home = () => {
  const stats = [
    { icon: Award, label: "Years of Experience", value: "10+" },
    { icon: Building2, label: "Hospitality Hiring Partners", value: "50+" },
    { icon: Users, label: "Professionals Placed", value: "1000+" },
    { icon: MapPin, label: "Coverage", value: "Pan-India" },
  ];

  const reasons = [
    { icon: Briefcase, title: "Hospitality-only focus", text: "We recruit exclusively for hotels and hospitality businesses, so we understand the roles, grooming standards and shift realities." },
    { icon: UserCheck, title: "Pre-screened shortlists", text: "Every profile is checked for experience, skills and availability before it reaches you, so you interview only relevant candidates." },
    { icon: Clock, title: "Fast turnaround", text: "An active candidate pool across departments helps us share relevant profiles quickly, including for urgent and bulk openings." },
    { icon: Handshake, title: "Support until joining", text: "We coordinate interviews, offers and joining dates, and follow up after joining to make sure the placement works." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Hotel & Hospitality Recruitment Agency in India | Alba Enterprise"
        description="Alba Enterprise is a pan-India hotel and hospitality recruitment agency hiring Front Office, Housekeeping, Laundry, F&B Production, F&B Service and Maintenance staff from junior to senior level."
        path="/"
        jsonLd={[{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }, {
          "@context": "https://schema.org",
          "@type": "EmploymentAgency",
          name: SITE.name,
          url: SITE.url,
          logo: `${SITE.url}/og-image.jpg`,
          description: "Pan-India hotel and hospitality recruitment agency, with HR consultancy and visa documentation assistance.",
          areaServed: { "@type": "Country", name: "India" },
          address: {
            "@type": "PostalAddress",
            streetAddress: "Office No. 827, 8th Floor, Puri Business Hub, Sector 81",
            addressLocality: "Faridabad",
            addressRegion: "Haryana",
            addressCountry: "IN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+918527881258",
            contactType: "customer service",
            email: SITE.email,
            areaServed: "IN",
          },
        }]}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Hotel kitchen and service team" className="w-full h-full object-cover" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/85 to-primary-dark/40" />
        </div>
        <div className="container mx-auto px-4 relative z-10 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-white"
          >
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-accent mb-5">
              {SITE.tagline}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Right People for Every Department of Your Hotel
            </h1>
            <p className="text-lg text-white/85 mb-8">
              Alba Enterprise helps hotels, resorts, restaurants and hospitality groups across India hire
              reliable staff, from junior associates to senior managers, across Front Office, Housekeeping,
              Laundry, F&B and Maintenance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/hire-staff">
                  Submit a Hiring Requirement
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent text-white border-white/60 hover:bg-white hover:text-primary">
                <Link to="/vacancies">Browse Hotel Jobs</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/85">
              {["Junior to senior-level hiring", "6 core hotel departments", "Clients across India"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 px-4 text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="max-w-2xl mb-12">
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">What we recruit for</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Hotel Departments We Specialise In</h2>
            <p className="text-lg text-muted-foreground">
              We focus on the six departments that keep a hotel running, which lets us know the roles,
              the skills and the right candidates.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPARTMENTS.map((dept, index) => (
              <motion.div
                key={dept.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group bg-card border rounded-xl p-6 hover:shadow-lg hover:border-primary/40 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <dept.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{dept.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{dept.summary}</p>
                <p className="text-sm text-foreground/80">
                  {dept.roles.slice(0, 4).join(" · ")}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10">
            <Button variant="outline" asChild>
              <Link to="/industries">
                View all roles by department <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hiring levels */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Hiring at Every Level</h2>
            <p className="text-primary-foreground/85">From your first-line team to department heads.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIRING_LEVELS.map((level, i) => (
              <motion.div
                key={level.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl bg-white/10 border border-white/15 p-6"
              >
                <div className="text-accent font-bold text-sm mb-2">0{i + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{level.title}</h3>
                <p className="text-sm text-primary-foreground/80">{level.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">Why hotels choose us</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">A Recruitment Partner That Understands Hospitality</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {reasons.map((r) => (
                  <div key={r.title}>
                    <r.icon className="w-7 h-7 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeUp}>
              <img
                src={teamCollaborationImage}
                alt="Alba Enterprise recruitment team meeting a hospitality client"
                className="rounded-xl shadow-2xl w-full"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Director */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[2fr_3fr] gap-12 items-center max-w-5xl mx-auto">
            <motion.div {...fadeUp}>
              <img
                src={directorImage}
                alt="Azam Ali Khan, Founder and Director of Alba Enterprise"
                className="rounded-xl shadow-xl w-full max-w-sm mx-auto"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
            <motion.div {...fadeUp}>
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">Leadership</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Azam Ali Khan</h2>
              <p className="text-lg text-primary font-semibold mb-5">Founder & Director</p>
              <p className="text-lg text-muted-foreground mb-6">
                With more than a decade in recruitment and HR, Azam Ali Khan founded Alba Enterprise in{" "}
                {SITE.foundedYear} to build a recruitment firm known for honesty and follow-through. Today he leads the
                team's work helping hospitality businesses across India find dependable staff, and helps
                hospitality professionals take the next step in their careers.
              </p>
              <Button asChild>
                <Link to="/about">More About Us</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="max-w-2xl mb-10">
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">Additional services</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">HR Consultancy & Visa Documentation</h2>
            <p className="text-lg text-muted-foreground">
              Besides domestic recruitment, we offer advisory and documentation services for businesses and individuals.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp} className="bg-card border rounded-xl p-8">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">HR Consultancy</h3>
              <p className="text-muted-foreground mb-4">
                Advisory support for Indian and international businesses: workforce planning, job descriptions,
                HR policies, SOPs and hiring process design.
              </p>
              <Link to="/services#hr-consultancy" className="text-primary font-medium inline-flex items-center hover:underline">
                Learn more <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...fadeUp} className="bg-card border rounded-xl p-8">
              <FileText className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Visa Guidance & Documentation</h3>
              <p className="text-muted-foreground mb-4">
                Help with visa paperwork, document checklists, attestation and travel bookings. We assist with the
                documentation process only.
              </p>
              <Link to="/services#visa" className="text-primary font-medium inline-flex items-center hover:underline">
                Learn more <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </motion.div>
          </div>
          <ScopeNotice className="mt-6" />
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Gallery</h2>
            <p className="text-lg text-muted-foreground">Our team at industry events, HR forums and client meetings</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[gallery2, gallery3, gallery4, gallery5, gallery6].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative group overflow-hidden rounded-xl shadow-lg aspect-[4/3]"
              >
                <img
                  src={image}
                  alt={`Alba Enterprise team at an industry event, photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
          <motion.div {...fadeUp} className="bg-card border rounded-2xl p-8 shadow-sm">
            <Building2 className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">Hiring for Your Hotel?</h3>
            <p className="text-muted-foreground mb-6">
              Tell us the role, the number of positions and the location. Our team will call you to discuss
              the requirement and start sharing suitable profiles.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/hire-staff">Submit Requirement</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp Us</a>
              </Button>
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="bg-card border rounded-2xl p-8 shadow-sm">
            <Users className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">Looking for a Hotel Job in India?</h3>
            <p className="text-muted-foreground mb-6">
              Browse current openings with hotels and hospitality businesses across India, or send us your CV
              so we can contact you when a suitable role opens.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/vacancies">Browse Vacancies</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact?type=job-seeker">Submit Your CV</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          </motion.div>
          <Accordion type="single" collapsible className="bg-card border rounded-xl px-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className={i === FAQS.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <img src={ctaNextStepBg} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary-dark/95" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Let's Build Your Hotel Team</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Speak to our recruitment team about your current openings. Single positions, bulk hiring and
              new property openings are all welcome.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/hire-staff">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent text-white border-white/60 hover:bg-white hover:text-primary">
                <a href={SITE.phoneHref}>Call {SITE.phoneDisplay}</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Home;
