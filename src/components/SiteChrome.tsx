import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE } from "@/lib/site";

/** Scrolls to the top on page change (unless linking to a #section). */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
};

/** Floating WhatsApp button on public pages. */
export const WhatsAppButton = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin") || pathname.startsWith("/recruiter") || pathname.startsWith("/hr")) return null;
  return (
    <a
      href={`${SITE.whatsappHref}?text=${encodeURIComponent("Hello Alba Enterprise, I have an enquiry.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Alba Enterprise on WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:bg-[#20BA5A] transition-all pl-3 pr-4 py-3 group"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.19 4.23-9.42 9.43-9.42a9.37 9.37 0 0 1 9.42 9.43c0 5.2-4.23 9.42-9.42 9.42zm8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.51 5.66L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.41 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.31-8.01z" />
      </svg>
      <span className="text-sm font-semibold hidden sm:inline">WhatsApp</span>
    </a>
  );
};
