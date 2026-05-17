import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Roles available for public signup. Admins are provisioned manually in the database.
type SignupRole = "candidate" | "recruiter";

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole: SignupRole = searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [role, setRole] = useState<SignupRole>(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "recruiter" || r === "candidate") setRole(r);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Map "candidate" UI role to DB role "worker" (existing app_role enum value)
    const dbRole = role === "candidate" ? "worker" : "recruiter";
    const metadata: Record<string, string> =
      role === "recruiter"
        ? {
            full_name: contactPerson,
            phone,
            role: dbRole,
            company_name: companyName,
          }
        : {
            full_name: fullName,
            phone,
            role: dbRole,
          };

    const { error } = await signUp(email, password, metadata);
    setLoading(false);
    if (error) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registration successful!", description: "Please check your email to verify your account." });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-20 px-4">
        <div className="w-full max-w-md space-y-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-muted-foreground mt-2">Register to get started</p>
          </div>

          {/* Role tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-md">
            <button
              type="button"
              onClick={() => setRole("candidate")}
              className={`py-2 text-sm rounded-md transition-colors ${
                role === "candidate" ? "bg-background shadow font-medium" : "text-muted-foreground"
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole("recruiter")}
              className={`py-2 text-sm rounded-md transition-colors ${
                role === "recruiter" ? "bg-background shadow font-medium" : "text-muted-foreground"
              }`}
            >
              Recruiter
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "recruiter" ? (
              <>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person Name</Label>
                  <Input id="contactPerson" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Alba staff?{" "}
            <Link to="/login" className="text-primary hover:underline">Staff Login</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
