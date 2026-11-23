import crypto from "crypto";

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
    return {};
  }
  if (typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }
  return {};
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      verified: false,
      valid: false,
      error: "Method not allowed. Use POST."
    });
  }

  try {
    const expectedSecret = String(
      process.env.GOOGLE_APP_PASSWORD ||
        process.env.VERIFY_PASSWORD ||
        process.env.VERIFY_PASSWORD_SECRET ||
        ""
    ).trim();

    if (!expectedSecret) {
      return res.status(500).json({
        verified: false,
        valid: false,
        error: "Verification secret is not configured in Vercel environment variables."
      });
    }

    const body = parseRequestBody(req);
    const providedPassword = String(
      body.verifyPassword ?? body.secret ?? body.password ?? ""
    ).trim();
    const email = String(body.email ?? "").trim();

    if (!providedPassword) {
      return res.status(400).json({
        verified: false,
        valid: false,
        error: "Verify password is required."
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        verified: false,
        valid: false,
        error: "Invalid email address format."
      });
    }

    const isMatched = safeEqual(providedPassword, expectedSecret);

    if (!isMatched) {
      return res.status(401).json({
        verified: false,
        valid: false,
        error: "Verification failed. Password did not match."
      });
    }

    return res.status(200).json({
      verified: true,
      valid: true,
      email: email || null,
      status: "verified",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      verified: false,
      valid: false,
      error: "Internal server error while verifying password."
    });
  }
}
