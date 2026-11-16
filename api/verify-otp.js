<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Verify OTP — Autrobook</title>
  
  <!-- FontAwesome & Supabase -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <style>
    /* ===== SYSTEM DEFAULT THEME ===== */
    :root {
      --primary: #1b5e20;       /* Dark Green */
      --primary-hover: #144817;
      --bg: #f0f2f5;
      --card: #ffffff;
      --text: #1c1e21;
      --muted: #65676b;
      --border: #e4e6e9;
      --input-bg: #fafafa;
      --error: #c62828;
      --success: #2e7d32;
      --shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --primary: #2e7d32;
        --primary-hover: #1b5e20;
        --bg: #0f1419;
        --card: #1a1f26;
        --text: #e8eaed;
        --muted: #9aa0a6;
        --border: #2a3038;
        --input-bg: #0f1419;
        --error: #ef5350;
        --success: #66bb6a;
        --shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    body {
      background-color: var(--bg); color: var(--text); display: flex; justify-content: center; align-items: center;
      min-height: 100vh; padding: 16px; position: relative; overflow: hidden;
    }

    /* Subtle Background Glow */
    body::before {
      content: ""; position: fixed; inset: 0;
      background: radial-gradient(circle at 15% 20%, rgba(46, 125, 50, 0.08) 0%, transparent 40%),
                  radial-gradient(circle at 85% 80%, rgba(46, 125, 50, 0.05) 0%, transparent 40%);
      pointer-events: none; z-index: 0;
    }

    /* ===== CARD ===== */
    .container {
      position: relative; z-index: 1; background: var(--card); width: 100%; max-width: 420px;
      padding: 36px 28px; border-radius: 20px; box-shadow: var(--shadow);
      border: 1px solid var(--border); animation: fadeUp 0.6s ease-out;
    }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* ===== HEADER ===== */
    .logo-container { text-align: center; margin-bottom: 20px; }
    .logo-container img {
      width: 72px; height: 72px; border-radius: 18px; object-fit: contain;
      background: var(--card); padding: 8px; box-shadow: 0 4px 16px rgba(27, 94, 32, 0.2);
    }

    h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; text-align: center; color: var(--text); }
    .subtitle { font-size: 14px; color: var(--muted); text-align: center; margin-bottom: 24px; line-height: 1.5; }
    .subtitle span { color: var(--primary); font-weight: 700; }

    /* ===== ALERTS ===== */
    .alert {
      display: none; padding: 12px 14px; border-radius: 10px; font-size: 13.5px; margin-bottom: 16px;
      text-align: center; font-weight: 500; align-items: center; justify-content: center; gap: 8px;
    }
    .alert-error { background-color: rgba(198, 40, 40, 0.1); color: var(--error); border: 1px solid var(--error); }
    .alert-success { background-color: rgba(46, 125, 50, 0.1); color: var(--success); border: 1px solid var(--success); }

    /* ===== MODERN 6-DIGIT OTP BOX ===== */
    .otp-container { display: flex; justify-content: space-between; gap: 8px; margin: 20px 0; }
    .otp-digit {
      width: 48px; height: 55px; text-align: center; font-size: 24px; font-weight: 700;
      border-radius: 12px; border: 1.5px solid var(--border); background: var(--input-bg);
      color: var(--text); outline: none; transition: all 0.2s;
    }
    .otp-digit:focus { border-color: var(--primary); background: var(--card); box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.15); }

    /* ===== BUTTONS ===== */
    .btn {
      width: 100%; padding: 15px; background-color: var(--primary); color: #ffffff; border: none; border-radius: 12px;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(27, 94, 32, 0.3); margin-top: 10px;
    }
    .btn:hover { background-color: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(27, 94, 32, 0.4); }
    .btn:active { transform: translateY(0) scale(0.98); }
    .btn:disabled { background-color: #9e9e9e; cursor: not-allowed; transform: none; box-shadow: none; }

    .btn-resend {
      background: transparent; color: var(--primary); border: 1.5px solid var(--primary);
      box-shadow: none; margin-top: 10px;
    }
    .btn-resend:hover { background: var(--input-bg); transform: none; box-shadow: none; }

    /* ===== FOOTER ===== */
    .footer-text { text-align: center; margin-top: 24px; font-size: 13.5px; color: var(--muted); }
    .footer-text a { color: var(--primary); font-weight: 700; text-decoration: none; }
    .footer-text a:hover { text-decoration: underline; }

    @media (max-width: 480px) {
      .container { padding: 28px 20px; }
      .otp-digit { width: 42px; height: 50px; font-size: 20px; }
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Logo -->
    <div class="logo-container">
      <img src="logo.png" alt="Autrobook Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-leaf\' style=\'font-size:40px;color:var(--primary);\'></i>';">
    </div>
    
    <!-- Header -->
    <h2>Check your email</h2>
    <p class="subtitle">We sent a 6-digit OTP to <br><span id="displayEmail">your email</span></p>

    <!-- Alerts -->
    <div id="msgBox" class="alert alert-error"></div>

    <!-- 6 Separate OTP Inputs with Auto-Paste -->
    <div class="otp-container" id="otpContainer">
      <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" id="otp1" oninput="moveToNext(this, 'otp2')" onkeydown="moveToPrev(event, this, null)">
      <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" id="otp2" oninput="moveToNext(this, 'otp3')" onkeydown="moveToPrev(event, this, 'otp1')">
      <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" id="otp3" oninput="moveToNext(this, 'otp4')" onkeydown="moveToPrev(event, this, 'otp2')">
      <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" id="otp4" oninput="moveToNext(this, 'otp5')" onkeydown="moveToPrev(event, this, 'otp3')">
      <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" id="otp5" oninput="moveToNext(this, 'otp6')" onkeydown="moveToPrev(event, this, 'otp4')">
      <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" id="otp6" oninput="moveToNext(this, null)" onkeydown="moveToPrev(event, this, 'otp5')">
    </div>

    <!-- Action Buttons -->
    <button class="btn" id="verifyBtn" onclick="verifyOTP()">Verify Code</button>
    <button class="btn btn-resend" id="resendBtn" onclick="resendOTP()" disabled>Resend OTP (60s)</button>

    <!-- Footer -->
    <div class="footer-text">
      Wrong email? <a href="forgot-password.html">Change it here</a>
    </div>
  </div>

  <script>
    // ===== CONFIGURATION =====
    const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let resetEmail = localStorage.getItem('resetEmail') || '';
    let resendTimer = null;

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', () => {
      if (!resetEmail) {
        // If no email found in localStorage, go back to reset page
        window.location.href = 'forgot-password.html';
        return;
      }
      
      // Show the email on screen
      document.getElementById('displayEmail').textContent = resetEmail;
      
      // Focus on the first input
      document.getElementById('otp1').focus();
      
      // Start the resend timer
      startResendCooldown();

      // Auto-Paste feature for 6-digit OTP
      const otpInputs = document.querySelectorAll('.otp-digit');
      otpInputs.forEach((input, index) => {
        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
          pasteData.split('').forEach((char, i) => {
            if (otpInputs[i]) otpInputs[i].value = char;
          });
          if (pasteData.length > 0) {
            const focusIndex = Math.min(pasteData.length, 5);
            otpInputs[focusIndex].focus();
          }
        });
      });
    });

    // ===== OTP INPUT NAVIGATION =====
    window.moveToNext = (current, nextFieldID) => {
      current.value = current.value.replace(/\D/g, ''); 
      if (current.value.length >= 1 && nextFieldID) {
        document.getElementById(nextFieldID).focus();
      }
    }

    window.moveToPrev = (event, current, prevFieldID) => {
      if (event.key === 'Backspace' && current.value === '' && prevFieldID) {
        document.getElementById(prevFieldID).focus();
      }
    }

    // ===== MESSAGE HELPER =====
    function showMsg(text, type) {
      const el = document.getElementById('msgBox');
      el.textContent = text;
      el.className = 'alert alert-' + type;
      el.style.display = 'flex';
    }
    
    function hideMsg() {
      document.getElementById('msgBox').style.display = 'none';
    }

    // ===== RESEND COOLDOWN =====
    function startResendCooldown() {
      const btn = document.getElementById('resendBtn');
      let seconds = 60;
      btn.disabled = true;
      clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        seconds--;
        btn.innerText = `Resend OTP (${seconds}s)`;
        if (seconds <= 0) {
          clearInterval(resendTimer);
          btn.disabled = false;
          btn.innerText = 'Resend OTP';
        }
      }, 1000);
    }

    // ===== VERIFY OTP =====
    window.verifyOTP = async () => {
      hideMsg();
      
      const otp = document.getElementById('otp1').value +
                  document.getElementById('otp2').value +
                  document.getElementById('otp3').value +
                  document.getElementById('otp4').value +
                  document.getElementById('otp5').value +
                  document.getElementById('otp6').value;

      if (otp.length < 6) {
        return showMsg('Please enter the complete 6-digit OTP', 'error');
      }

      const btn = document.getElementById('verifyBtn');
      btn.disabled = true;
      btn.innerText = 'Verifying...';

      try {
        // Call your Vercel backend to verify the OTP
        const res = await fetch('/api/verify-reset-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, otp: otp })
        });
        
        const data = await res.json();

        if (res.ok && data.success) {
          showMsg('✅ OTP Verified Successfully! Redirecting...', 'success');
          
          // Save a temporary token for the next step (Reset Password Page)
          localStorage.setItem('resetToken', data.resetToken || 'verified');
          
          setTimeout(() => {
            window.location.href = 'new-password.html';
          }, 1500);
        } else {
          btn.disabled = false;
          btn.innerText = 'Verify Code';
          showMsg(data.message || 'Invalid or expired OTP', 'error');
        }
      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.innerText = 'Verify Code';
        showMsg('Network error. Please try again.', 'error');
      }
    }

    // ===== RESEND OTP =====
    window.resendOTP = async () => {
      hideMsg();
      const btn = document.getElementById('resendBtn');
      btn.disabled = true;
      btn.innerText = 'Sending...';

      try {
        const res = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, type: 'reset' })
        });
        
        const data = await res.json();

        if (res.ok && data.success) {
          showMsg('✅ A new OTP has been sent to your email.', 'success');
          startResendCooldown();
        } else {
          btn.disabled = false;
          btn.innerText = 'Resend OTP';
          showMsg(data.message || 'Failed to resend OTP', 'error');
        }
      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.innerText = 'Resend OTP';
        showMsg('Network error. Please try again.', 'error');
      }
    }
  </script>
</body>
</html>
