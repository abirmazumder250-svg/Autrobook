import nodemailer from 'nodemailer';

const ALLOWED_ORIGINS = new Set([
  'https://autrobook.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000'
]);

function applyCorsHeaders(req, res) {
  const origin = String(req.headers.origin || '').trim();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeField(value, fallback, maxLen = 160) {
  const cleaned = String(value ?? '').trim().slice(0, maxLen);
  return cleaned || fallback;
}

export default async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON request body.'
      });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Request body must be a JSON object.'
    });
  }

  const targetType = sanitizeField(body.targetType, 'content', 60);
  const targetId = sanitizeField(body.targetId, 'N/A', 120);
  const reportedUserId = sanitizeField(body.reportedUserId, 'N/A', 120);
  const reporterName = sanitizeField(body.reporterName, 'Anonymous', 120);
  const reason = sanitizeField(body.reason, 'Unspecified', 140);
  const details = sanitizeField(body.details, 'None provided', 2000);

  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim();
  const appPassword = String(process.env.GOOGLE_APP_PASSWORD || '')
    .replace(/\s+/g, '')
    .trim();

  if (!adminEmail || !appPassword) {
    console.error('Missing ADMIN_EMAIL or GOOGLE_APP_PASSWORD environment variables.');
    return res.status(500).json({
      success: false,
      error: 'Server mail configuration is missing.'
    });
  }

  const safeTargetType = escapeHtml(targetType);
  const safeTargetId = escapeHtml(targetId);
  const safeReportedUserId = escapeHtml(reportedUserId);
  const safeReporterName = escapeHtml(reporterName);
  const safeReason = escapeHtml(reason);
  const safeDetails = escapeHtml(details).replace(/\n/g, '<br>');
  const upperTargetType = targetType.toUpperCase();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: adminEmail,
        pass: appPassword
      }
    });

    await transporter.sendMail({
      from: `"Autrobook Moderation" <${adminEmail}>`,
      replyTo: adminEmail,
      to: adminEmail,
      subject: `[Autrobook Report] ${upperTargetType} - ${reason}`,
      text: [
        `New ${targetType} Report on Autrobook`,
        `Reported By: ${reporterName}`,
        `Target Type: ${targetType}`,
        `Target ID: ${targetId}`,
        `Reported User ID: ${reportedUserId}`,
        `Reason: ${reason}`,
        `Details: ${details}`,
        'Review Window: 5–6 days (AI triage: 1–2 days).'
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h3 style="margin: 0 0 12px; color: #0F5132;">New ${safeTargetType} Report on Autrobook</h3>
          <p style="margin: 6px 0; color: #202124;"><strong>Reported By:</strong> ${safeReporterName}</p>
          <p style="margin: 6px 0; color: #202124;"><strong>Target Type:</strong> ${safeTargetType}</p>
          <p style="margin: 6px 0; color: #202124;"><strong>Target ID:</strong> ${safeTargetId}</p>
          <p style="margin: 6px 0; color: #202124;"><strong>Reported User ID:</strong> ${safeReportedUserId}</p>
          <p style="margin: 6px 0; color: #202124;"><strong>Reason:</strong> ${safeReason}</p>
          <p style="margin: 6px 0; color: #202124;"><strong>Details:</strong> ${safeDetails}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 14px 0;">
          <p style="margin: 0; font-size: 12px; color: #5F6368;">Review Window: 5–6 days (AI triage: 1–2 days).</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Report submitted successfully.'
    });
  } catch (error) {
    console.error('report-submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send report email.'
    });
  }
}
