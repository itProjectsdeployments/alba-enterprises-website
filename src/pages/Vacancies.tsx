import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, DollarSign, Search, Filter, FileText } from "lucide-react";
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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-recruitment.jpg";

interface Job {
  id: string;
  title: string;
  category: string;
  country: string;
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
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = [...new Set(jobs.map(job => job.category))];
  const countries = [...new Set(jobs.map(job => job.country))];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, categoryFilter, countryFilter]);

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

    if (countryFilter !== "all") {
      filtered = filtered.filter(job => job.country === countryFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleApply = (job: Job) => {
    if (!user) {
      toast({
        title: "Please sign in to apply",
        description: "Create a free candidate account to apply for jobs.",
      });
      navigate("/register");
      return;
    }
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
      name: "Alba Enterprises",
      sameAs: "https://albaenterprises.co.in",
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressCountry: job.country },
    },
    industry: job.category,
    ...(job.salary && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: { "@type": "QuantitativeValue", value: job.salary, unitText: "MONTH" },
      },
    }),
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Job Vacancies — International Careers | Alba Enterprises"
        description="Explore open job vacancies across Europe, the Gulf and beyond. Apply for skilled and unskilled roles with trusted global employers via Alba Enterprises."
        path="/vacancies"
        jsonLd={jobPostingsLd.length ? jobPostingsLd : undefined}
      />
      <Navbar />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative text-primary-foreground py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Job Vacancies</h1>
              <p className="text-lg opacity-90">
                Explore exciting career opportunities across the globe with Alba Enterprises
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
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
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
                        <span className="text-sm">{job.country}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <DollarSign className="w-4 h-4" />
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
                Don't find your job category?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Submit your CV directly and we'll match you with suitable opportunities as they become available.
              </p>
              <Button asChild size="lg" variant="default">
                <Link to="/contact">
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