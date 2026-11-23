// api/report.js - Vercel Serverless Function
// Env: GMAIL_USER, GMAIL_APP_PASSWORD, SUPPORT_EMAIL
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { type, postId, commentId, commentText, reporterName, reporterEmail, reason, reasonLabel, details, reportedUser } = req.body || {};
    if (!reason) return res.status(400).json({ error: 'Reason required' });

    const reportId = 'AB-' + Date.now().toString().slice(-6);
    const reviewDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const reviewText = reviewDeadline.toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // 1. EMAIL TO REPORTER - Auto Message
    if (reporterEmail) {
      await transporter.sendMail({
        from: '"Autrobook Support" <autrobooksupport@gmail.com>',
        to: reporterEmail,
        subject: `Report Received - ${reportId} | Autrobook Safety Team`,
        html: `
          <div style="font-family:Arial;padding:20px;max-width:600px">
            <div style="background:#043D22;color:#fff;padding:20px;border-radius:12px;text-align:center"><h2>Autrobook</h2><p>Safety First Social</p></div>
            <h3>Hello ${reporterName || 'User'},</h3>
            <p>Thank you for reporting. Your report has been received and is now under review.</p>
            <div style="background:#f0f2f5;padding:16px;border-radius:12px">
              <p><b>Report ID:</b> ${reportId}</p>
              <p><b>Reason:</b> ${reasonLabel || reason}</p>
              <p><b>Type:</b> ${type || 'Comment'} ${commentId ? '- ' + commentId : ''}</p>
              <p><b>Reported Content:</b> ${(commentText || '').substring(0, 200)}</p>
              <p><b>Reported User:</b> ${reportedUser || 'Unknown'}</p>
              <p><b>Status:</b> Under Review</p>
              <p><b>Review Time:</b> Within 24-48 Hours</p>
              <p><b>Expected Reply By:</b> ${reviewText} (Dhaka Time)</p>
            </div>
            <p>Our Safety Team will review this report within <b>24-48 hours</b>. If the content violates our Community Standards / Bangladesh ICT Act, we will take action (Remove / Warn / Suspend).</p>
            <p>If this is an emergency, contact us immediately at <b>autrobooksupport@gmail.com</b></p>
            <p style="color:#888;font-size:12px">This is an automated email. Please do not reply directly. For help, email autrobooksupport@gmail.com<br>Autrobook • Safe • Mindful • Ad-free</p>
          </div>
        `
      });
    }

    // 2. EMAIL TO ADMIN / SUPPORT TEAM
    await transporter.sendMail({
      from: '"Autrobook Report System" <autrobooksupport@gmail.com>',
      to: process.env.SUPPORT_EMAIL || 'autrobooksupport@gmail.com',
      subject: `🚨 NEW REPORT ${reportId} - ${reasonLabel || reason}`,
      html: `<h3>New Report ${reportId}</h3><p><b>Reporter:</b> ${reporterName} (${reporterEmail})</p><p><b>Reason:</b> ${reasonLabel} (${reason})</p><p><b>Details:</b> ${details || '-'}</p><p><b>Content:</b> ${commentText}</p><p><b>Reported User:</b> ${reportedUser}</p><p><b>Post:</b> ${postId} | <b>Comment:</b> ${commentId}</p><p>Review within 24-48h.</p>`
    });

    return res.status(200).json({ success: true, reportId, reviewBy: reviewText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Email failed: ' + err.message });
  }
};
