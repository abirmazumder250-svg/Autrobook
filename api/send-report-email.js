import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const {
    targetType = 'content',
    targetId = 'N/A',
    reportedUserId = 'N/A',
    reporterName = 'Anonymous',
    reason = 'Unspecified',
    details = ''
  } = body || {};

  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim();
  const appPassword = String(process.env.GOOGLE_APP_PASSWORD || '').trim();

  if (!adminEmail || !appPassword) {
    return res.status(500).json({
      error: 'ADMIN_EMAIL or GOOGLE_APP_PASSWORD is missing in Vercel environment variables'
    });
  }

  const safeTargetType = escapeHtml(targetType);
  const safeTargetId = escapeHtml(targetId);
  const safeReportedUserId = escapeHtml(reportedUserId || 'N/A');
  const safeReporterName = escapeHtml(reporterName || 'Anonymous');
  const safeReason = escapeHtml(reason || 'Unspecified');
  const safeDetails = escapeHtml(details || 'None provided').replace(/\n/g, '<br>');
  const upperTargetType = String(targetType || 'REPORT').trim().toUpperCase();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: adminEmail,
        pass: appPassword
      }
    });

    await transporter.sendMail({
      from: `"Autrobook Moderation" <${adminEmail}>`,
      to: adminEmail,
      subject: `[Autrobook Report] ${upperTargetType} - ${String(reason || 'General').trim()}`,
      text: [
        `New ${targetType} Report on Autrobook`,
        `Reported By: ${reporterName}`,
        `Target Type: ${targetType}`,
        `Target ID: ${targetId}`,
        `Reported User ID: ${reportedUserId || 'N/A'}`,
        `Reason: ${reason}`,
        `Details: ${details || 'None provided'}`,
        `Review Window: 5–6 days (AI triage: 1–2 days).`
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h3 style="margin: 0 0 12px; color: #0F5132;">New ${safeTargetType} Report on Autrobook</h3>
          <p style="margin: 6px 0;"><strong>Reported By:</strong> ${safeReporterName}</p>
          <p style="margin: 6px 0;"><strong>Target Type:</strong> ${safeTargetType}</p>
          <p style="margin: 6px 0;"><strong>Target ID:</strong> ${safeTargetId}</p>
          <p style="margin: 6px 0;"><strong>Reported User ID:</strong> ${safeReportedUserId}</p>
          <p style="margin: 6px 0;"><strong>Reason:</strong> ${safeReason}</p>
          <p style="margin: 6px 0;"><strong>Details:</strong> ${safeDetails}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 14px 0;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Review Window: 5–6 days (AI triage: 1–2 days).</p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to send report email' });
  }
        }
