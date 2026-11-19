import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Hotel, UtensilsCrossed, PartyPopper, Building } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS, HIRING_LEVELS, SITE } from "@/lib/site";
import industriesHeroImage from "@/assets/industry-hospitality.jpg";
import ctaIndustriesTalent from "@/assets/cta-industries-talent.jpg";

const Industries = () => {
  const clientTypes = [
    { icon: Hotel, title: "Hotels & Resorts", text: "Business hotels, luxury and boutique properties, and leisure resorts." },
    { icon: UtensilsCrossed, title: "Restaurants & Cafés", text: "Fine dining, casual dining, QSR chains and cloud kitchens." },
    { icon: PartyPopper, title: "Banquets & Catering", text: "Banquet halls, event venues and institutional catering." },
    { icon: Building, title: "Clubs & Serviced Apartments", text: "Clubs, serviced apartments and corporate guest houses." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Hotel Departments & Roles We Recruit For | Alba Enterprise"
        description="Hotel recruitment across India for Front Office, Housekeeping, Laundry, F&B Production, F&B Service and Maintenance, from junior to senior level."
        path="/industries"
      />
      <Navbar />

      <div className="pt-20">
        <PageHero
          image={industriesHeroImage}
          imageAlt="Hotel kitchen and service professionals"
          eyebrow="Departments & roles"
          title="Specialists in Hotel & Hospitality Hiring"
          subtitle="We recruit across six core hotel departments for properties throughout India, from entry-level associates to department heads."
        />

        {/* Departments */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEPARTMENTS.map((dept, index) => (
                <motion.div
                  key={dept.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-card border rounded-xl p-6 hover:shadow-lg hover:border-primary/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-4">
                    <dept.icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{dept.title}</h2>
                  <p className="text-muted-foreground mb-5">{dept.summary}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Typical roles</p>
                  <ul className="grid grid-cols-1 gap-1.5">
                    {dept.roles.map((role) => (
                      <li key={role} className="text-sm text-muted-foreground flex items-start">
                        <span className="text-accent mr-2 font-bold">•</span>
                        {role}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-10">
              Don't see your role? We regularly hire for related positions too.{" "}
              <Link to="/hire-staff" className="text-primary font-medium hover:underline">Tell us what you need.</Link>
            </p>
          </div>
        </section>

        {/* Levels */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Junior to Senior-Level Hiring</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HIRING_LEVELS.map((level) => (
                <div key={level.title} className="rounded-xl bg-white/10 border border-white/15 p-6">
                  <h3 className="text-lg font-semibold mb-2">{level.title}</h3>
                  <p className="text-sm text-primary-foreground/80">{level.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who we serve */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">Who we work with</p>
              <h2 className="text-3xl md:text-4xl font-bold">Hospitality Businesses Across India</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {clientTypes.map((c) => (
                <div key={c.title} className="text-center p-6">
                  <c.icon className="w-10 h-10 mx-auto text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="relative text-primary-foreground rounded-2xl p-12 text-center overflow-hidden">
              <div className="absolute inset-0">
                <img src={ctaIndustriesTalent} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary-dark/95" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Staff for Your Property?</h2>
                <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                  Whether it's one chef or a full pre-opening team, our recruiters are ready to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild><Link to="/hire-staff">Submit Requirement</Link></Button>
                  <Button size="lg" variant="outline" asChild className="bg-transparent text-white border-white/60 hover:bg-white hover:text-primary">
                    <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Industries;
