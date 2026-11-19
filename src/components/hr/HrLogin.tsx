import { useState } from "react";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { PROCESS_STEPS } from "@/lib/hr/model";
import albaLogo from "@/assets/alba-logo.png";

const HrLogin = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[hsl(202_100%_24%)] to-[hsl(210_80%_14%)] text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2"><img src={albaLogo} alt="" className="h-8 w-auto" /></div>
          <div><p className="font-heading font-bold text-lg">Alba Recruit</p><p className="text-xs text-white/60">HR Workspace</p></div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-8">Every step of hospitality hiring, in one place.</h1>
          <ol className="space-y-3">
            {PROCESS_STEPS.map((s) => (
              <li key={s.n} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">{String(s.n).padStart(2, "0")}</span>
                <span className="font-medium">{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-white/50">Alba Enterprise · Internal use only</p>
      </div>

      <div className="flex items-center justify-center p-6 bg-[hsl(210_25%_97%)]">
        <form onSubmit={submit} className="w-full max-w-sm bg-card border rounded-2xl shadow-sm p-8 space-y-5">
          <div className="lg:hidden flex items-center gap-2 mb-2"><img src={albaLogo} alt="" className="h-8" /><span className="font-heading font-bold">Alba Recruit</span></div>
          <div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><Lock className="w-5 h-5" /></div>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Use your Alba HR account.</p>
          </div>
          <div>
            <Label htmlFor="hr-email">Email</Label>
            <Input id="hr-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <Label htmlFor="hr-pass">Password</Label>
            <div className="relative">
              <Input id="hr-pass" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sign in</Button>
        </form>
      </div>
    </div>
  );
};

export default HrLogin;
