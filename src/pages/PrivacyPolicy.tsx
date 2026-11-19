import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { SITE } from "@/lib/site";

const sections = [
  {
    title: "Information we collect",
    body: [
      "Details you submit through our forms: your name, phone number, email, company or hotel name, location, hiring requirements and any message you send.",
      "For job seekers: your CV and career details such as department, experience and preferred location.",
      "Account details if you register as a candidate or employer.",
      "Website usage data such as browser type, device information, IP address and pages visited, collected through Google Analytics, Google Tag Manager, Meta Pixel and LinkedIn Insight Tag.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To respond to your enquiry and contact you by phone, WhatsApp or email.",
      "To match candidates with suitable hospitality job openings in India and share relevant profiles with prospective employers.",
      "To provide HR consultancy and visa documentation assistance you request.",
      "To understand how our website is used and to improve our services and advertising.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We share a candidate's profile only with employers relevant to that candidate's job interests. We do not sell personal information to third parties.",
      "We use trusted service providers (for example website hosting, database and email services) who process data on our behalf.",
    ],
  },
  {
    title: "Retention & your choices",
    body: [
      "We keep your information only as long as needed for recruitment and the services you requested, or as required by law.",
      `You may ask us to access, correct or delete your information at any time by emailing ${SITE.email}.`,
    ],
  },
];

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEO title="Privacy Policy | Alba Enterprise" description="How Alba Enterprise collects, uses and protects your personal information." path="/privacy-policy" />
    <Navbar />
    <main className="pt-28 pb-20 container mx-auto px-4 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-10">
        {SITE.name} respects your privacy and is committed to protecting your personal information. This policy
        explains what we collect through albaenterprise.in and how we use it.
      </p>
      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-2xl font-semibold mb-3">{s.title}</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              {s.body.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </section>
        ))}
        <section>
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground">
            Questions about this policy? Write to <a className="text-primary underline" href={`mailto:${SITE.email}`}>{SITE.email}</a> or
            visit us at {SITE.addressLines.join(", ")}.
          </p>
        </section>
      </div>
      <p className="text-sm text-muted-foreground mt-12">Last updated: November 2026</p>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
