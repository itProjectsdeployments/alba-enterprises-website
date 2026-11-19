import { Link } from "react-router-dom";
import { Facebook, Linkedin, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { SCOPE_NOTE, SITE, SOCIAL_LINKS } from "@/lib/site";

const socials = [
  { href: SOCIAL_LINKS.instagram, icon: Instagram, label: "Instagram" },
  { href: SOCIAL_LINKS.linkedin, icon: Linkedin, label: "LinkedIn" },
  { href: SOCIAL_LINKS.facebook, icon: Facebook, label: "Facebook" },
  { href: SOCIAL_LINKS.youtube, icon: Youtube, label: "YouTube" },
].filter((s) => s.href);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xl font-bold mb-3">{SITE.name}</h3>
            <p className="text-sm opacity-85 mb-5">
              Pan-India hotel & hospitality recruitment, from junior to senior-level hiring. Also offering HR
              consultancy and visa documentation assistance.
            </p>
            {socials.length > 0 && (
              <div className="flex gap-4">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="hover:text-accent transition-colors">
                    <s.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/process" className="hover:text-accent transition-colors">Our Process</Link></li>
              <li><Link to="/vacancies" className="hover:text-accent transition-colors">Hotel Jobs</Link></li>
              <li><Link to="/contact?type=job-seeker" className="hover:text-accent transition-colors">Submit Your CV</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Services</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/hire-staff" className="hover:text-accent transition-colors">Hotel & Hospitality Recruitment</Link></li>
              <li><Link to="/industries" className="hover:text-accent transition-colors">Departments & Roles</Link></li>
              <li><Link to="/services#hr-consultancy" className="hover:text-accent transition-colors">HR Consultancy</Link></li>
              <li><Link to="/services#visa" className="hover:text-accent transition-colors">Visa Guidance & Documentation</Link></li>
              <li><Link to="/services#travel" className="hover:text-accent transition-colors">Travel Services</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm opacity-90">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{SITE.addressLines.join(", ")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={SITE.phoneHref} className="hover:text-accent transition-colors">{SITE.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">WhatsApp us</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href={`mailto:${SITE.email}`} className="hover:text-accent transition-colors">{SITE.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 mt-10 pt-6 text-xs opacity-75 space-y-2 text-center">
          <p className="max-w-3xl mx-auto">{SCOPE_NOTE}</p>
          <p>© {currentYear} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
