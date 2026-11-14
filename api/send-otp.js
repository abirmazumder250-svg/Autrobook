import { Resend } from 'resend'; 

const resend = new Resend(process.env.RESEND_API_KEY); 

export default async function handler(req, res) { 
  // Set CORS headers 
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); 
  
  if (req.method === 'OPTIONS') return res.status(200).end(); 
  if (req.method !== 'POST') { 
    return res.status(405).json({ success: false, message: 'Method not allowed' }); 
  } 
  
  try { 
    // Check if API key is configured 
    if (!process.env.RESEND_API_KEY) { 
      return res.status(500).json({ success: false, message: 'Server configuration error: Missing API key' }); 
    } 
    
    // Safely parse request body if sent as a string 
    let body = req.body; 
    if (typeof body === 'string') { 
      try { 
        body = JSON.parse(body); 
      } catch (err) { 
        return res.status(400).json({ success: false, message: 'Invalid JSON format' }); 
      } 
    } 
    
    const { email, otp, name } = body || {}; 
    
    if (!email || !otp) { 
      return res.status(400).json({ success: false, message: 'Email and OTP are required' }); 
    } 
    
    const { data, error } = await resend.emails.send({ 
      from: 'Autrobook <onboarding@resend.dev>', // Update with your verified domain in production 
      to: [email.trim()], 
      subject: 'Your Autrobook Login OTP', 
      html: ` 
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;"> 
          <h2 style="color: #111;">Hi ${name || 'User'},</h2> 
          <p style="color: #555;">Your Autrobook verification code is:</p> 
          <h1 style="letter-spacing: 5px; color: #0f5132; font-size: 32px; margin: 20px 0;">${otp}</h1> 
          <p style="color: #555; font-size: 14px;">This OTP expires in 5 minutes. Do not share it with anyone.</p> 
          <br> 
          <p style="color: #888; font-size: 13px;">- Team Autrobook</p> 
        </div> 
      ` 
    }); 
    
    if (error) { 
      console.error('Resend Error:', error); 
      return res.status(500).json({ success: false, message: error.message }); 
    } 
    
    return res.status(200).json({ success: true, message: 'OTP sent successfully', id: data?.id }); 
    
  } catch (e) { 
    console.error('Server Error:', e); 
    return res.status(500).json({ success: false, message: 'Server error: ' + e.message }); 
  } 
}
