import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, KanbanSquare, Building2, ListTodo, Inbox, Globe, BarChart3, Menu, Search, Plus, LogOut, ChevronDown,
  Briefcase, UserPlus, CalendarPlus, FileSpreadsheet, User, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { todayISO } from "@/lib/crm";
import { ACTIVE_STAGES, PROCESS_STEPS, useCrm } from "@/lib/hr/model";
import { useHrUi } from "./ui";
import albaLogo from "@/assets/alba-logo.png";

interface Props { children: ReactNode; onImport: () => void }

const NavItem = ({ to, icon: Icon, label, badge, end, onClick, num }: {
  to: string; icon?: typeof LayoutDashboard; label: string; badge?: number; end?: boolean; onClick?: () => void; num?: number;
}) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-white/15 text-white font-semibold" : "text-white/75 hover:bg-white/10 hover:text-white"}`
    }
  >
    {num ? (
      <span className="w-5 h-5 rounded-full bg-white/15 text-[10px] font-bold flex items-center justify-center shrink-0">{num}</span>
    ) : Icon ? <Icon className="w-4 h-4 shrink-0" /> : null}
    <span className="flex-1 truncate">{label}</span>
    {badge ? <span className="text-[10px] font-bold bg-white/20 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{badge > 99 ? "99+" : badge}</span> : null}
  </NavLink>
);

