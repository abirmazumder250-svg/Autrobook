import { useState, useEffect } from 'react' 

export default function VerifyOTP() { 
  const [otp, setOtp] = useState(''); 
  const [timer, setTimer] = useState(300); // 5 minutes 
  const [loading, setLoading] = useState(false);
  const [email] = useState(localStorage.getItem('autrobook_email')); 

  // Timer countdown 
  useEffect(() => { 
    if(timer <= 0) return; 
    const interval = setInterval(() => setTimer(t => t - 1), 1000); 
    return () => clearInterval(interval); 
  }, [timer]); 

  const formatTime = (s) => `0${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; 

  const handleVerify = async () => { 
    if(otp.length !== 6) {
      alert('6 digit OTP দিন');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/verify-otp', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, otp }) 
    }); 
    const data = await res.json(); 
    setLoading(false);
    
    if(data.success) { 
      alert('Login Success'); 
      window.location.href = '/dashboard'; 
    } else { 
      alert(data.message); 
    } 
  } 

  const handleResend = async () => { 
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('autrobook_otp', newOtp); // OTP save করতে হবে
    localStorage.setItem('autrobook_otp_expiry', Date.now() + 5 * 60 * 1000);

    setLoading(true);
    const res = await fetch('/api/send-otp', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        email, 
        name: localStorage.getItem('autrobook_name'), 
        otp: newOtp 
      }) 
    }); 
    const data = await res.json(); 
    setLoading(false);

    if(data.success) { 
      setTimer(300); 
      alert('New OTP Sent'); 
    } else {
      alert(data.message);
    }
  } 

  return ( 
    <div style={{maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px'}}>
      <h2>Enter OTP</h2> 
      <p>Email: <b>{email}</b></p>
      {timer > 0 ? 
        <p>OTP will expire in <b>{formatTime(timer)}</b> minutes</p> :
        <p style={{color: 'red'}}>OTP Expired. Resend new OTP</p>
      } 
      
      <input 
        value={otp} 
        onChange={e => setOtp(e.target.value)} 
        maxLength={6} 
        placeholder="123456"
        style={{width: '100%', padding: '10px', fontSize: '18px', letterSpacing: '5px', textAlign: 'center', margin: '10px 0'}}
      /> 
      
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button> 
      
      <button onClick={handleResend} disabled={loading || timer > 0}>
        {timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend OTP'}
      </button> 
      
    </div> 
  ) 
}
