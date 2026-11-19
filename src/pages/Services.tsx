import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Users, Briefcase, FileCheck, FileSignature, Plane, CheckCircle, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import PageHero from "@/components/PageHero";
import ScopeNotice from "@/components/ScopeNotice";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import recruitmentImage from "@/assets/industry-hospitality.jpg";
import consultancyImage from "@/assets/home-team-collaboration.jpg";
import visaImage from "@/assets/service-visa.jpg";
import attestationImage from "@/assets/process-attestation.jpg";
import bookingImage from "@/assets/service-booking.jpg";
import servicesHeroImage from "@/assets/services-hero.jpg";

interface Service {
  id: string;
  icon: LucideIcon;
  image: string;
  imageAlt: string;
  label: string;
  title: string;
  description: string;
  features: string[];
  note?: string;
  cta: { text: string; to: string };
}

const Services = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [hash]);

  const services: Service[] = [
    {
      id: "recruitment",
      icon: Users,
      image: recruitmentImage,
      imageAlt: "Hotel kitchen and service staff",
      label: "Core service · India",
      title: "Hotel & Hospitality Recruitment",
      description:
        "Our core business. We recruit for hotels, resorts, restaurants, banquets and hospitality groups across India, for single positions, bulk hiring and new property openings.",
      features: [
        "Front Office, Housekeeping, Laundry, F&B Production, F&B Service and Maintenance",
        "Junior, supervisory, managerial and senior-level hiring",
        "Requirement briefing, sourcing and pre-screening",
        "Interview scheduling and candidate coordination",
        "Offer, joining and post-joining follow-up",
      ],
      cta: { text: "Submit a Hiring Requirement", to: "/hire-staff" },
    },
    {
      id: "hr-consultancy",
      icon: Briefcase,
      image: consultancyImage,
      imageAlt: "HR consultants in a planning meeting",
      label: "Advisory · India & international",
      title: "HR Consultancy",
      description:
        "Advisory support for businesses in India and abroad that want stronger HR foundations. This is a consulting service: we advise on process and documentation, and it does not include candidate sourcing or placement outside India.",
      features: [
        "Manpower planning and organisation structure",
        "Job descriptions and role frameworks",
        "HR policies, employee handbooks and SOPs",
        "Recruitment process and interview framework design",
        "Salary benchmarking for hospitality roles in India",
        "Onboarding and training plans",
      ],
      cta: { text: "Discuss HR Consultancy", to: "/contact?type=hr-consultancy" },
    },
    {
      id: "visa",
      icon: FileCheck,
      image: visaImage,
      imageAlt: "Passport and visa application documents",
      label: "Documentation support",
      title: "Visa Guidance & Documentation Assistance",
      description:
        "We help individuals and businesses prepare and organise visa paperwork correctly, which reduces errors and delays in the application process.",
      features: [
        "Visa guidance and eligibility checklists",
        "Document preparation and review",
        "Application form-filling assistance",
        "Appointment scheduling support",
        "Application status follow-up",
      ],
      note: "We assist with documentation only. Visa decisions are made solely by the relevant embassy or consulate, and we do not arrange overseas employment.",
      cta: { text: "Ask About Visa Documentation", to: "/contact?type=visa" },
    },
    {
      id: "attestation",
      icon: FileSignature,
      image: attestationImage,
      imageAlt: "Document attestation stamps",
      label: "Documentation support",
      title: "Attestation & Documentation Support",
      description:
        "Guidance and support for getting educational, personal and commercial documents attested and ready for official use.",
      features: [
        "Educational certificate attestation guidance",
        "Personal and commercial document support",
        "Apostille process guidance",
        "Translation coordination where required",
      ],
      cta: { text: "Get Documentation Help", to: "/contact?type=visa" },
    },
    {
      id: "travel",
      icon: Plane,
      image: bookingImage,
      imageAlt: "Air ticket and travel booking",
      label: "Travel",
      title: "Travel-Related Services",
      description:
        "Convenient travel arrangements for business and personal trips, including domestic and international air tickets and hotel reservations.",
      features: [
        "Domestic and international air ticketing",
        "Hotel reservations",
        "Travel insurance guidance",
        "Itinerary assistance",
      ],
      cta: { text: "Enquire About Travel", to: "/contact?type=general" },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Services | Hospitality Recruitment, HR Consultancy & Visa Documentation | Alba Enterprise"
        description="Hotel and hospitality recruitment across India, plus HR consultancy, visa guidance and documentation assistance, attestation support and travel services from Alba Enterprise."
        path="/services"
      />
      <Navbar />

      <div className="pt-20">
        <PageHero
          image={servicesHeroImage}
          imageAlt="Alba Enterprise team at work"
          eyebrow="Our services"
          title="Recruitment First, Supported by Consultancy"
          subtitle="Hospitality recruitment within India is our core business. We also offer HR consultancy and visa documentation assistance to the businesses and individuals we work with."
        />

        {/* Quick nav */}
        <section className="border-b bg-card sticky top-20 z-30">
          <div className="container mx-auto px-4">
            <div className="flex gap-6 overflow-x-auto py-4 text-sm font-medium whitespace-nowrap">
              {services.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 space-y-20">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                id={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-12 items-center scroll-mt-40"
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">{service.label}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <service.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">{service.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">{service.description}</p>
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {service.note && (
                    <p className="text-sm text-muted-foreground border-l-4 border-accent pl-4 mb-6">{service.note}</p>
                  )}
                  <Button asChild>
                    <Link to={service.cta.to}>{service.cta.text}</Link>
                  </Button>
                </div>

                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="rounded-xl overflow-hidden shadow-xl aspect-[4/3]">
                    <img
                      src={service.image}
                      alt={service.imageAlt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            <ScopeNotice />
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Not sure which service you need?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Call or WhatsApp our team and we'll point you in the right direction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild><a href={SITE.phoneHref}>Call {SITE.phoneDisplay}</a></Button>
              <Button size="lg" variant="outline" asChild>
                <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Services;
