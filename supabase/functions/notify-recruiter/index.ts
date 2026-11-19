import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const {
      job_title,
      number_required,
      location,
      salary_range,
      skills_required,
      skill_required,
    } = await req.json();

    const esc = (v: unknown) =>
      String(v ?? "N/A").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const skills = skills_required ?? skill_required;

    const { data, error } = await resend.emails.send({
      from: "Alba Enterprise <onboarding@resend.dev>",

      // 👇 Change this to your recruiter email
      to: ["etalba87@gmail.com"],

      subject: `New Hiring Requirement - ${String(job_title ?? "").slice(0, 100)}`,

      html: `
        <h2>New Hire Talent Request</h2>

        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;">
          <tr>
            <td><strong>Job Title</strong></td>
            <td>${esc(job_title)}</td>
          </tr>

          <tr>
            <td><strong>Number Required</strong></td>
            <td>${esc(number_required)}</td>
          </tr>

          <tr>
            <td><strong>Location</strong></td>
            <td>${esc(location)}</td>
          </tr>

          <tr>
            <td><strong>Salary Range</strong></td>
            <td>${esc(salary_range)}</td>
          </tr>

          <tr>
            <td><strong>Skills Required</strong></td>
            <td>${esc(skills)}</td>
          </tr>
        </table>

        <br>

        <p>
          This hiring requirement was submitted from the
          <strong>Employer Dashboard</strong> of the Alba Enterprise website.
        </p>
      `,
    });

    if (error) {
      console.error(error);

      return new Response(
        JSON.stringify({
          success: false,
          error,
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
        data,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
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