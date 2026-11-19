export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ verified: false, error: "Method not allowed" });
  }

  const expectedSecret =
    process.env.GOOGLE_APP_PASSWORD ||
    process.env.VERIFY_PASSWORD ||
    "";

  if (!expectedSecret.trim()) {
    return res.status(500).json({
      verified: false,
      error: "Verification secret is not configured in Vercel environment variables"
    });
  }

  const provided = String(req.body?.verifyPassword || "").trim();
  if (!provided || provided !== expectedSecret.trim()) {
    return res.status(401).json({
      verified: false,
      error: "Verify password did not match"
    });
  }

  return res.status(200).json({ verified: true });
}
