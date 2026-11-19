import { supabase } from "@/integrations/supabase/client";

interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  message: string;
  cvUrl?: string | null;
}

/**
 * Saves an enquiry to the `queries` table and triggers the admin email
 * notification. The notification is best-effort: if email fails, the
 * enquiry is still saved and visible in Admin → Enquiries.
 */
export const submitEnquiry = async ({ name, email, phone, message, cvUrl = null }: EnquiryInput) => {
  const { error } = await supabase.from("queries").insert({
    name,
    email,
    phone,
    message,
    cv_url: cvUrl,
  });
  if (error) throw error;

  try {
    await supabase.functions.invoke("notify-query", {
      body: { name, email, phone, message },
    });
  } catch (err) {
    console.warn("Enquiry saved, but email notification failed:", err);
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const validateCvFile = (file: File): string | null => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) return "Please upload a PDF or DOC file only";
  if (file.size > MAX_FILE_SIZE) return "File size must be less than 5MB";
  return null;
};

export const uploadCv = async (file: File, name: string) => {
  const ext = file.name.split(".").pop();
  const fileName = `query_${Date.now()}_${name.replace(/[^a-zA-Z0-9]+/g, "_")}.${ext}`;
  const { error } = await supabase.storage.from("cvs").upload(fileName, file);
  if (error) throw error;
  return supabase.storage.from("cvs").getPublicUrl(fileName).data.publicUrl;
};
