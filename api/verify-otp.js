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
const OTP_PEPPER = String(process.env.OTP_PEPPER || SUPABASE_SERVICE_ROLE_KEY || "");

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

function isStrongPassword(pw) {
  const s = String(pw || "");
  return s.length >= 8 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s);
}

function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", OTP_PEPPER)
    .update(`${String(email).trim().toLowerCase()}:${String(otp).trim()}`)
    .digest("hex");
}

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a || ""), "utf8");
  const bufB = Buffer.from(String(b || ""), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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

async function findAuthUserIdByEmail(supabaseAdmin, cleanEmail) {
  const { data: profileRow } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (profileRow?.id) {
    return profileRow.id;
  }

  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const users = data?.users || [];
    const matched = users.find(
      (u) => String(u.email || "").trim().toLowerCase() === cleanEmail
    );
    if (matched) return matched.id;

    if (users.length < perPage) break;
    page++;
  }

  return null;
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
      return res.status(500).json({
        success: false,
        code: "SUPABASE_CONFIG_MISSING",
        message: "Server configuration error: Supabase credentials are missing.",
      });
    }

    if (!OTP_PEPPER) {
      return res.status(500).json({
        success: false,
        code: "OTP_PEPPER_MISSING",
        message: "Server configuration error: OTP pepper is missing.",
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

    const { email, otp, password, newPassword, profile } = body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();
    const isPasswordReset = newPassword !== undefined;
    const rawPassword = isPasswordReset
      ? String(newPassword || "")
      : String(password || "");

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

    if (!isStrongPassword(rawPassword)) {
      return res.status(400).json({
        success: false,
        code: "WEAK_PASSWORD",
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and a number.",
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

    const storedOtp = String(otpRecord.otp || "").trim();
    const expectedHash = hashOtp(cleanEmail, cleanOtp);
    const isMatch =
      (/^\d{6}$/.test(storedOtp) && timingSafeEqualStr(storedOtp, cleanOtp)) ||
      timingSafeEqualStr(storedOtp, expectedHash);

    if (!isMatch) {
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

    let userId = null;

    if (isPasswordReset) {
      userId = await findAuthUserIdByEmail(supabaseAdmin, cleanEmail);
      if (!userId) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "No account found for this email address.",
        });
      }

      const { error: passUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: rawPassword,
        });

      if (passUpdateError) {
        console.error("Failed to update auth user password:", passUpdateError);
        return res.status(500).json({
          success: false,
          code: "PASSWORD_UPDATE_FAILED",
          message: "Could not update password. Please try again.",
        });
      }
    } else {
      const existingUserId = await findAuthUserIdByEmail(supabaseAdmin, cleanEmail);
      if (existingUserId) {
        return res.status(409).json({
          success: false,
          alreadyExists: true,
          code: "USER_EXISTS",
          message: "An account already exists with this email address.",
        });
      }

      const cleanName =
        profile && typeof profile.full_name === "string" && profile.full_name.trim()
          ? profile.full_name.trim().slice(0, 120)
          : "User";
      const cleanDob =
        profile && typeof profile.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(profile.dob)
          ? profile.dob
          : "2000-01-01";
      const cleanLang =
        profile && typeof profile.language === "string" && profile.language.trim()
          ? profile.language.trim().slice(0, 16)
          : "en";
      const faceHash =
        profile && typeof profile.faceHash === "string" && profile.faceHash.trim()
          ? profile.faceHash.trim()
          : null;
      const fingerprintHash =
        profile && typeof profile.fingerprintHash === "string" && profile.fingerprintHash.trim()
          ? profile.fingerprintHash.trim()
          : null;

      if (faceHash) {
        const { data: dupFace } = await supabaseAdmin
          .from("biometric_registry")
          .select("id")
          .eq("face_hash", faceHash)
          .maybeSingle();

        if (dupFace) {
          return res.status(409).json({
            success: false,
            code: "DUPLICATE_FACE",
            message: "This face is already registered with another account.",
          });
        }
      }

      if (fingerprintHash) {
        const { data: dupFp } = await supabaseAdmin
          .from("biometric_registry")
          .select("id")
          .eq("fingerprint_hash", fingerprintHash)
          .maybeSingle();

        if (dupFp) {
          return res.status(409).json({
            success: false,
            code: "DUPLICATE_FINGERPRINT",
            message: "This fingerprint is already registered with another account.",
          });
        }
      }

      const { data: createdAuth, error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: rawPassword,
          email_confirm: true,
          user_metadata: { full_name: cleanName },
        });

      if (createAuthError || !createdAuth?.user?.id) {
        console.error("Failed to create auth user:", createAuthError);
        return res.status(500).json({
          success: false,
          code: "AUTH_CREATE_FAILED",
          message: "Failed to create account.",
        });
      }

      userId = createdAuth.user.id;

      const { error: profileInsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: cleanName,
            email: cleanEmail,
            dob: cleanDob,
            language: cleanLang,
            face_hash: faceHash,
            fingerprint_hash: fingerprintHash,
            is_locked: false,
          },
          { onConflict: "id" }
        );

      if (profileInsertError) {
        console.error("Failed to upsert profile:", profileInsertError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({
          success: false,
          code: "PROFILE_CREATE_FAILED",
          message: "Failed to initialize user profile. Please try again.",
        });
      }

      if (faceHash || fingerprintHash) {
        const { error: bioInsertError } = await supabaseAdmin
          .from("biometric_registry")
          .insert({
            user_id: userId,
            email: cleanEmail,
            face_hash: faceHash,
            fingerprint_hash: fingerprintHash,
            is_locked: false,
          });

        if (bioInsertError) {
          console.error("Failed to insert biometric_registry:", bioInsertError);
          await supabaseAdmin.auth.admin.deleteUser(userId);
          const isConflict = bioInsertError.code === "23505";
          return res.status(isConflict ? 409 : 500).json({
            success: false,
            code: "BIOMETRIC_REGISTER_FAILED",
            message: isConflict
              ? "Biometric data is already registered with another account."
              : "Could not save biometric verification data.",
          });
        }
      }
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
          subject: isPasswordReset
            ? "Your Autrobook Password Was Reset"
            : "Welcome to Autrobook - Account Verified",
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;max-width:500px;margin:auto;border:1px solid #e4e6e9;border-radius:14px;background:#ffffff">
              <div style="background:#0F5132;padding:18px;border-radius:10px;text-align:center;margin-bottom:20px">
                <h2 style="color:#ffffff;margin:0;font-size:20px">Autrobook</h2>
              </div>
              <h3 style="margin:0 0 10px;color:#202124">Hi ${safeName},</h3>
              <p style="color:#374151;margin:0 0 12px">${
                isPasswordReset
                  ? `Your password for (<b>${esc(cleanEmail)}</b>) has been reset successfully.`
                  : `Your email (<b>${esc(cleanEmail)}</b>) has been verified and your Autrobook account is ready.`
              }</p>
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
      code: isPasswordReset ? "PASSWORD_UPDATED" : "ACCOUNT_CREATED",
      message: isPasswordReset
        ? "Password updated successfully."
        : "Account created and verified successfully.",
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
