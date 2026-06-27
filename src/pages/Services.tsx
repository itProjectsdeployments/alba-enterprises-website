import { motion } from "framer-motion";
import { Users, FileCheck, Hotel, GraduationCap, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import recruitmentImage from "@/assets/service-recruitment.jpg";
import visaImage from "@/assets/service-visa.jpg";
import bookingImage from "@/assets/service-booking.jpg";
import educationImage from "@/assets/service-education.jpg";
import servicesHeroImage from "@/assets/services-hero.jpg";

const Services = () => {
  const services = [
    {
      icon: Users,
      image: recruitmentImage,
      title: "International Recruitment & Staffing Services",
      description: "We help employers recruit skilled Indian professionals through our international recruitment agency and manpower consultancy, delivering reliable staffing solutions for overseas businesses.",
      features: [
        "Comprehensive candidate screening",
        "Skills assessment and verification",
        "Background checks",
        "Interview coordination",
        "Overseas placement support",
      ],
    },
    {
      icon: FileCheck,
      image: visaImage,
      title: "Work Visa & Visa Stamping Services",
      description: "Complete work visa, visa stamping and documentation support for professionals travelling abroad for employment opportunities.",
      features: [
        "Work visa processing",
        "Document preparation",
        "Embassy liaison",
        "Visa interview guidance",
        "Status tracking",
      ],
    },
    {
      icon: Hotel,
      image: bookingImage,
      title: "Air Ticket & Hotel Booking Services",
      description: "Affordable international air ticket booking and hotel reservations for candidates travelling overseas for employment and business purposes.",
      features: [
        "Best price guarantee",
        "Multiple airline options",
        "Flexible booking options",
        "Hotel reservations worldwide",
        "Last-minute bookings",
      ],
    },
    {
      icon: GraduationCap,
      image: educationImage,
      title: "Education Services",
      description: "Helping students pursue international education through university admissions, visa guidance and overseas study support.",
      features: [
        "University selection guidance",
        "Application assistance",
        "Admission support",
        "Scholarship information",
        "Student visa processing",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="International Recruitment, Visa & Manpower Services | Alba Enterprise"

        description="Alba Enterprise provides international recruitment, manpower consultancy, staffing solutions, work visa assistance, 
        air ticket booking, hotel reservations and overseas education services for global employers and candidates."
        path="/services"/>
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={servicesHeroImage} alt="International recruitment and manpower consultancy services by Alba Enterprise" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">International Recruitment & Manpower Services</h1>
              <p className="text-lg opacity-90">
                Comprehensive manpower consultancy, international recruitment, staffing, visa assistance, travel and education services for employers and job seekers worldwide.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="space-y-16">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                    <div className="bg-primary/10 p-4 rounded-lg inline-block mb-4">
                      <service.icon className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{service.title}</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {service.description}
                    </p>
                    <div className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <p className="text-muted-foreground">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                    <div className="rounded-lg overflow-hidden shadow-xl">
                      <img 
                        src={service.image} 
                        alt={
                          service.title === "International Recruitment & Staffing Services"
                            ? "International recruitment and manpower consultancy services"
                            : service.title === "Work Visa & Visa Stamping Services"
                            ? "Work visa and visa stamping assistance"
                            : service.title === "Air Ticket & Hotel Booking Services"
                            ? "International air ticket and hotel booking services"
                            : "International education consultancy services" 
                          }
                        className="w-full h-full object-cover aspect-square"
                       loading="lazy" decoding="async" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Need International Recruitment or Manpower Services?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you need skilled manpower, international recruitment, staffing solutions, 
                work visa assistance or overseas education guidance, Alba Enterprise is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+918527881258"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Call Us Now
                </a>
                <a
                  href="mailto:etalba87@gmail.com"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Email Us
                </a>
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

export default Services;
