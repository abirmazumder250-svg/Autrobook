const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_";
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const BLOCKED_DOMAINS = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "throwaway.email",
  "getnada.com",
];

function isValidRealEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(normalized)) return false;

  const domain = normalized.split("@")[1];
  if (!domain || BLOCKED_DOMAINS.includes(domain)) return false;

  return true;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET_KEY) return true;
  if (!token) return false;

  const params = new URLSearchParams();
  params.append("secret", RECAPTCHA_SECRET_KEY);
  params.append("response", token);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data && data.success);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return res.status(500).json({
        ok: false,
        error:
          "Email service is not configured (missing GMAIL_USER or GMAIL_APP_PASSWORD)",
      });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Database configuration missing on server",
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const recaptchaToken = String(body.recaptchaToken || "").trim();

    if (!isValidRealEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid, non-temporary email address",
      });
    }

    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return res
        .status(400)
        .json({ ok: false, error: "reCAPTCHA verification failed" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    await supabaseAdmin.from("email_otps").delete().eq("email", email);

    const { error: dbError } = await supabaseAdmin.from("email_otps").insert({
      email,
      otp,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      return res.status(500).json({
        ok: false,
        error: "Failed to store OTP in database",
        details: dbError.message,
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Autrobook" <${GMAIL_USER}>`,
      to: email,
      subject: "Your Autrobook 6-Digit Verification OTP",
      text: `Your Autrobook verification code is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;">
          <h2 style="color:#0B3D20;margin-top:0;">Autrobook Verification</h2>
          <p>Use the 6-digit OTP below to complete your sign-up:</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;padding:12px 16px;border-radius:8px;text-align:center;color:#050505;">
            ${otp}
          </div>
          <p style="font-size:12px;color:#6b7280;margin-top:14px;">This code is valid for 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({
      ok: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({
      ok: false,
      error:
        err && err.message
          ? err.message
          : "Unexpected server error while sending OTP",
    });
  }
};
