// js/welcome.js - FULL - FIXED - reCAPTCHA + Google Biometric Fingerprint + 2FA + System Theme
const SUPABASE_URL = "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let authMode = "login";
let pendingUser = null;
let pendingEmail = "";
let pendingName = "";
let captchaToken = "";

function toast(msg){
  const t=document.getElementById("toast");
  if(!t) return;
  t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3000);
}

// ===== THEME - System Default + Manual Toggle - FIXED =====
function applyTheme(){
  const saved = localStorage.getItem("autro_theme");
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : sysDark;

  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(isDark ? "theme-dark" : "theme-light");
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

  const icon = document.getElementById("themeIcon");
  if(icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

function toggleTheme(){
  const saved = localStorage.getItem("autro_theme");
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const curDark = saved ? saved === "dark" : sysDark;
  localStorage.setItem("autro_theme", curDark ? "light" : "dark");
  applyTheme();
}

// System theme বদলালে Auto বদলাবে - যদি User নিজে কিছু সেট না করে থাকে
if(window.matchMedia){
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if(!localStorage.getItem("autro_theme")) applyTheme();
  });
}
applyTheme();

function switchTab(mode){
  authMode=mode;
  document.getElementById("tabLogin").classList.toggle("active", mode==="login");
  document.getElementById("tabSignup").classList.toggle("active", mode==="signup");
  document.getElementById("signupNameWrap").style.display = mode==="signup" ? "block" : "none";
  document.getElementById("authSubmitBtn").textContent = mode==="signup" ? "Create Account" : "Log In";
  if(window.grecaptcha) window.grecaptcha.reset();
  captchaToken="";
}

// ===== REAL GOOGLE reCAPTCHA =====
function onCaptchaSuccess(token){ captchaToken = token; }
function onCaptchaExpired(){ captchaToken = ""; toast("Captcha expired. Please verify again."); }
async function checkCaptcha(){
  const token = window.grecaptcha ? window.grecaptcha.getResponse() : captchaToken;
  if(!token){ toast("Please complete reCAPTCHA - I'm not a robot"); return false; }
  try{
    const r = await fetch("/api/verify-captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await r.json();
    if(!data.success){
      toast("❌ Captcha verification failed. Try again.");
      if(window.grecaptcha) window.grecaptcha.reset();
      captchaToken="";
      return false;
    }
    return true;
  }catch(e){ toast("Captcha server error. Try again."); return false; }
}

// ===== SESSION =====
function saveLoginSession(user, email, name){
  localStorage.removeItem("autro_guest");
  localStorage.setItem("autro_logged_in","1");
  localStorage.setItem("isLoggedIn","true");
  localStorage.setItem("autro_user_name", name);
  localStorage.setItem("autro_user_email", email);
  if(user && user.created_at) localStorage.setItem("autro_account_created", user.created_at);
  localStorage.setItem("currentUser", JSON.stringify({ email, user_metadata:{full_name:name}, created_at: user?user.created_at:"" }));
}
function finishLogin(user, email, name){
  saveLoginSession(user, email, name);
  if(!localStorage.getItem("autro_passkey_id")){
    setTimeout(()=>{
      const m=document.getElementById("mSetupPasskey");
      if(m) m.style.display="flex";
    }, 800);
    return;
  }
  toast("✅ Welcome back, " + name);
  setTimeout(()=>{ window.location.href="index.html"; }, 600);
}
function closePasskeyModal(){
  const m=document.getElementById("mSetupPasskey");
  if(m) m.style.display="none";
  window.location.href="index.html";
}

// ===== LOGIN / SIGNUP =====
async function submitAuth(){
  const email=document.getElementById("authEmail").value.trim();
  const pass=document.getElementById("authPassword").value.trim();
  const nameEl=document.getElementById("authName");
  const name=nameEl? nameEl.value.trim() : "";
  if(!email || email.indexOf("@")===-1){ toast("Enter a valid email"); return; }
  if(pass.length<6){ toast("Password must be 6+ characters"); return; }
  if(authMode==="signup" && !name){ toast("Enter your full name"); return; }
  if(!(await checkCaptcha())) return;
  const btn=document.getElementById("authSubmitBtn");
  btn.textContent="Please wait..."; btn.disabled=true;
  try{
    if(authMode==="signup"){
      const { data, error } = await supabaseClient.auth.signUp({ email, password: pass, options:{ data:{ full_name:name } } });
      if(error) throw error;
      try{ await fetch("/api/welcome",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,email}) }); }catch(e){}
      toast("✅ Account created! You can login now.");
      switchTab("login");
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
      if(error) throw error;
      const user=data.user;
      const userName=(user.user_metadata && user.user_metadata.full_name) || email.split("@")[0];
      pendingUser=user; pendingEmail=email; pendingName=userName;
      const is2FAOn = localStorage.getItem("autro_2fa_enabled")==="1";
      const secret = localStorage.getItem("autro_2fa_secret");
      if(is2FAOn && secret){
        document.getElementById("m2FAVerify").style.display="flex";
        document.getElementById("login2FACode").value="";
        document.getElementById("login2FACode").focus();
        toast("🔐 Enter your 6-digit Authenticator code");
      } else {
        finishLogin(user, email, userName);
      }
    }
    document.getElementById("authPassword").value="";
    if(window.grecaptcha) window.grecaptcha.reset();
    captchaToken="";
  } catch(err){ toast(err.message || "Auth failed"); }
  btn.textContent = authMode==="signup" ? "Create Account" : "Log In";
  btn.disabled=false;
}

