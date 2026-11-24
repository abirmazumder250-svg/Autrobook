import crypto from "crypto";

const ALLOWED_ORIGINS = new Set([
  "https://autrobook.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000"
]);

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ""), "utf8");
  const bufB = Buffer.from(String(b || ""), "utf8");
  if (bufA.length === 0 || bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseRequestBody(req) {
  if (!req || req.body === undefined || req.body === null) {
    return { ok: true, data: {} };
  }
  if (typeof req.body === "object") {
    return { ok: true, data: req.body };
  }
  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body || "{}");
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, data: null };
      }
      return { ok: true, data: parsed };
    } catch (_) {
      return { ok: false, data: null };
    }
  }
  return { ok: false, data: null };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim().toLowerCase());
}

export default async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      verified: false,
      valid: false,
      error: "Method not allowed. Use POST."
    });
  }

  try {
    const expectedSecret = String(
      process.env.VERIFY_PASSWORD ||
        process.env.VERIFY_PASSWORD_SECRET ||
        process.env.GOOGLE_APP_PASSWORD ||
        ""
    ).trim();

    if (!expectedSecret) {
      console.error("Verification secret is missing in environment variables.");
      return res.status(500).json({
        success: false,
        verified: false,
        valid: false,
        error: "Verification secret is not configured on the server."
      });
    }

    const parsedBody = parseRequestBody(req);
    if (!parsedBody.ok) {
      return res.status(400).json({
        success: false,
        verified: false,
        valid: false,
        error: "Invalid JSON request body."
      });
    }

    const body = parsedBody.data;
    const rawPassword = body.verifyPassword ?? body.secret ?? body.password ?? "";
    if (typeof rawPassword !== "string") {
      return res.status(400).json({
        success: false,
        verified: false,
        valid: false,
        error: "Invalid password format."
      });
    }

    const providedPassword = rawPassword.trim();
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);

    if (!providedPassword || providedPassword.length > 512) {
      return res.status(400).json({
        success: false,
        verified: false,
        valid: false,
        error: "A valid verify password is required."
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        verified: false,
        valid: false,
        error: "Invalid email address format."
      });
    }

    const isMatched = safeEqual(providedPassword, expectedSecret);

    if (!isMatched) {
      return res.status(401).json({
        success: false,
        verified: false,
        valid: false,
        error: "Verification failed. Password did not match."
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      valid: true,
      email: email || null,
      status: "verified",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("verify-password unexpected error:", err);
    return res.status(500).json({
      success: false,
      verified: false,
      valid: false,
      error: "Internal server error while verifying password."
    });
  }
}
