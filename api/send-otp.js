const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://gemyqaniztqrsilayblx.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_PEPPER = String(
  process.env.OTP_PEPPER || SUPABASE_SERVICE_ROLE_KEY || ""
);

const GMAIL_USER = process.env.GMAIL_USER || process.env.EMAIL_USER || "";
const GMAIL_APP_PASSWORD =
  process.env.GMAIL_APP_PASSWORD ||
  process.env.EMAIL_APP_PASSWORD ||
  process.env.GMAIL_PASS ||
  "";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "";

const ALLOWED_ORIGINS = new Set([
  "https://autrobook.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
]);

const OTP_TTL_MINUTES = 10;

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
]);

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function isValidEmail(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) return false;
  const domain = clean.split("@")[1] || "";
  return !DISPOSABLE_DOMAINS.has(domain);
}

function generateSixDigitOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", OTP_PEPPER)
    .update(`${String(email).trim().toLowerCase()}:${String(otp).trim()}`)
    .digest("hex");
}

async function verifyRecaptchaToken(token, remoteIp) {
  if (!RECAPTCHA_SECRET_KEY) return true; // লোকাল বা secret সেট না থাকলে বাইপাস; প্রোডাকশনে secret সেট রাখুন
  if (!token) return false;

  const params = new URLSearchParams();
  params.append("secret", RECAPTCHA_SECRET_KEY);
  params.append("response", String(token));
  if (remoteIp) params.append("remoteip", String(remoteIp));

  const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await resp.json().catch(() => ({}));
  return Boolean(data.success);
}

async function sendOtpEmail(toEmail, otp, purpose) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is missing");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
    },
  });

  const subject =
    purpose === "reset-password"
      ? "Autrobook - Password Reset OTP Code"
      : "Autrobook - Verification OTP Code";

  await transporter.sendMail({
    from: `"Autrobook" <${GMAIL_USER}>`,
    to: toEmail,
    subject,
    text: `Your Autrobook 6-digit OTP code is: ${otp}. It will expire in ${OTP_TTL_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px;">
        <h2 style="margin: 0 0 12px; color: #0F5132;">Autrobook Verification</h2>
        <p style="margin: 0 0 16px; color: #374151; font-size: 14px;">
          Use the 6-digit OTP code below to continue:
        </p>
        <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 14px; text-align: center; background: #f3f4f6; border-radius: 10px; color: #111827;">
          ${otp}
        </div>
        <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px;">
          This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email.
        </p>
      </div>
    `,
  });
}

async function saveOtpRecord(cleanEmail, otpHash, purpose, expiresAtIso) {
  // পুরনো অব্যবহৃত OTP ইনভ্যালিড/ডিলিট করার চেষ্টা
  await supabase
    .from("email_otps")
    .update({ used: true })
    .eq("email", cleanEmail)
    .eq("purpose", purpose)
    .eq("used", false);

  const primaryPayload = {
    email: cleanEmail,
    otp: otpHash,
    purpose,
    used: false,
    verified: false,
    attempts: 0,
    expires_at: expiresAtIso,
  };

  let { error } = await supabase.from("email_otps").insert(primaryPayload);

  // টেবিলে কিছু অপশনাল কলাম না থাকলে মিনিমাল কলামে ফলব্যাক
  if (error) {
    const fallbackPayload = {
      email: cleanEmail,
      otp: otpHash,
      expires_at: expiresAtIso,
    };
    const fallbackRes = await supabase
      .from("email_otps")
      .insert(fallbackPayload);
    error = fallbackRes.error;
  }

  if (error) {
    throw new Error(`Failed to save OTP in email_otps: ${error.message}`);
  }
}

module.exports = async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, success: false, message: "Method not allowed" });
  }

  try {
    if (!supabase || !OTP_PEPPER) {
      return res.status(500).json({
        ok: false,
        success: false,
        message:
          "SUPABASE_SERVICE_ROLE_KEY or OTP_PEPPER is missing in environment variables",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res
          .status(400)
          .json({ ok: false, success: false, message: "Invalid JSON payload" });
      }
    }

    const {
      email,
      purpose = "reset-password",
      isResend = false,
      token,
      recaptchaToken,
    } = body || {};

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPurpose = String(purpose || "reset-password").trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!isResend) {
      const capToken = token || recaptchaToken;
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "";
      const captchaOk = await verifyRecaptchaToken(capToken, ip);
      if (!captchaOk) {
        return res.status(400).json({
          ok: false,
          success: false,
          message: "reCAPTCHA verification failed",
        });
      }
    }

    const otp = generateSixDigitOtp();
    const otpHash = hashOtp(cleanEmail, otp);
    const expiresAtIso = new Date(
      Date.now() + OTP_TTL_MINUTES * 60 * 1000
    ).toISOString();

    await saveOtpRecord(cleanEmail, otpHash, cleanPurpose, expiresAtIso);
    await sendOtpEmail(cleanEmail, otp, cleanPurpose);

    return res.status(200).json({
      ok: true,
      success: true,
      message: "6-digit OTP sent successfully",
      expiresInSeconds: OTP_TTL_MINUTES * 60,
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({
      ok: false,
      success: false,
      message: err?.message || "Failed to send OTP email",
    });
  }
};
