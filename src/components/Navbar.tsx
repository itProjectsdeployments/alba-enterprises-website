import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import albaLogo from "@/assets/alba-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Process", path: "/process" },
    { name: "Industries", path: "/industries" },
    { name: "Vacancies", path: "/vacancies" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const role = profile?.role;
  const dashboardPath =
    role === "admin" ? "/admin/jobs" : role === "recruiter" ? "/recruiter/dashboard" : null;

  const hireTalentPath = !user
    ? "/register?role=recruiter"
    : role === "recruiter"
      ? "/recruiter/dashboard"
      : "/contact";

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={albaLogo} alt="Alba Enterprise Logo" className="h-12 w-auto" loading="lazy" decoding="async" />
            <div className="text-2xl font-bold text-primary">
              Alba <span className="text-foreground">Enterprises</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
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

            <Button asChild variant="outline" size="sm">
              <Link to={hireTalentPath}>Hire Talent</Link>
            </Button>

            {!user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Staff Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/login">Login</Link>
                </Button>
              </>
            ) : (
              <>
                {dashboardPath && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={dashboardPath}>Dashboard</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" /> Sign Out
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to={hireTalentPath} onClick={() => setIsOpen(false)}>Hire Talent</Link>
              </Button>
              {!user ? (
                <>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/login" onClick={() => setIsOpen(false)}>Staff Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                  </Button>
                </>
              ) : (
                <>
                  {dashboardPath && (
                    <Button asChild variant="ghost" className="w-full">
                      <Link to={dashboardPath} onClick={() => setIsOpen(false)}>Dashboard</Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-1" /> Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
