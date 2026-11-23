const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_USER = (process.env.GMAIL_USER || "").trim();
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || "")
  .replace(/\s+/g, "")
  .trim();

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        code: "SUPABASE_CONFIG_MISSING",
        message: "SUPABASE_SERVICE_ROLE_KEY is missing in Vercel Environment Variables.",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res
          .status(400)
          .json({ success: false, code: "INVALID_JSON" });
      }
    }

    const { email, otp, profile } = body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return res
        .status(400)
        .json({ success: false, code: "INVALID_EMAIL" });
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res
        .status(400)
        .json({ success: false, code: "OTP_INVALID" });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Fetch latest OTP record for this email
    const { data: otpRecord, error: otpFetchError } = await supabaseAdmin
      .from("email_otps")
      .select("id, otp, expires_at, verified")
      .eq("email", cleanEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpFetchError || !otpRecord) {
      return res.status(400).json({
        success: false,
        code: "OTP_NOT_FOUND",
        message: "No OTP found for this email. Please request a new OTP.",
      });
    }

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        code: "OTP_ALREADY_USED",
        message: "This OTP has already been used.",
      });
    }

    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("email_otps").delete().eq("id", otpRecord.id);
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (otpRecord.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        code: "OTP_MISMATCH",
        message: "Incorrect 6-digit OTP.",
      });
    }

    // 2. Delete used OTP so it cannot be reused
    await supabaseAdmin.from("email_otps").delete().eq("id", otpRecord.id);

    // 3. Mark profile as verified in Supabase
    const updatePayload = {
      is_verified: true,
      verified_at: new Date().toISOString(),
    };

    if (profile && typeof profile.full_name === "string" && profile.full_name.trim()) {
      updatePayload.full_name = profile.full_name.trim();
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("email", cleanEmail);

    if (profileUpdateError) {
      return res.status(500).json({
        success: false,
        code: "PROFILE_UPDATE_FAILED",
        message: profileUpdateError.message,
      });
    }

    // 4. Optional confirmation email (without sending password)
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

        const cleanName = esc(
          profile && profile.full_name ? String(profile.full_name).trim() : "User"
        );

        await transporter.sendMail({
          from: `"Autrobook" <${GMAIL_USER}>`,
          replyTo: GMAIL_USER,
          to: cleanEmail,
          subject: "Your Autrobook Account is Verified",
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;max-width:500px;margin:auto;border:1px solid #e4e6e9;border-radius:14px;background:#fff">
              <div style="background:#0B3D20;padding:18px;border-radius:10px;text-align:center;margin-bottom:20px">
                <h2 style="color:#fff;margin:0;font-size:20px">Autrobook</h2>
              </div>
              <h3 style="margin:0 0 10px;color:#050505">Hi ${cleanName},</h3>
              <p style="color:#374151;margin:0 0 12px">Your email (<b>${esc(cleanEmail)}</b>) has been verified successfully.</p>
              <p style="color:#6b7280;font-size:12px;margin:18px 0 0">&copy; 2026 Autrobook</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn("Confirmation email warning:", mailErr?.message || mailErr);
      }
    }

    return res.status(200).json({
      success: true,
      code: "VERIFIED",
      message: "OTP verified successfully.",
    });
  } catch (e) {
    console.error("verify-otp error:", e);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: e && e.message ? e.message : "Unexpected server error.",
    });
  }
};
