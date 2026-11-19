import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetType, targetId, reportedUserId, reporterName, reason, details } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,       // Your Gmail address in Vercel Env
        pass: process.env.GOOGLE_APP_PASSWORD // Your Google App Password in Vercel Env
      }
    });

    await transporter.sendMail({
      from: `"Autrobook Moderation" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[Autrobook Report] ${targetType.toUpperCase()} - ${reason}`,
      html: `
        <h3>New ${targetType} Report on Autrobook</h3>
        <p><strong>Reported By:</strong> ${reporterName}</p>
        <p><strong>Target Type:</strong> ${targetType}</p>
        <p><strong>Target ID:</strong> ${targetId}</p>
        <p><strong>Reported User ID:</strong> ${reportedUserId || 'N/A'}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Details:</strong> ${details || 'None provided'}</p>
        <hr>
        <p>Review Window: 5–6 days (AI triage: 1–2 days).</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
