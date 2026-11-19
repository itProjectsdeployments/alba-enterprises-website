// Emails the admin when a candidate applies for a vacancy.
// Deploy with: supabase functions deploy notify-application
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "info@albaenterprise.in";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface Payload {
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  cv_url?: string;
}

const escapeHtml = (str: string) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) return json({ error: "Missing RESEND_API_KEY" }, 500);

    const { name, email, phone, job_title, cv_url } = (await req.json()) as Payload;
    if (!name || !email) return json({ error: "name and email are required" }, 400);

    const safeCv = cv_url && /^https:\/\//.test(cv_url) ? cv_url : null;
    const html = `
      <h2>New Job Application</h2>
      <p><strong>Position:</strong> ${escapeHtml(job_title ?? "N/A")}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone ?? "N/A")}</p>
      <p><strong>CV:</strong> ${safeCv ? `<a href="${escapeHtml(safeCv)}">Download CV</a>` : "Not provided"}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Alba Enterprise <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `New application: ${job_title ?? "Vacancy"} – ${name}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API Error:", data);
      return json({ error: data }, 500);
    }
    return json({ success: true });
  } catch (err) {
    console.error("Function Error:", err);
    return json({ error: String(err) }, 500);
  }
});
