import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import albaLogo from "@/assets/alba-logo.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Services", path: "/services" },
  { name: "Departments", path: "/industries" },
  { name: "Process", path: "/process" },
  { name: "Hotel Jobs", path: "/vacancies" },
  { name: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const role = profile?.role;
  const dashboardPath =
    role === "admin" ? "/admin/enquiries" : role === "recruiter" ? "/recruiter/dashboard" : null;

  const hireStaffPath = role === "recruiter" ? "/recruiter/dashboard" : "/hire-staff";

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/");
  };

  const close = () => setIsOpen(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b transition-shadow ${scrolled ? "shadow-[0_4px_20px_-8px_rgba(0,0,0,0.15)]" : ""}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3" aria-label="Alba Enterprise home">
            <img src={albaLogo} alt="" className="h-11 w-auto" decoding="async" />
            <div className="leading-tight">
              <div className="text-xl font-bold text-primary">
                Alba <span className="text-foreground">Enterprise</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hidden sm:block">
                Hospitality Recruitment
              </div>
            </div>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {!user ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
            ) : (
              <>
                {dashboardPath && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={dashboardPath}>Dashboard</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" /> Sign Out
                </Button>
              </>
            )}

            <Button asChild size="sm">
              <Link to={hireStaffPath}>Hire Staff</Link>
            </Button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile */}
        {isOpen && (
          <div className="lg:hidden pb-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={close}
                  className={`py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <Button asChild className="w-full">
                  <Link to={hireStaffPath} onClick={close}>Hire Staff</Link>
                </Button>
                {!user ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login" onClick={close}>Login</Link>
                  </Button>
                ) : (
                  <>
                    {dashboardPath && (
                      <Button asChild variant="outline" className="w-full">
                        <Link to={dashboardPath} onClick={close}>Dashboard</Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-1" /> Sign Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
