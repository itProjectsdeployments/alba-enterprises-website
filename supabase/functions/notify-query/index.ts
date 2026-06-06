const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "info@albaenterprises.co.in";
interface Payload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Basic HTML escape to avoid injection in email content
function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return jsonResponse({ error: "Missing RESEND_API_KEY" }, 500);
    }

    const body = (await req.json()) as Payload;

    const { name, email, message, phone } = body;

    if (!name || !email || !message) {
      return jsonResponse(
        { error: "name, email, and message are required" },
        400
      );
    }

    const html = `
      <h2>New Contact Form Submission</h2>

      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone ?? "N/A")}</p>

      <hr />

      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message)}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Alba Enterprises <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `New Contact Query from ${name}`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API Error:", data);
      return jsonResponse({ error: data }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Function Error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});