const HrLayout = ({ children, onImport }: Props) => {
  const { user, profile, signOut } = useAuth();
  const ui = useHrUi();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const crm = useCrm();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const today = todayISO();
    const stageCount = (stages: string[]) => crm.applications.filter((a) => stages.includes(a.stage)).length;
    return {
      1: crm.jobs.filter((j) => j.status === "Open").length,
      2: crm.candidates.filter((c) => c.status === "New").length,
      3: stageCount(["Sourced", "Screening", "Shortlisted"]),
      4: crm.interviews.filter((i) => i.status === "Scheduled" && i.scheduled_at.slice(0, 10) >= today).length,
      5: stageCount(["Documents"]),
      6: stageCount(["Offer"]),
      7: crm.followups.filter((f) => f.status === "Pending" && f.due_date <= today).length,
      tasks: crm.tasks.filter((t) => !t.done && t.due_date && t.due_date <= today).length,
      pipeline: stageCount(ACTIVE_STAGES),
    } as Record<string | number, number>;
  }, [crm.jobs, crm.candidates, crm.applications, crm.interviews, crm.followups, crm.tasks]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const digits = term.replace(/\D/g, "");
    const out: { label: string; sub: string; to: string; kind: string }[] = [];
    crm.candidates.forEach((c) => {
      if (c.full_name.toLowerCase().includes(term) || (digits.length >= 4 && (c.phone || "").replace(/\D/g, "").includes(digits)) || c.email?.toLowerCase().includes(term))
        out.push({ kind: "Candidate", label: c.full_name, sub: [c.job_role, c.city, c.phone].filter(Boolean).join(" · "), to: `/hr/candidates/${c.id}` });
    });
    crm.jobs.forEach((j) => {
      if (j.title.toLowerCase().includes(term))
        out.push({ kind: "Requirement", label: j.title, sub: [j.client_id ? crm.client.get(j.client_id)?.name : null, j.location, j.status].filter(Boolean).join(" · "), to: `/hr/requirements/${j.id}` });
    });
    crm.clients.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) out.push({ kind: "Client", label: c.name, sub: [c.city, c.contact_person].filter(Boolean).join(" · "), to: `/hr/clients/${c.id}` });
    });
    return out.slice(0, 10);
  }, [q, crm.candidates, crm.jobs, crm.clients, crm.client]);

  const name = profile?.full_name || user?.email?.split("@")[0] || "HR";
  const isAdmin = profile?.role === "admin";

  const sidebar = (close?: () => void) => (
    <div className="h-full flex flex-col bg-gradient-to-b from-[hsl(202_100%_22%)] to-[hsl(210_80%_14%)] text-white">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="bg-white rounded-lg p-1.5"><img src={albaLogo} alt="" className="h-7 w-auto" /></div>
        <div className="leading-tight">
          <p className="font-heading font-bold">Alba Recruit</p>
          <p className="text-[11px] text-white/60">HR Workspace</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <NavItem to="/hr" end icon={LayoutDashboard} label="Dashboard" onClick={close} />
          <NavItem to="/hr/pipeline" icon={KanbanSquare} label="Pipeline board" badge={counts.pipeline} onClick={close} />
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Recruitment process</p>
          <div className="space-y-1">
            {PROCESS_STEPS.map((s) => (
              <NavItem key={s.n} to={s.path} num={s.n} label={s.title} badge={counts[s.n]} onClick={close} />
            ))}
          </div>
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Workspace</p>
          <div className="space-y-1">
            <NavItem to="/hr/clients" icon={Building2} label="Clients" onClick={close} />
            <NavItem to="/hr/tasks" icon={ListTodo} label="Tasks" badge={counts.tasks} onClick={close} />
            <NavItem to="/hr/google-forms" icon={ClipboardList} label="Google Form leads" onClick={close} />
            <NavItem to="/hr/inbox" icon={Inbox} label="Website leads" onClick={close} />
            <NavItem to="/hr/website-jobs" icon={Globe} label="Website job posts" onClick={close} />
            <NavItem to="/hr/reports" icon={BarChart3} label="Reports" onClick={close} />
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-white/50">
        {isAdmin ? <a href="/" className="hover:text-white">← Back to website</a> : "Alba Enterprise · Internal use only"}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(210_25%_97%)] dark:bg-background">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">{sidebar()}</aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0">{sidebar(() => setMobileOpen(false))}</SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 md:px-6 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="w-5 h-5" /></Button>

            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { navigate(results[0].to); setQ(""); } }}
                placeholder="Search candidates, phone numbers, requirements, clients…"
                className="w-full h-10 rounded-lg border bg-muted/40 pl-9 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
              />
              <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">Ctrl K</kbd>
              {searchOpen && q.trim().length >= 2 && (
                <div className="absolute top-12 left-0 right-0 bg-popover border rounded-xl shadow-xl overflow-hidden z-50">
                  {results.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No matches for "{q}"</p> : results.map((r) => (
                    <button key={r.to} onMouseDown={() => { navigate(r.to); setQ(""); }} className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-20 shrink-0">{r.kind}</span>
                      <span className="min-w-0"><span className="block text-sm font-medium truncate">{r.label}</span><span className="block text-xs text-muted-foreground truncate">{r.sub}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-1"><Plus className="w-4 h-4" /><span className="hidden sm:inline">New</span><ChevronDown className="w-3 h-3 opacity-70" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => ui.openNewJob()}><Briefcase className="w-4 h-4 mr-2" />Requirement</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => ui.openBulkJobs()}><Briefcase className="w-4 h-4 mr-2" />Multiple positions (paste)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => ui.openNewCandidate()}><UserPlus className="w-4 h-4 mr-2" />Candidate</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => ui.openNewClient()}><Building2 className="w-4 h-4 mr-2" />Client</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => ui.openSchedule()}><CalendarPlus className="w-4 h-4 mr-2" />Interview / trial</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => ui.openBulkSchedule()}><CalendarPlus className="w-4 h-4 mr-2" />Interviews for many (batch)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => ui.openNewTask()}><ListTodo className="w-4 h-4 mr-2" />Task</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onImport}><FileSpreadsheet className="w-4 h-4 mr-2" />Import Excel / CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted" aria-label="Account menu">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold uppercase">{name[0]}</span>
                    <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-medium flex items-center gap-2"><User className="w-4 h-4" />{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/hr"); }} className="text-rose-700"><LogOut className="w-4 h-4 mr-2" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px]">{children}</main>
      </div>
    </div>
  );
};

export default HrLayout;
