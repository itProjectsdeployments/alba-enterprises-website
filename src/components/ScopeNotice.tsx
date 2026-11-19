import { Info } from "lucide-react";
import { SCOPE_NOTE } from "@/lib/site";

const ScopeNotice = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground ${className}`}>
    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
    <p>{SCOPE_NOTE}</p>
  </div>
);

export default ScopeNotice;
