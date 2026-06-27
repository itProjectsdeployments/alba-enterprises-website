import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Award, Globe, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import directorImage from "@/assets/azam-ali-khan.png";
import heroImage from "@/assets/hero-recruitment.jpg";
import teamCollaborationImage from "@/assets/home-team-collaboration.jpg";
import testimonialsBg from "@/assets/testimonials-bg.jpg";
import ctaNextStepBg from "@/assets/cta-home-next-step.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";

const Home = () => {
  const stats = [
    { icon: Award, label: "Years Experience", value: "10+" },
    { icon: Users, label: "Hiring Partners", value: "50+" },
    { icon: Globe, label: "Successful Deployments", value: "1000+" },
  ];

  const clients = [
    { name: "Client 1", logo: "/placeholder.svg" },
    { name: "Client 2", logo: "/placeholder.svg" },
    { name: "Client 3", logo: "/placeholder.svg" },
    { name: "Client 4", logo: "/placeholder.svg" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Manager, Tech Corp Europe",
      text: "Alba Enterprise provided us with highly skilled professionals. Their recruitment process is thorough and efficient.",
    },
    {
      name: "Rajesh Kumar",
      role: "Hospitality Professional",
      text: "Thanks to Alba Enterprise, I'm now working in Germany. They handled everything from visa to documentation perfectly.",
    },
    {
      name: "Michael Brown",
      role: "Operations Director, BuildCo",
      text: "We've been partnering with Alba for 3 years. Their understanding of European requirements is exceptional.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="International Recruitment Agency | Manpower Consultancy | Alba Enterprise"
        description="Alba Enterprise is a leading manpower consultancy and international recruitment agency providing staffing solutions, overseas jobs, Europe jobs, visa assistance and manpower services."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Alba Enterprise",
          url: "https://albaenterprise.in",
          logo: "https://albaenterprise.in/og-image.jpg",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+918527881258",
            contactType: "customer service",
            email: "etalba87@gmail.com",
          },
        }}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Leading{" "}
              <span className="text-primary">
              International Recruitment Agency </span>{" "} for{" "}
              <span className="text-accent">
              Global Manpower Solutions
              </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Premier manpower consultancy and staffing agency helping employers hire skilled Indian professionals for Europe and overseas jobs. 
                Alba  Enterprise provides international recruitment, manpower services, visa guidance and workforce solutions backed by over 10 years of experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/register?role=recruiter">
                    Hire Manpower
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/vacancies">Browse Vacancies</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src={heroImage}
                alt="International recruitment agency providing manpower consultancy and staffing services"
                className="rounded-lg shadow-2xl"
               loading="lazy" decoding="async" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-accent" />
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Director Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={directorImage}
                alt="Azam Ali Khan - Director"
                className="rounded-lg shadow-xl"
               loading="lazy" decoding="async" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Director of International Recruitment</h2>
              <h3 className="text-2xl text-primary font-semibold mb-4">Azam Ali Khan</h3>
              <p className="text-lg text-muted-foreground mb-6">
                With over 10 years of experience in international recruitment and manpower consultancy, Azam Ali Khan has helped employers across Europe recruit skilled Indian professionals. 
                His expertise in overseas recruitment, staffing solutions and workforce management has enabled thousands of candidates to build successful international careers.
              </p>
              <Button asChild>
                <Link to="/about">Learn More About Us</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Collaboration Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Connecting Global Employers with Skilled Indian Talent
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                As a trusted international staffing agency and manpower consultancy, Alba Enterprise connects skilled workers with employers across Europe. 
                We simplify overseas recruitment through candidate screening, documentation, visa guidance and complete manpower services.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Trusted by 50+ European Companies</h4>
                    <p className="text-muted-foreground">Long-term partnerships with leading European employers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">1000+ Successful Placements</h4>
                    <p className="text-muted-foreground">Helping professionals achieve their European career dreams</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">10+ Years of Excellence</h4>
                    <p className="text-muted-foreground">Proven track record in international recruitment</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src={teamCollaborationImage} 
                alt="Team collaboration"
                className="rounded-lg shadow-2xl"
               loading="lazy" decoding="async" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={testimonialsBg} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-background/95" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What People Say</h2>
            <p className="text-lg text-muted-foreground">
              Success stories from our clients and candidates
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card p-6 rounded-lg shadow-lg border"
              >
                <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Gallery</h2>
            <p className="text-lg text-muted-foreground">
              Moments from our events, conferences, and team collaborations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[gallery2, gallery3, gallery4, gallery5, gallery6].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group overflow-hidden rounded-lg shadow-lg aspect-[4/3]"
              >
                <img
                  src={image}
                  alt={`International recruitment event ${index + 1} by Alba Enterprise`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                 loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-primary-foreground font-semibold">Alba Enterprise</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recruiter & Candidate CTAs */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold mb-3">Looking to Hire Skilled Manpower Through an International Recruitment Agency?</h3>
            <p className="text-muted-foreground mb-6">
              Submit your hiring requirements and our international recruitment team will source qualified manpower, skilled workers and workforce solutions tailored to your business needs.
              </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/register?role=recruiter">Submit Hiring Requirement</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Contact Alba Enterprise</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold mb-3">Looking for Europe Jobs and Overseas Employment?</h3>
            <p className="text-muted-foreground mb-6">
              Browse verified overseas jobs across Europe and apply through our trusted manpower consultancy and international recruitment agency.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/vacancies">Browse Vacancies</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register">Create Candidate Account</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <img src={ctaNextStepBg} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/90" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your International Recruitment Journey?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Whether you're an employer seeking skilled manpower or a candidate searching for Europe jobs, 
              Alba Enterprise is your trusted international recruitment agency and staffing partner.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">Get Started Today</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Home;
