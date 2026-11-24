const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_USER = String(process.env.GMAIL_USER || "").trim();
const GMAIL_APP_PASSWORD = String(process.env.GMAIL_APP_PASSWORD || "")
  .replace(/\s+/g, "")
  .trim();

const MAX_OTP_ATTEMPTS = 5;

const ALLOWED_ORIGINS = new Set([
  "https://autrobook.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
]);

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

async function fetchLatestOtpRow(supabaseAdmin, cleanEmail) {
  const withAttempts = await supabaseAdmin
    .from("email_otps")
    .select("id, otp, expires_at, verified, attempts")
    .eq("email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!withAttempts.error) {
    return { row: withAttempts.data, supportsAttempts: true };
  }

  const fallback = await supabaseAdmin
    .from("email_otps")
    .select("id, otp, expires_at, verified")
    .eq("email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallback.error) {
    console.error("Failed to fetch OTP row from email_otps:", fallback.error);
  }

  return { row: fallback.data, supportsAttempts: false };
}

module.exports = async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
      return res.status(500).json({
        success: false,
        code: "SUPABASE_CONFIG_MISSING",
        message: "Server configuration error: Supabase credentials are missing.",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (_) {
        return res.status(400).json({
          success: false,
          code: "INVALID_JSON",
          message: "Invalid JSON request body.",
        });
      }
    }

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        success: false,
        code: "INVALID_BODY",
        message: "Request body must be a JSON object.",
      });
    }

    const { email, otp, profile } = body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_EMAIL",
        message: "Please provide a valid email address.",
      });
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        code: "OTP_INVALID",
        message: "OTP must be a 6-digit numeric code.",
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { row: otpRecord, supportsAttempts } = await fetchLatestOtpRow(
      supabaseAdmin,
      cleanEmail
    );

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        code: "OTP_NOT_FOUND",
        message: "No active OTP found for this email. Please request a new code.",
      });
    }

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        code: "OTP_ALREADY_USED",
        message: "This OTP has already been used.",
      });
    }

    const currentAttempts = supportsAttempts ? Number(otpRecord.attempts || 0) : 0;
    if (supportsAttempts && currentAttempts >= MAX_OTP_ATTEMPTS) {
      await supabaseAdmin.from("email_otps").delete().eq("id", otpRecord.id);
      return res.status(429).json({
        success: false,
        code: "OTP_MAX_ATTEMPTS",
        message: "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    if (!otpRecord.expires_at || new Date(otpRecord.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("email_otps").delete().eq("id", otpRecord.id);
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (String(otpRecord.otp || "").trim() !== cleanOtp) {
      if (supportsAttempts) {
        try {
          await supabaseAdmin
            .from("email_otps")
            .update({ attempts: currentAttempts + 1 })
            .eq("id", otpRecord.id);
        } catch (_) {}
      }

      return res.status(400).json({
        success: false,
        code: "OTP_MISMATCH",
        message: "Incorrect 6-digit OTP code.",
      });
    }

    const { data: consumedRow, error: consumeError } = await supabaseAdmin
      .from("email_otps")
      .delete()
      .eq("id", otpRecord.id)
      .select("id")
      .maybeSingle();

    if (consumeError || !consumedRow) {
      return res.status(400).json({
        success: false,
        code: "OTP_ALREADY_USED",
        message: "This OTP has already been used.",
      });
    }

    const updatePayload = {
      is_verified: true,
      verified_at: new Date().toISOString(),
    };

    if (profile && typeof profile.full_name === "string" && profile.full_name.trim()) {
      updatePayload.full_name = profile.full_name.trim().slice(0, 120);
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("email", cleanEmail);

    if (profileUpdateError) {
      console.error("Failed to update profile verification status:", profileUpdateError);
    }

    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
          },
        });

        const safeName = esc(
          profile && typeof profile.full_name === "string" && profile.full_name.trim()
            ? profile.full_name.trim().slice(0, 120)
            : "User"
        );

        await transporter.sendMail({
          from: `"Autrobook" <${GMAIL_USER}>`,
          replyTo: GMAIL_USER,
          to: cleanEmail,
          subject: "Your Autrobook Account is Verified",
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;max-width:500px;margin:auto;border:1px solid #e4e6e9;border-radius:14px;background:#ffffff">
              <div style="background:#0F5132;padding:18px;border-radius:10px;text-align:center;margin-bottom:20px">
                <h2 style="color:#ffffff;margin:0;font-size:20px">Autrobook</h2>
              </div>
              <h3 style="margin:0 0 10px;color:#202124">Hi ${safeName},</h3>
              <p style="color:#374151;margin:0 0 12px">Your email (<b>${esc(cleanEmail)}</b>) has been verified successfully.</p>
              <p style="color:#6b7280;font-size:12px;margin:18px 0 0">&copy; 2026 Autrobook</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn("Verification confirmation email warning:", mailErr?.message || mailErr);
      }
    }

    return res.status(200).json({
      success: true,
      code: "VERIFIED",
      message: "OTP verified successfully.",
    });
  } catch (err) {
    console.error("verify-otp unexpected error:", err);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Unexpected server error during OTP verification.",
    });
  }
};
