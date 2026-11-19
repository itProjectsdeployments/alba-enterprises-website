import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ScrollToTop, WhatsAppButton } from "@/components/SiteChrome";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Process from "./pages/Process";
import Industries from "./pages/Industries";
import Contact from "./pages/Contact";
import Vacancies from "./pages/Vacancies";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HireStaff from "./pages/HireStaff";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminJobs from "./pages/admin/AdminJobs";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
// The HR workspace is loaded only when someone opens /hr, keeping the public site light.
const HrApp = lazy(() => import("./pages/hr/HrApp"));

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** HR staff only ever see their workspace: any website URL sends them back to /hr. */
const HrLock = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  if (profile?.role === "hr" && !pathname.startsWith("/hr")) return <Navigate to="/hr" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <WhatsAppButton />
            <HrLock>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/process" element={<Process />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/vacancies" element={<Vacancies />} />
              <Route path="/hire-staff" element={<HireStaff />} />

              {/* Privacy Policy */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/admin/jobs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminJobs />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminApplications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/enquiries"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminEnquiries />
                  </ProtectedRoute>
                }
              />

              {/* HR workspace: own login and layout, no public website chrome */}
              <Route
                path="/hr/*"
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                    <HrApp />
                  </Suspense>
                }
              />

              <Route
                path="/recruiter/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Keep this route last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </HrLock>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;