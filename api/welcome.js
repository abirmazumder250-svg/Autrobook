// api/welcome.js - Welcome Email via Gmail App Password
const nodemailer = require('nodemailer');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(req.method==='OPTIONS') return res.status(200).end();
  try{
    const { name, email } = req.body || {};
    if(!email) return res.status(400).json({ error:'Email required' });
    const transporter = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.GMAIL_USER, pass:process.env.GMAIL_APP_PASSWORD } });
    await transporter.sendMail({
      from:'"Autrobook" <autrobooksupport@gmail.com>',
      to: email,
      subject:'Welcome to Autrobook 🎉 - Verify Your Account',
      html:`<div style="font-family:Arial;padding:20px;max-width:600px"><div style="background:#043D22;color:#fff;padding:20px;border-radius:12px;text-align:center"><h2>Welcome to Autrobook, ${name||'Friend'}!</h2></div><p>Your account has been created successfully.</p><p><b>What you can do now:</b></p><ul><li>Post, Story, Reel</li><li>Comment with Voice (Normal / Echo / Deep)</li><li>React ❤️👍😆😮😢😠</li><li>Live after 90 days (Owner: Always)</li></ul><p>Need help? Email <b>autrobooksupport@gmail.com</b></p></div>`
    });
    return res.status(200).json({ success:true });
  }catch(e){ return res.status(500).json({ error:e.message }); }
};
