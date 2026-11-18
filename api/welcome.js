// api/welcome.js - Welcome Email via Gmail App Password
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ message: 'Welcome API is running ✅' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    // ✅ FIX 1: Parse body even if it comes as String
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { name, email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // ✅ Env Check - Clear error if not set in Vercel
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: 'GMAIL_USER / GMAIL_APP_PASSWORD missing in Vercel Env' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: '"Autrobook" <autrobooksupport@gmail.com>',
      to: email,
      subject: 'Welcome to Autrobook 🎉 - Verify Your Account',
      html: `<div style="font-family:Arial;padding:20px;max-width:600px">
        <div style="background:#043D22;color:#fff;padding:20px;border-radius:12px;text-align:center">
          <h2>Welcome to Autrobook, ${name || 'Friend'}!</h2>
        </div>
        <p>Your account has been created successfully.</p>
        <p><b>What you can do now:</b></p>
        <ul>
          <li>Post, Story, Reel</li>
          <li>Comment with Voice (Normal / Echo / Deep)</li>
          <li>React ❤️👍😆😮😢😠</li>
          <li>Live after 90 days (Owner: Always)</li>
        </ul>
        <p>Need help? Email <b>autrobooksupport@gmail.com</b></p>
      </div>`
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
