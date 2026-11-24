const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_USER = String(process.env.GMAIL_USER || "").trim();
const GMAIL_APP_PASSWORD = String(process.env.GMAIL_APP_PASSWORD || "")
  .replace(/\s+/g, "")
  .trim();
const RECAPTCHA_SECRET_KEY = String(process.env.RECAPTCHA_SECRET_KEY || "").trim();
const OTP_PEPPER = String(process.env.OTP_PEPPER || SUPABASE_SERVICE_ROLE_KEY || "");

const ALLOWED_ORIGINS = new Set([
  "https://autrobook.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
]);

const BLOCKED_DOMAINS = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "throwaway.email",
  "getnada.com",
]);

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function isValidRealEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || normalized.length > 160) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(normalized)) return false;

  const domain = normalized.split("@")[1];
  if (!domain || BLOCKED_DOMAINS.has(domain)) return false;

  return true;
}

function generateSecureOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", OTP_PEPPER)
    .update(`${String(email).trim().toLowerCase()}:${String(otp).trim()}`)
    .digest("hex");
}

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error("Missing RECAPTCHA_SECRET_KEY environment variable.");
    return {
      ok: false,
      configError: true,
      errorCodes: ["missing-secret-key"],
    };
  }

  const cleanToken = String(token || "").trim();
  if (!cleanToken || cleanToken.length > 4096) {
    return {
      ok: false,
      configError: false,
      errorCodes: ["missing-input-response"],
    };
  }

  const params = new URLSearchParams();
  params.append("secret", RECAPTCHA_SECRET_KEY);
  params.append("response", cleanToken);

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    return {
      ok: false,
      configError: false,
      errorCodes: [`http_${response.status}`],
    };
  }

  const data = await response.json();
  const errorCodes = Array.isArray(data && data["error-codes"])
    ? data["error-codes"]
    : [];

  if (!data || data.success !== true) {
    console.warn("reCAPTCHA siteverify rejected:", {
      hostname: data && data.hostname,
      errorCodes,
    });
    return { ok: false, configError: false, errorCodes };
  }

  return { ok: true, configError: false, errorCodes: [] };
}

module.exports = async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.");
      return res.status(500).json({
        ok: false,
        success: false,
        error: "Email service is not configured on the server.",
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
      return res.status(500).json({
        ok: false,
        success: false,
        error: "Database configuration is missing on the server.",
      });
    }

    let body = req.body || {};
    if (typeof req.body === "string") {
      try {
        body = JSON.parse(req.body || "{}");
      } catch (_) {
        return res.status(400).json({
          ok: false,
          success: false,
          error: "Invalid JSON request body.",
        });
      }
    }

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Request body must be a JSON object.",
      });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const purpose = String(body.purpose || "verification").trim().toLowerCase();
    const isResend = Boolean(body.isResend);
    const recaptchaToken = String(
      body.recaptchaToken || body.token || body["g-recaptcha-response"] || ""
    ).trim();

    if (!isValidRealEmail(email)) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Please enter a valid, non-temporary email address.",
      });
    }

    if (!isResend) {
      const captchaResult = await verifyRecaptcha(recaptchaToken);
      if (!captchaResult.ok) {
        if (captchaResult.configError) {
          return res.status(500).json({
            ok: false,
            success: false,
            error: "reCAPTCHA verification is not configured on the server.",
          });
        }

        return res.status(400).json({
          ok: false,
          success: false,
          error: `reCAPTCHA verification failed${
            captchaResult.errorCodes.length
              ? ` (${captchaResult.errorCodes.join(", ")})`
              : ""
          }.`,
          errorCodes: captchaResult.errorCodes,
        });
      }
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    if (purpose !== "reset-password") {
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from("profiles")
        .select("id, is_locked")
        .ilike("email", email)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Failed checking existing profile:", profileCheckError);
      }

      if (existingProfile) {
        return res.status(409).json({
          ok: false,
          success: false,
          alreadyExists: true,
          error: "An account already exists with this email address.",
        });
      }
    }

    const { data: latestOtp } = await supabaseAdmin
      .from("email_otps")
      .select("created_at")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestOtp && latestOtp.created_at) {
      const elapsedMs = Date.now() - new Date(latestOtp.created_at).getTime();
      if (elapsedMs >= 0 && elapsedMs < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        return res.status(429).json({
          ok: false,
          success: false,
          error: `Please wait ${waitSeconds}s before requesting another OTP.`,
          retryAfterSeconds: waitSeconds,
        });
      }
    }

    const otp = generateSecureOtp();
    const otpHash = hashOtp(email, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { data: insertedOtp, error: dbError } = await supabaseAdmin
      .from("email_otps")
      .insert({
        email,
        otp: otpHash,
        expires_at: expiresAt,
        verified: false,
      })
      .select("id")
      .single();

    if (dbError || !insertedOtp?.id) {
      console.error("Failed to store OTP in email_otps:", dbError);
      return res.status(500).json({
        ok: false,
        success: false,
        error: "Failed to store OTP in database.",
      });
    }

    await supabaseAdmin
      .from("email_otps")
      .delete()
      .ilike("email", email)
      .neq("id", insertedOtp.id);

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

    const safeOtp = escapeHtml(otp);
    const isReset = purpose === "reset-password";
    const actionText = isReset
      ? "reset your password"
      : "complete your verification";

    try {
      await transporter.sendMail({
        from: `"Autrobook" <${GMAIL_USER}>`,
        replyTo: GMAIL_USER,
        to: email,
        subject: isReset
          ? "Your Autrobook Password Reset 6-Digit OTP"
          : "Your Autrobook 6-Digit Verification OTP",
        text: `Your Autrobook verification code is ${otp} to ${actionText}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
            <h2 style="color:#0F5132;margin-top:0;">Autrobook Verification</h2>
            <p style="color:#202124;">Use the 6-digit OTP below to ${escapeHtml(actionText)}:</p>
            <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;padding:12px 16px;border-radius:8px;text-align:center;color:#202124;">
              ${safeOtp}
            </div>
            <p style="font-size:12px;color:#5F6368;margin-top:14px;">This code is valid for 10 minutes.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      await supabaseAdmin.from("email_otps").delete().eq("id", insertedOtp.id);
      throw mailErr;
    }

    return res.status(200).json({
      ok: true,
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (err) {
    console.error("send-otp unexpected error:", err);
    return res.status(500).json({
      ok: false,
      success: false,
      error: "Unexpected server error while sending OTP.",
    });
  }
};
