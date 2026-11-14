import { useState, useEffect } from 'react'

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const [email] = useState(localStorage.getItem('autrobook_email'));

  // Timer countdown
  useEffect(() => {
    if(timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (s) => `0${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const handleVerify = async () => {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    
    if(data.success) {
      alert('Login Success');
      window.location.href = '/dashboard';
    } else {
      alert(data.message);
    }
  }

  const handleResend = async () => {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: localStorage.getItem('autrobook_name'), otp: Math.floor(100000 + Math.random() * 900000) })
    });
    const data = await res.json();
    if(data.success) {
      setTimer(300);
      alert('New OTP Sent');
    }
  }

  return (
    <div>
      <h2>Enter OTP</h2>
      <p>OTP will expire in {formatTime(timer)} minutes</p>
      <input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
      <button onClick={handleVerify}>Verify OTP</button>
      <button onClick={handleResend}>Resend OTP</button>
      {timer <= 0 && <p style={{color: 'green'}}>OTP Expired. Resend new OTP</p>}
    </div>
  )
}
