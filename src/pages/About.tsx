import { motion } from "framer-motion";
import { Target, Eye, Heart, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import directorImage from "@/assets/azam-ali-khan.png";
import aboutHeroImage from "@/assets/about-hero-bg.jpg";
import missionVisual from "@/assets/mission-visual.jpg";
import visionVisual from "@/assets/vision-visual.jpg";
import valuesVisual from "@/assets/values-visual.jpg";

const About = () => {
  const values = [
    {
      icon: Target,
      image: missionVisual,
      title: "Mission",
      description: "To bridge the gap between skilled Indian professionals and international employers through ethical manpower consultancy, staffing solutions and overseas recruitment services.",
    },
    {
      icon: Eye,
      image: visionVisual,
      title: "Vision",
      description: "To become the world's most trusted international recruitment partner delivering high-quality manpower solutions and successful global placements.",
    },
    {
      icon: Heart,
      image: valuesVisual,
      title: "Values",
      description: "Integrity, Excellence, Transparency, and Client Satisfaction guide everything we do.",
    },
  ];

  const whyEuropeanCompanies = [
    "Pre-screened, skilled Indian professionals",
    "Complete documentation and compliance support",
    "Cultural orientation and training",
    "Post-placement support and follow-up",
    "Cost-effective recruitment solutions",
    "Dedicated account management",
  ];

  const whyIndianCandidates = [
    "Genuine European job opportunities",
    "End-to-end visa assistance",
    "Pre-departure orientation",
    "Fair and transparent process",
    "No hidden charges",
    "Ongoing support after placement",
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Alba Enterprise | International Recruitment Partner & Manpower Consultancy"

      description="Learn about Alba Enterprise, a trusted international recruitment partner and manpower 
      consultancy connecting skilled Indian professionals with employers across Europe through ethical staffing and overseas recruitment services."
      />
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={aboutHeroImage} alt="Alba Enterprise international recruitment partner helping Indian professionals find overseas jobs" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">About Alba Enterprise</h1>
              <p className="text-lg opacity-90">
                Your trusted international recruitment partner and manpower consultancy connecting skilled Indian professionals with employers across Europe since 2013.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Our Story</h2>
                <div className="space-y-4 text-lg text-muted-foreground text-left bg-card p-8 rounded-xl shadow-lg border">
                  <p>
                    Founded in 2013 by Azam Ali Khan, Alba Enterprise was established with a clear vision of becoming a trusted international recruitment partner for employers and job seekers. 
                    Our mission is to connect skilled Indian professionals with genuine overseas employment opportunities across Europe through ethical recruitment and manpower consultancy services.
                  </p>
                  <p>
                    Over the past decade, Alba Enterprise has grown into a leading manpower consultancy and international staffing agency.
                    Our deep understanding of European labour markets and Indian talent enables us to provide reliable recruitment, visa guidance and workforce solutions for employers and candidates alike.
                  </p>
                  <p>
                    Today, Alba Enterprise is recognised as a trusted international recruitment partner known for integrity, professionalism and long-term client relationships. 
                    We don't simply recruit candidates—we help businesses build skilled teams while creating life-changing overseas career opportunities.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 bg-gradient-to-br from-primary to-primary-dark">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-card rounded-xl shadow-2xl border overflow-hidden group cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={value.image} 
                      alt={value.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 group-hover:scale-125">
                      <div className="bg-accent p-3 rounded-full">
                        <value.icon className="w-10 h-10 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold mb-4 text-primary">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us - For Companies */}
        <section className="py-20 bg-gradient-to-r from-accent/10 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-card p-8 rounded-xl shadow-lg border"
              >
                <h2 className="text-3xl font-bold mb-6 text-primary">Why European Companies Trust Alba Enterprise</h2>
                <div className="space-y-4">
                  {whyEuropeanCompanies.map((reason, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <p className="text-lg text-muted-foreground">{reason}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-card p-8 rounded-xl shadow-lg border"
              >
                <h2 className="text-3xl font-bold mb-6 text-primary">Why Indian Professionals Choose Alba Enterprise</h2>
                <div className="space-y-4">
                  {whyIndianCandidates.map((reason, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <p className="text-lg text-muted-foreground">{reason}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Director Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <img
                src={directorImage}
                alt="Azam Ali Khan, Founder and Director of Alba Enterprise International Recruitment Agency"
                className="w-48 h-48 rounded-full mx-auto mb-6 shadow-xl object-cover"
               loading="lazy" decoding="async" />
              <h3 className="text-2xl font-bold mb-2">Azam Ali Khan</h3>
              <p className="text-lg text-primary font-semibold mb-4">Founder & Director – International Recruitment Partner</p>
              <p className="text-muted-foreground text-lg">
                "Our success is measured not just in placements made, but in lives transformed 
                and dreams realized. At Alba Enterprise, we are committed to maintaining the 
                highest standards of service and integrity in everything we do."
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default About;
