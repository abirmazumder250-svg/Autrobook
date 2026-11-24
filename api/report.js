// api/report.js - Vercel Serverless Function
// Env: GMAIL_USER, GMAIL_APP_PASSWORD, SUPPORT_EMAIL
const nodemailer = require('nodemailer');

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
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function sanitizeText(value, fallback = '', maxLen = 200) {
  const cleaned = String(value ?? '').trim().slice(0, maxLen);
  return cleaned || fallback;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim().toLowerCase());
}

module.exports = async function handler(req, res) {
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

  try {
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

    const reason = sanitizeText(body.reason, '', 120);
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Report reason is required.'
      });
    }

    const gmailUser = String(process.env.GMAIL_USER || '').trim();
    const gmailAppPassword = String(process.env.GMAIL_APP_PASSWORD || '')
      .replace(/\s+/g, '')
      .trim();
    const supportEmail = String(
      process.env.SUPPORT_EMAIL || gmailUser || 'autrobooksupport@gmail.com'
    ).trim();

    if (!gmailUser || !gmailAppPassword) {
      console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.');
      return res.status(500).json({
        success: false,
        error: 'Server mail configuration is missing.'
      });
    }

    const type = sanitizeText(body.type, 'Comment', 60);
    const postId = sanitizeText(body.postId, 'N/A', 120);
    const commentId = sanitizeText(body.commentId, '', 120);
    const commentText = sanitizeText(body.commentText, 'N/A', 200);
    const reporterName = sanitizeText(body.reporterName, 'User', 120);
    const rawReporterEmail = String(body.reporterEmail || '').trim().toLowerCase();
    const reporterEmail = isValidEmail(rawReporterEmail) ? rawReporterEmail : '';
    const reasonLabel = sanitizeText(body.reasonLabel, reason, 140);
    const details = sanitizeText(body.details, '-', 2000);
    const reportedUser = sanitizeText(body.reportedUser, 'Unknown', 120);

    const reportId = 'AB-' + Date.now().toString().slice(-6);
    const reviewDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const reviewText = reviewDeadline.toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const safeReportId = escapeHtml(reportId);
    const safeReporterName = escapeHtml(reporterName);
    const safeReporterEmail = escapeHtml(reporterEmail || 'Not provided');
    const safeReasonLabel = escapeHtml(reasonLabel);
    const safeReason = escapeHtml(reason);
    const safeType = escapeHtml(type);
    const safeCommentId = escapeHtml(commentId);
    const safeCommentText = escapeHtml(commentText);
    const safeReportedUser = escapeHtml(reportedUser);
    const safeReviewText = escapeHtml(reviewText);
    const safeDetails = escapeHtml(details).replace(/\n/g, '<br>');
    const safePostId = escapeHtml(postId);
    const safeSupportEmail = escapeHtml(supportEmail);

    // 1. Auto-acknowledgment email to reporter
    if (reporterEmail) {
      await transporter.sendMail({
        from: `"Autrobook Support" <${gmailUser}>`,
        replyTo: supportEmail,
        to: reporterEmail,
        subject: `Report Received - ${reportId} | Autrobook Safety Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #ffffff; color: #202124;">
            <div style="background: #043D22; color: #ffffff; padding: 20px; border-radius: 12px; text-align: center;">
              <h2 style="margin: 0;">Autrobook</h2>
              <p style="margin: 6px 0 0;">Safety First Social</p>
            </div>
            <h3>Hello ${safeReporterName},</h3>
            <p>Thank you for reporting. Your report has been received and is now under review.</p>
            <div style="background: #f0f2f5; padding: 16px; border-radius: 12px;">
              <p style="margin: 6px 0;"><b>Report ID:</b> ${safeReportId}</p>
              <p style="margin: 6px 0;"><b>Reason:</b> ${safeReasonLabel}</p>
              <p style="margin: 6px 0;"><b>Type:</b> ${safeType}${safeCommentId ? ' - ' + safeCommentId : ''}</p>
              <p style="margin: 6px 0;"><b>Reported Content:</b> ${safeCommentText}</p>
              <p style="margin: 6px 0;"><b>Reported User:</b> ${safeReportedUser}</p>
              <p style="margin: 6px 0;"><b>Status:</b> Under Review</p>
              <p style="margin: 6px 0;"><b>Review Time:</b> Within 24-48 Hours</p>
              <p style="margin: 6px 0;"><b>Expected Reply By:</b> ${safeReviewText} (Dhaka Time)</p>
            </div>
            <p>Our Safety Team will review this report within <b>24-48 hours</b>. If the content violates our Community Standards or applicable laws, we will take appropriate action.</p>
            <p>If this is urgent, contact us at <b>${safeSupportEmail}</b></p>
            <p style="color: #5f6368; font-size: 12px;">This is an automated message. For support, contact ${safeSupportEmail}.<br>Autrobook</p>
          </div>
        `
      });
    }

    // 2. Notification email to support/moderation team
    await transporter.sendMail({
      from: `"Autrobook Report System" <${gmailUser}>`,
      replyTo: reporterEmail || gmailUser,
      to: supportEmail,
      subject: `NEW REPORT ${reportId} - ${reasonLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h3 style="margin: 0 0 12px; color: #0F5132;">New Report ${safeReportId}</h3>
          <p style="margin: 6px 0;"><b>Reporter:</b> ${safeReporterName} (${safeReporterEmail})</p>
          <p style="margin: 6px 0;"><b>Reason:</b> ${safeReasonLabel} (${safeReason})</p>
          <p style="margin: 6px 0;"><b>Details:</b> ${safeDetails}</p>
          <p style="margin: 6px 0;"><b>Content:</b> ${safeCommentText}</p>
          <p style="margin: 6px 0;"><b>Reported User:</b> ${safeReportedUser}</p>
          <p style="margin: 6px 0;"><b>Post:</b> ${safePostId} | <b>Comment:</b> ${safeCommentId || 'N/A'}</p>
          <p style="margin: 12px 0 0; font-size: 12px; color: #5f6368;">Target review window: 24-48 hours.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      reportId,
      reviewBy: reviewText
    });
  } catch (err) {
    console.error('api/report error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process and send report email.'
    });
  }
};