// ===== GOOGLE BIOMETRIC - FINGERPRINT / FACE ID / PASSKEY =====
async function loginWithFingerprint(){
  const passkeyId = localStorage.getItem("autro_passkey_id");
  if(!passkeyId){
    toast("No Passkey found. Login with Password first, then set Passkey in Settings.");
    return;
  }
  if(!window.PublicKeyCredential){
    toast("Fingerprint not supported on this browser");
    return;
  }
  if(!(await checkCaptcha())) return;
  try{
    toast("Touch fingerprint sensor...");
    const ch = new Uint8Array(32);
    crypto.getRandomValues(ch);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: ch,
        rpId: location.hostname,
        userVerification: "required",
        timeout: 60000,
        allowCredentials: [{ id: Uint8Array.from(atob(passkeyId), c => c.charCodeAt(0)), type: "public-key", transports: ["internal"] }]
      }
    });
    if(!assertion) throw new Error("Cancelled");
    const savedEmail = localStorage.getItem("autro_user_email") || "user@autrobook.com";
    const savedName = localStorage.getItem("autro_user_name") || savedEmail.split("@")[0];
    const is2FAOn = localStorage.getItem("autro_2fa_enabled")==="1";
    const secret = localStorage.getItem("autro_2fa_secret");
    if(is2FAOn && secret){
      pendingUser = { email: savedEmail, created_at: localStorage.getItem("autro_account_created") || "" };
      pendingEmail = savedEmail; pendingName = savedName;
      document.getElementById("m2FAVerify").style.display="flex";
      document.getElementById("login2FACode").value="";
      toast("✅ Fingerprint OK. Now enter 2FA code.");
      return;
    }
    const fakeUser = { email: savedEmail, created_at: localStorage.getItem("autro_account_created") || "" };
    finishLogin(fakeUser, savedEmail, savedName);
  }catch(e){
    toast("❌ Fingerprint failed or cancelled. Try Password login.");
  }
}

// Setup Passkey from Welcome (after first login)
async function setupPasskeyFromWelcome(){
  if(!window.PublicKeyCredential){ toast("Passkey not supported"); return; }
  try{
    const email = localStorage.getItem("autro_user_email") || "user@autrobook.com";
    const ch = new Uint8Array(32);
    crypto.getRandomValues(ch);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: ch,
        rp: { name: "Autrobook", id: location.hostname },
        user: { id: new TextEncoder().encode(email), name: email, displayName: email },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none"
      }
    });
    localStorage.setItem("autro_passkey_id", btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
    toast("✅ Fingerprint Enabled! Next time use Fingerprint login.");
    closePasskeyModal();
  }catch(e){ toast("Fingerprint setup cancelled"); }
}

// ===== 2FA =====
function verifyLogin2FA(){
  const code=document.getElementById("login2FACode").value.trim();
  if(code.length!==6){ toast("Enter 6-digit code"); return; }
  const secret=localStorage.getItem("autro_2fa_secret");
  if(!secret){ toast("2FA secret not found"); return; }
  try{
    const totp=new OTPAuth.TOTP({ issuer:"Autrobook", label:pendingEmail, algorithm:"SHA1", digits:6, period:30, secret: OTPAuth.Secret.fromBase32(secret) });
    const delta=totp.validate({ token:code, window:1 });
    if(delta===null){ toast("❌ Wrong code. Try again."); document.getElementById("login2FACode").value=""; return; }
    document.getElementById("m2FAVerify").style.display="none";
    finishLogin(pendingUser, pendingEmail, pendingName);
  }catch(e){ toast("Verification failed. Try again."); }
}
function cancel2FA(){
  document.getElementById("m2FAVerify").style.display="none";
  pendingUser=null; pendingEmail=""; pendingName="";
  supabaseClient.auth.signOut();
  toast("Login cancelled. 2FA required.");
}
function useBackupCode(){ toast("Contact autrobooksupport@gmail.com with your NID to reset 2FA."); }
async function forgotPassword(){
  const email=document.getElementById("authEmail").value.trim();
  if(!email){ toast("Enter your email first"); return; }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset.html" });
  if(error) toast(error.message); else toast("📧 Reset email sent from autrobooksupport@gmail.com");
}
function continueAsGuest(){
  localStorage.setItem("autro_guest","1");
  localStorage.setItem("currentUser", JSON.stringify({ email:"guest@autrobook.com", user_metadata:{full_name:"Guest User"} }));
  localStorage.setItem("autro_user_name","Guest User");
  localStorage.setItem("autro_user_email","guest@autrobook.com");
  toast("👀 Guest Mode - View Only");
  setTimeout(()=>{ window.location.href="index.html"; }, 500);
}
document.addEventListener("DOMContentLoaded", ()=>{
  const fpNote = document.getElementById("fpNote");
  const fpBtn = document.getElementById("fingerprintBtn");
  if(!localStorage.getItem("autro_passkey_id")){
    if(fpNote) fpNote.textContent = "No Passkey yet. Login with Password first, then set Passkey in Settings → Passkey.";
    if(fpBtn) fpBtn.style.opacity = "0.7";
  } else {
    if(fpNote) fpNote.textContent = "Passkey ready ✅ Tap to login with Fingerprint / Face ID.";
  }
  const codeInput = document.getElementById("login2FACode");
  if(codeInput) codeInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") verifyLogin2FA(); });
});
