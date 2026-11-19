import {
  ConciergeBell,
  Sparkles,
  Shirt,
  ChefHat,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Single source of truth for business details shown across the website.
export const SITE = {
  name: "Alba Enterprise",
  tagline: "Pan-India Hotel & Hospitality Recruitment",
  url: "https://www.albaenterprise.in",
  phoneDisplay: "+91 85278 81258",
  phoneHref: "tel:+918527881258",
  whatsappHref: "https://wa.me/918527881258",
  email: "info@albaenterprise.in",
  addressLines: ["Office No. 827, 8th Floor, Puri Business Hub", "Sector 81, Faridabad, Haryana, India"],
  mapEmbed:
    "https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1sPuri+Business+Hub,+Sector+81,+Faridabad",
  foundedYear: 2013,
};

// Add your profile URLs here. Icons only appear in the footer for links that are filled in.
export const SOCIAL_LINKS = {
  instagram: "",
  linkedin: "",
  facebook: "",
  youtube: "",
};

// Clear statement of scope, shown on several pages.
export const SCOPE_NOTE =
  "Alba Enterprise recruits for hospitality roles within India only. We do not recruit or place candidates for jobs outside India. Our international services are limited to HR consultancy and visa guidance & documentation assistance.";

export interface Department {
  icon: LucideIcon;
  title: string;
  summary: string;
  roles: string[];
}

export const DEPARTMENTS: Department[] = [
  {
    icon: ConciergeBell,
    title: "Front Office",
    summary: "The first impression of your property: guest-facing, well-groomed and service-driven teams.",
    roles: ["Front Office Associate / GSA", "Receptionist", "Bell Desk & Concierge", "Night Auditor", "Front Office Supervisor", "Front Office Manager"],
  },
  {
    icon: Sparkles,
    title: "Housekeeping",
    summary: "Detail-oriented staff who keep rooms and public areas to brand standards.",
    roles: ["Room Attendant", "Public Area Attendant", "Floor Supervisor", "Housekeeping Supervisor", "Assistant Executive Housekeeper", "Executive Housekeeper"],
  },
  {
    icon: Shirt,
    title: "Laundry",
    summary: "Trained laundry and linen teams for in-house and centralised laundry operations.",
    roles: ["Laundry Attendant", "Linen Room Attendant", "Washer / Presser", "Valet Runner", "Laundry Supervisor", "Laundry Manager"],
  },
  {
    icon: ChefHat,
    title: "F&B Production",
    summary: "Kitchen talent across cuisines, from commis to executive chef.",
    roles: ["Commis I / II / III", "Demi Chef de Partie", "Chef de Partie", "Sous Chef", "Bakery & Pastry Chef", "Executive Chef"],
  },
  {
    icon: UtensilsCrossed,
    title: "F&B Service",
    summary: "Restaurant, bar, banquet and in-room dining service professionals.",
    roles: ["Steward / Waiter", "Captain", "Bartender", "Hostess", "Restaurant / Banquet Manager", "F&B Manager"],
  },
  {
    icon: Wrench,
    title: "Maintenance",
    summary: "Engineering staff who keep your property running safely and efficiently.",
    roles: ["Electrician", "Plumber", "HVAC Technician", "Shift Engineer", "Maintenance Supervisor", "Chief Engineer"],
  },
];

export const HIRING_LEVELS = [
  { title: "Junior / Entry Level", description: "Associates, attendants, commis and trainees ready to grow." },
  { title: "Supervisory", description: "Team leaders and supervisors who run shifts and train staff." },
  { title: "Managerial", description: "Department managers with proven operational experience." },
  { title: "Senior Leadership", description: "HODs and senior roles, hired with discretion." },
];

export const ENQUIRY_TYPES = [
  "Hiring Requirement",
  "Job Seeker",
  "Visa & Documentation",
  "HR Consultancy",
  "General",
] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

// Enquiries are stored in the existing `queries` table. The type is kept as a
// "[Type]" prefix on the message so no database change is required.
export const formatEnquiryMessage = (type: EnquiryType, fields: Record<string, string | undefined>, note?: string) => {
  const lines = [`[${type}]`];
  Object.entries(fields).forEach(([k, v]) => {
    if (v && v.trim()) lines.push(`${k}: ${v.trim()}`);
  });
  if (note && note.trim()) lines.push("", note.trim());
  return lines.join("\n");
};

export const parseEnquiryType = (message: string): string => {
  const m = message.match(/^\[(.+?)\]/);
  return m ? m[1] : "General";
};
