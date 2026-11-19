import { AlertTriangle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

interface SubmitFallbackProps {
  subject: string;
  /** Plain-text summary of what the visitor entered. */
  text: string;
  compact?: boolean;
}

/**
 * Shown when a form cannot reach the server. Lets the visitor send the same
 * details by WhatsApp or email with one tap, so the enquiry is never lost.
 */
const SubmitFallback = ({ subject, text, compact = false }: SubmitFallbackProps) => {
  const wa = `${SITE.whatsappHref}?text=${encodeURIComponent(`${subject}\n\n${text}`)}`;
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-3 min-w-0">
          <p className="text-sm">
            <strong>We couldn't submit this online right now.</strong>{" "}
            {compact ? "Send it to us directly instead. Your details are already filled in." : "Please send it to us directly instead. Your details are already filled in, so it only takes one tap."}
          </p>
          <div className={`flex gap-2 ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
            <Button type="button" size="sm" className="bg-[#25D366] hover:bg-[#20BA5A] text-white" asChild>
              <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2" /> Send via WhatsApp</a>
            </Button>
            <Button type="button" size="sm" variant="outline" className="bg-white" asChild>
              <a href={mail}><Mail className="w-4 h-4 mr-2" /> Send via Email</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitFallback;
