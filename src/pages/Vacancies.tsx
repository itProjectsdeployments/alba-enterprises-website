import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, IndianRupee, Search, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import JobApplicationForm from "@/components/JobApplicationForm";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { SITE } from "@/lib/site";
import heroImage from "@/assets/industry-hospitality.jpg";

interface Job {
  id: string;
  title: string;
  category: string;
  country: string;
  location: string | null;
  description: string;
  salary: string | null;
  status: string;
  created_at: string;
}

const Vacancies = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const categories = [...new Set(jobs.map(job => job.category))];
  const jobLocation = (job: Job) => job.location || job.country;
  const locations = [...new Set(jobs.map(jobLocation))];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, categoryFilter, locationFilter]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(job => job.category === categoryFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(job => jobLocation(job) === locationFilter);
    }

    setFilteredJobs(filtered);
  };

  // No account needed: the application form collects name, contact and CV.
  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleApplicationSuccess = () => {
    setIsDialogOpen(false);
    setSelectedJob(null);
  };

  const jobPostingsLd = filteredJobs.slice(0, 20).map((job) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: "Alba Enterprise",
      sameAs: "https://albaenterprise.in",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        ...(job.location && { addressLocality: job.location }),
      },
    },
    industry: job.category,
    ...(job.salary && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: { "@type": "QuantitativeValue", value: job.salary, unitText: "MONTH" },
      },
    }),
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Hotel Jobs in India | Hospitality Vacancies | Alba Enterprise"
        description="Current hotel and hospitality job vacancies across India: Front Office, Housekeeping, Laundry, F&B Production, F&B Service and Maintenance roles from junior to senior level."
        path="/vacancies"
        jsonLd={jobPostingsLd.length ? jobPostingsLd : undefined}
      />
      <Navbar />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage}
              alt="Hotel kitchen and service professionals"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Hotel Jobs in India</h1>
              <p className="text-lg opacity-90">
                Current openings with hotels and hospitality businesses across India, from junior to senior level.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="py-8 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Jobs Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-card border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {job.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{jobLocation(job)}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-sm">{job.salary}</span>
                        </div>
                      )}
                      <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                        {job.description}
                      </p>
                      <Button 
                        className="w-full" 
                        onClick={() => handleApply(job)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : loadError ? (
              <div className="text-center py-16 max-w-xl mx-auto">
                <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">We couldn't load vacancies right now</h3>
                <p className="text-muted-foreground mb-6">
                  We're always hiring for hotel roles across India. Send your CV on WhatsApp and our team will contact you about current openings.
                </p>
                <Button asChild className="bg-[#25D366] hover:bg-[#20BA5A] text-white">
                  <a href={`${SITE.whatsappHref}?text=${encodeURIComponent("Hello Alba Enterprise, I'm looking for a hotel job. Sharing my CV.")}`} target="_blank" rel="noopener noreferrer">
                    Send CV on WhatsApp
                  </a>
                </Button>
              </div>
            ) : (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground mb-6">
                  {jobs.length === 0 
                    ? "There are no open positions at the moment. Check back soon!"
                    : "No jobs match your search criteria. Try adjusting your filters."}
                </p>
              </div>
            )}

            {/* Submit CV Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-16 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12"
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Didn't find the right role?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Send us your CV and we'll contact you when a suitable hospitality role opens with one of our hiring partners in India.
              </p>
              <Button asChild size="lg" variant="default">
                <Link to="/contact?type=job-seeker">
                  <FileText className="w-5 h-5 mr-2" />
                  Submit Your CV
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Job Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <JobApplicationForm 
              job={selectedJob} 
              onSuccess={handleApplicationSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Vacancies;