import { motion } from "framer-motion";
import { 
  Building2, 
  Wrench, 
  Factory, 
  Ship, 
  Droplet, 
  Heart, 
  Users, 
  HardHat,
  Utensils 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import industriesHeroImage from "@/assets/industries-hero.jpg";
import hospitalityImage from "@/assets/industry-hospitality.jpg";
import constructionImage from "@/assets/industry-construction.jpg";
import healthcareImage from "@/assets/industry-healthcare.jpg";
import manufacturingImage from "@/assets/industry-manufacturing.jpg";
import mechanicalImage from "@/assets/industry-mechanical.jpg";
import onshoreOffshoreImage from "@/assets/industry-onshore-offshore.jpg";
import marineImage from "@/assets/industry-marine.jpg";
import oilGasImage from "@/assets/industry-oil-gas.jpg";
import skilledUnskilledImage from "@/assets/industry-skilled-unskilled.jpg";
import industriesExpertiseBg from "@/assets/industries-expertise-bg.jpg";
import ctaIndustriesTalent from "@/assets/cta-industries-talent.jpg";

const Industries = () => {
  const industries = [
    {
      icon: Utensils,
      title: "Hospitality",
      roles: ["Chefs", "Commi Chef", "Restaurant Managers", "Waiters", "Housekeeping"],
      image: hospitalityImage,
    },
    {
      icon: HardHat,
      title: "Construction",
      roles: ["Civil Engineers", "Site Supervisors", "Masons", "Carpenters", "Electricians"],
      image: constructionImage,
    },
    {
      icon: Wrench,
      title: "Mechanical",
      roles: ["Mechanical Engineers", "Technicians", "Fitters", "Welders", "Maintenance Staff"],
      image: mechanicalImage,
    },
    {
      icon: Factory,
      title: "Manufacturing",
      roles: ["Production Managers", "Quality Controllers", "Machine Operators", "Assembly Workers"],
      image: manufacturingImage,
    },
    {
      icon: Building2,
      title: "Onshore/Offshore",
      roles: ["Project Managers", "Safety Officers", "Riggers", "Operators", "Supervisors"],
      image: onshoreOffshoreImage,
    },
    {
      icon: Ship,
      title: "Marine",
      roles: ["Ship Crew", "Marine Engineers", "Deck Officers", "Port Workers", "Logistics Staff"],
      image: marineImage,
    },
    {
      icon: Droplet,
      title: "Oil & Gas",
      roles: ["Petroleum Engineers", "Drilling Supervisors", "Safety Managers", "Technicians"],
      image: oilGasImage,
    },
    {
      icon: Heart,
      title: "Healthcare",
      roles: ["Nurses", "Caregivers", "Medical Assistants", "Lab Technicians", "Healthcare Support"],
      image: healthcareImage,
    },
    {
      icon: Users,
      title: "Skilled / Unskilled",
      roles: ["General Workers", "Helpers", "Drivers", "Security Guards", "Support Staff"],
      image: skilledUnskilledImage,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Industries We Serve | Alba Enterprises"
        description="Recruitment expertise across hospitality, construction, healthcare, manufacturing, marine, oil & gas and skilled & unskilled trades worldwide."
        path="/industries"
      />
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={industriesHeroImage} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Industries We Serve</h1>
              <p className="text-lg opacity-90">
                Connecting talent across diverse sectors for European opportunities
              </p>
            </motion.div>
          </div>
        </section>

        {/* Industries Grid */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/10 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all group cursor-pointer"
                >
                  {industry.image && (
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={industry.image} 
                        alt={industry.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                       loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-xl inline-block mb-4 shadow-lg group-hover:scale-110 transition-transform">
                      <industry.icon className="w-10 h-10 text-primary-foreground" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-primary group-hover:text-accent transition-colors">{industry.title}</h3>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary mb-2">
                      Key Roles:
                    </p>
                    <ul className="space-y-1">
                      {industry.roles.map((role, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start group/item hover:text-foreground transition-colors">
                          <span className="text-accent mr-2 font-bold">•</span>
                          {role}
                        </li>
                      ))}
                    </ul>
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0">
            <img src={industriesExpertiseBg} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary-dark/95 to-accent/95" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-6 text-primary-foreground">Our Industry Expertise</h2>
              <p className="text-lg text-primary-foreground/90 mb-8">
                With over a decade of experience, we have successfully placed professionals 
                across all major industries in European countries. Our deep understanding of 
                industry-specific requirements ensures that we match the right talent with 
                the right opportunities.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <motion.div 
                  className="bg-card p-8 rounded-xl border-2 border-accent shadow-2xl hover:scale-105 transition-transform"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-5xl font-bold text-accent mb-2">9+</div>
                  <div className="text-muted-foreground font-semibold">Industries Covered</div>
                </motion.div>
                <motion.div 
                  className="bg-card p-8 rounded-xl border-2 border-accent shadow-2xl hover:scale-105 transition-transform"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-5xl font-bold text-accent mb-2">50+</div>
                  <div className="text-muted-foreground font-semibold">Job Categories</div>
                </motion.div>
                <motion.div 
                  className="bg-card p-8 rounded-xl border-2 border-accent shadow-2xl hover:scale-105 transition-transform"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-5xl font-bold text-accent mb-2">1000+</div>
                  <div className="text-muted-foreground font-semibold">Placements Made</div>
                </motion.div>
              </div>
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
                <img src={ctaIndustriesTalent} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/90" />
              </div>
              <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Looking for Talent in Your Industry?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Whether you're hiring or seeking opportunities, we have the expertise 
                to connect you with the right match in your industry.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@albaenterprises.co.in"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-background text-foreground hover:bg-background/90 transition-colors"
                >
                  Discuss Your Requirements
                </a>
                <a
                  href="https://wa.me/919599591769"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
                >
                  Chat on WhatsApp
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

export default Industries;
