export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try{
    let body = req.body;
    if(typeof body === 'string') body = JSON.parse(body);
    const { email, otp } = body;

    const store = globalThis.__otpStore;
    if(!store) return res.status(400).json({ success:false, message: 'Please send OTP first' });

    const record = store.get(email);
    if(!record) return res.status(400).json({ success:false, message: 'OTP not found. Send OTP again.' });
    if(Date.now() > record.expiry){ store.delete(email); return res.status(400).json({ success:false, message: 'OTP expired. Resend OTP.' }); }
    if(record.attempts >= 3){ store.delete(email); return res.status(400).json({ success:false, message: 'Too many wrong attempts. Resend OTP.' }); }

    if(String(otp).trim() === record.otp){
      store.delete(email);
      return res.status(200).json({ success:true, message: 'Verified!' });
    } else {
      record.attempts++;
      return res.status(400).json({ success:false, message: `Wrong OTP (${record.attempts}/3)` });
    }
  }catch(e){
    return res.status(500).json({ success:false, message: e.message });
  }
}
