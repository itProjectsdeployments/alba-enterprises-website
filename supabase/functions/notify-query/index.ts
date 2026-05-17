const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL =
  Deno.env.get("ADMIN_EMAIL") || "etalba87@gmail.com";

interface Payload {
  name: string;
  email: string;
  phone: string;
  cv_url: string;
  job_title: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;

    if (!body?.name || !body?.email || !body?.job_title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Missing RESEND_API_KEY in Supabase Edge Function Secrets",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const html = `
      <h2>New Job Application</h2>

      <p><strong>Job Title:</strong> ${body.job_title}</p>

      <hr />

      <p><strong>Candidate Name:</strong> ${body.name}</p>
      <p><strong>Email:</strong> ${body.email}</p>
      <p><strong>Phone:</strong> ${body.phone}</p>

      <p>
        <strong>CV:</strong>
        <a href="${body.cv_url}" target="_blank">
          Download CV
        </a>
      </p>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Alba Enterprises <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `New Application - ${body.job_title}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API Error:", resendData);

      return new Response(
        JSON.stringify({
          error: resendData,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: resendData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Function Error:", error);

    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});