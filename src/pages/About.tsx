import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Target, Eye, Heart, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import PageHero from "@/components/PageHero";
import ScopeNotice from "@/components/ScopeNotice";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import directorImage from "@/assets/azam-ali-khan.png";
import aboutHeroImage from "@/assets/about-hero-bg.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Mission",
      description:
        "To help hospitality businesses across India build dependable teams by matching them with skilled, well-screened candidates through an honest and efficient recruitment process.",
    },
    {
      icon: Eye,
      title: "Vision",
      description:
        "To be India's most trusted hospitality recruitment partner, known for the quality of our shortlists and the long-term success of our placements.",
    },
    {
      icon: Heart,
      title: "Values",
      description:
        "Integrity, transparency, responsiveness and respect for every client and candidate we work with.",
    },
  ];

  const forHotels = [
    "Recruiters who know hotel departments and roles",
    "Pre-screened profiles matched to your brief",
    "Interview scheduling and candidate coordination",
    "Support for single, bulk and pre-opening hiring",
    "Follow-up after joining",
    "One dedicated point of contact",
  ];

  const forCandidates = [
    "Genuine openings with hospitality employers in India",
    "Honest guidance on roles, salary and growth",
    "Opportunities from junior to senior level",
    "Clear communication at every stage",
    "Your profile shared only with relevant employers",
    "Support through interview and joining",
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Alba Enterprise | Hospitality Recruitment Agency in India"
        description="Alba Enterprise is a Faridabad-based hospitality recruitment agency serving hotels and hospitality businesses across India since 2013, with additional HR consultancy and visa documentation services."
        path="/about"
      />
      <Navbar />

      <div className="pt-20">
        <PageHero
          image={aboutHeroImage}
          imageAlt="Alba Enterprise office team"
          eyebrow="About us"
          title="Hospitality Recruitment, Done Right"
          subtitle={`Since ${SITE.foundedYear}, Alba Enterprise has helped hospitality businesses find dependable people and helped hospitality professionals find the right workplace.`}
        />

        {/* Story */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-12 max-w-5xl mx-auto">
              <motion.div {...fadeUp}>
                <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary mb-3">Our story</p>
                <h2 className="text-3xl md:text-4xl font-bold">Built on trust and follow-through</h2>
              </motion.div>
              <motion.div {...fadeUp} className="space-y-5 text-lg text-muted-foreground">
                <p>
                  Alba Enterprise was founded in {SITE.foundedYear} by Azam Ali Khan with a simple idea: recruitment
                  should be honest, quick and personal. From our office in Faridabad, we work with hotels, resorts,
                  restaurants and hospitality groups across India.
                </p>
                <p>
                  We specialise in hospitality. Our team recruits for Front Office, Housekeeping, Laundry,
                  F&B Production, F&B Service and Maintenance, from entry-level associates to department heads.
                  Because we focus on one industry, we understand the roles, the standards and what makes a
                  candidate succeed in them.
                </p>
                <p>
                  Alongside recruitment, we offer HR consultancy and visa guidance & documentation assistance
                  for businesses and individuals who need help with paperwork and process.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission / Vision / Values */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card rounded-xl border p-8"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8">
              {[
                { title: "Why Hotels Work With Us", items: forHotels },
                { title: "Why Hospitality Professionals Choose Us", items: forCandidates },
              ].map((col) => (
                <motion.div key={col.title} {...fadeUp} className="bg-card p-8 rounded-xl border">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6">{col.title}</h2>
                  <ul className="space-y-3">
                    {col.items.map((reason) => (
                      <li key={reason} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <ScopeNotice className="mt-8" />
          </div>
        </section>

        {/* Director */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
              <img
                src={directorImage}
                alt="Azam Ali Khan, Founder and Director of Alba Enterprise"
                className="w-40 h-40 rounded-full mx-auto mb-6 shadow-xl object-cover"
                loading="lazy"
                decoding="async"
              />
              <h3 className="text-2xl font-bold mb-1">Azam Ali Khan</h3>
              <p className="text-primary font-semibold mb-5">Founder & Director</p>
              <blockquote className="text-muted-foreground text-lg italic">
                "We measure our success by how long our candidates stay and grow with the employers we place them
                with. Every hotel deserves a team it can rely on, and every professional deserves a workplace where
                they can do their best work."
              </blockquote>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to talk?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Share your hiring requirement or send us your CV, and our team will get back to you shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild><Link to="/hire-staff">Hire Staff</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/contact?type=job-seeker">Submit Your CV</Link></Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default About;
