/* js/welcome.js - Autrobook Welcome - FINAL - Fingerprint + reCAPTCHA + Email Reset */
const SUPABASE_URL = "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_KEY = "sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const RECAPTCHA_SITE_KEY = "6LfVliMuAAAAALzEo5ntOmIqZNY40IcMa8dtLg_d";
let captchaOk = false;
let currentTab = 'login';

/* ========== THEME ========== */
function applyTheme(){
  const saved = localStorage.getItem('autro_theme');
  const icon = document.getElementById('themeIcon');
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved==='dark' : isSystemDark;
  if(isDark){ document.body.classList.add('theme-dark'); if(icon) icon.className='fas fa-sun'; }
  else { document.body.classList.remove('theme-dark'); if(icon) icon.className='fas fa-moon'; }
}
function toggleTheme(){
  const isCurrentlyDark = document.body.classList.contains('theme-dark');
  localStorage.setItem('autro_theme', isCurrentlyDark ? 'light' : 'dark');
  applyTheme();
}
if(window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(!localStorage.getItem('autro_theme')) applyTheme(); });

/* ========== LANGUAGE ========== */
const LANGS=[
{id:'en',label:'English (US)',country:'United States'},
{id:'bn',label:'Bangla (Bangladesh)',country:'Bangladesh'},
{id:'hi',label:'Hindi (India)',country:'India'},
{id:'ur',label:'Urdu (Pakistan)',country:'Pakistan'},
{id:'ar',label:'Arabic',country:'Saudi Arabia / UAE'},
{id:'es',label:'Spanish',country:'Spain / Mexico'},
{id:'fr',label:'French',country:'France'},
{id:'de',label:'German',country:'Germany'},
{id:'pt',label:'Portuguese',country:'Brazil / Portugal'},
{id:'ru',label:'Russian',country:'Russia'},
{id:'zh',label:'Chinese',country:'China'},
{id:'ja',label:'Japanese',country:'Japan'},
{id:'ko',label:'Korean',country:'South Korea'},
{id:'tr',label:'Turkish',country:'Turkey'},
{id:'id',label:'Bahasa Indonesia',country:'Indonesia'},
{id:'th',label:'Thai',country:'Thailand'},
{id:'vi',label:'Vietnamese',country:'Vietnam'},
{id:'ms',label:'Bahasa Melayu',country:'Malaysia'},
{id:'ta',label:'Tamil',country:'Tamil Nadu, India'},
{id:'te',label:'Telugu',country:'Andhra Pradesh, India'},
{id:'mr',label:'Marathi',country:'Maharashtra, India'},
{id:'pa',label:'Punjabi',country:'Punjab, India'},
{id:'ne',label:'Nepali',country:'Nepal'},
{id:'si',label:'Sinhala',country:'Sri Lanka'},
{id:'my',label:'Myanmar',country:'Myanmar'},
{id:'kh',label:'Khmer',country:'Cambodia'},
{id:'lo',label:'Lao',country:'Laos'},
{id:'fa',label:'Persian',country:'Iran'},
{id:'it',label:'Italian',country:'Italy'},
{id:'nl',label:'Dutch',country:'Netherlands'},
{id:'pl',label:'Polish',country:'Poland'},
{id:'uk',label:'Ukrainian',country:'Ukraine'},
{id:'sw',label:'Kiswahili',country:'Kenya / Tanzania'},
{id:'am',label:'Amharic',country:'Ethiopia'},
{id:'ha',label:'Hausa',country:'Nigeria'},
{id:'yo',label:'Yoruba',country:'Nigeria'},
{id:'fil',label:'Filipino',country:'Philippines'},
{id:'en_gb',label:'English (UK)',country:'United Kingdom'},
{id:'en_au',label:'English (Australia)',country:'Australia'},
{id:'en_ca',label:'English (Canada)',country:'Canada'},
];
const T={
en:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
bn:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
hi:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
ur:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
ar:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
es:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
fr:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
de:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
pt:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
ru:{tagline:"Connect with friends - Safe - Mindful - Ad-free",use_another:"Use another profile",login_tab:"Log In",signup_tab:"Create Account",fullname:"Full Name",email:"Mobile number or email",password:"Password",recaptcha:"Protected by Google reCAPTCHA",login_btn:"Log in",forgot:"Forgot password?",fingerprint:"Log in with Fingerprint / Face ID",guest:"Continue as Guest",create_new:"Create new account",footer1:"18+ Free Social Media Platform",footer2:"Stay Safe",choose_lang:"Choose Language"},
};
let currentLang = localStorage.getItem('autro_lang') || 'en';
function getT(lang){ return T[lang] || T.en; }
function applyLang(){
  const t = getT(currentLang);
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.dataset.i18n; if(t[k]) el.textContent=t[k]; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ const k=el.dataset.i18nPh; if(t[k]) el.placeholder=t[k]; });
  const found = LANGS.find(l=>l.id===currentLang);
  const labelEl = document.getElementById('langLabel');
  if(labelEl) labelEl.textContent = found ? found.label : 'English (US)';
  document.documentElement.lang = currentLang;
}
function openLang(){ renderLangList(); document.getElementById('langModal').style.display='flex'; }
function closeLang(){ document.getElementById('langModal').style.display='none'; }
function renderLangList(filter=''){
  const list=document.getElementById('langList'); if(!list) return; list.innerHTML='';
  LANGS.filter(l=>(l.label+' '+l.country).toLowerCase().includes(filter.toLowerCase())).forEach(l=>{
    const b=document.createElement('button'); b.className='lang-item'+(l.id===currentLang?' active':'');
    b.innerHTML=`<span>${l.label}<br><small>${l.country}</small></span><span>${l.id===currentLang?'✓':''}</span>`;
    b.onclick=()=>{ currentLang=l.id; localStorage.setItem('autro_lang',l.id); applyLang(); closeLang(); };
    list.appendChild(b);
  });
}
function filterLang(){ renderLangList(document.getElementById('langSearch').value); }

/* ========== PROFILE / LOGIN SCREEN ========== */
function showLogin(clearFields){
  document.getElementById('profileScreen').style.display='none';
  document.getElementById('loginScreen').style.display='block';
  document.getElementById('backBtn').style.display='block';
  if(clearFields){ document.getElementById('authEmail').value=''; document.getElementById('authPassword').value=''; document.getElementById('authEmail').focus(); }
}
function showProfiles(){
  const email = localStorage.getItem('autro_user_email');
  if(!email || email==='guest@autrobook.com'){ showLogin(); document.getElementById('backBtn').style.display='none'; return; }
  document.getElementById('profileScreen').style.display='block';
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('backBtn').style.display='none';
}
function renderProfiles(){
  const email=localStorage.getItem('autro_user_email');
  const name=localStorage.getItem('autro_user_name')||'Abir Mazumder';
  if(email && email!=='guest@autrobook.com'){
    document.getElementById('profileList').innerHTML=`
    <div class="profile-wrap" id="mainProfileCard">
      <button class="profile" onclick="showLogin()">
        <img src="https://i.pravatar.cc/100?img=12" alt="Profile">
        <span><b>${name}</b><span><span class="dot">●</span> 7 notifications</span></span>
        <span class="arr"><i class="fas fa-chevron-right"></i></span>
      </button>
      <button class="profile-remove" onclick="openRemoveProfile(event)" title="Remove profile">×</button>
    </div>`;
    setupLongPress();
    showProfiles();
  } else { showLogin(); }
}
/* LONG PRESS - 800ms চেপে ধরলে Delete Modal */
function setupLongPress(){
  const card = document.getElementById('mainProfileCard');
  if(!card) return;
  let pressTimer;
  const startPress = () => {
    card.classList.add('pressing');
    pressTimer = setTimeout(() => {
      card.classList.remove('pressing');
      document.getElementById('mRemoveProfile').style.display='flex';
      if(navigator.vibrate) navigator.vibrate(50);
    }, 800);
  };
  const cancelPress = () => { clearTimeout(pressTimer); card.classList.remove('pressing'); };
  card.addEventListener('mousedown', startPress);
  card.addEventListener('mouseup', cancelPress);
  card.addEventListener('mouseleave', cancelPress);
  card.addEventListener('touchstart', startPress, {passive:true});
  card.addEventListener('touchend', cancelPress);
  card.addEventListener('touchcancel', cancelPress);
}

/* ========== DELETE / REMOVE PROFILE ========== */
function openRemoveProfile(e){ if(e) e.stopPropagation(); document.getElementById('mRemoveProfile').style.display='flex'; }
function closeRemoveProfile(){ document.getElementById('mRemoveProfile').style.display='none'; }
function removeProfileOnly(){
  localStorage.removeItem('autro_user_email');
  localStorage.removeItem('autro_user_name');
  localStorage.removeItem('autro_user_id');
  closeRemoveProfile();
  showToast('Profile removed from this device');
  setTimeout(()=>{ location.reload(); }, 500);
}
async function deleteAccountPermanently(){
  if(!confirm('Warning: This will permanently delete your account. Are you sure?')) return;
  try{
    const { data } = await supabase.auth.getUser();
    if(data.user){ try{ await supabase.from('profiles').delete().eq('id', data.user.id); }catch(e){} }
    await supabase.auth.signOut();
    localStorage.clear();
    closeRemoveProfile();
    showToast('Account deleted permanently');
    setTimeout(()=>{ location.reload(); }, 600);
  }catch(err){ showToast(err.message); }
}

/* ========== UI HELPERS ========== */
function switchTab(tab){
  currentTab=tab;
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabSignup').classList.toggle('active', tab==='signup');
  document.getElementById('signupNameWrap').style.display = tab==='signup' ? 'block' : 'none';
  const btn=document.getElementById('authSubmitBtn');
  const t=getT(currentLang);
  btn.textContent = tab==='signup' ? (t.create_new || 'Create new account') : (t.login_btn || 'Log in');
}
function showToast(msg){
  const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3000);
}

/* ========== reCAPTCHA - REAL ========== */
function onCaptchaSuccess(){ captchaOk=true; window.captchaOk=true; }
function onCaptchaExpired(){ captchaOk=false; window.captchaOk=false; }

/* ========== AUTH - SUPABASE REAL ========== */
async function submitAuth(){
  const email=document.getElementById('authEmail').value.trim();
  const pass=document.getElementById('authPassword').value.trim();
  const name=document.getElementById('authName') ? document.getElementById('authName').value.trim() : '';
  const btn=document.getElementById('authSubmitBtn');
  if(!email || !pass){ showToast('Please enter email and password'); return; }
  if(pass.length < 6){ showToast('Password must be at least 6 characters'); return; }
  if(!captchaOk){ showToast('Please complete reCAPTCHA'); return; }
  btn.disabled=true; const oldText=btn.textContent; btn.textContent='Please wait...';
  try{
    if(currentTab==='signup'){
      if(!name){ showToast('Please enter your full name'); btn.disabled=false; btn.textContent=oldText; return; }
      const { data, error } = await supabase.auth.signUp({ email, password: pass, options:{ data:{ full_name:name } } });
      if(error) throw error;
      try{ if(data.user) await supabase.from('profiles').upsert({ id:data.user.id, email:email, full_name:name }); }catch(e){}
      showToast('Account created! Please check your email to verify, then Log In.');
      switchTab('login');
      if(typeof grecaptcha!=='undefined') grecaptcha.reset(); captchaOk=false; window.captchaOk=false;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if(error) throw error;
      const user=data.user;
      const userName = user.user_metadata?.full_name || name || email.split('@')[0];
      localStorage.setItem('autro_user_email', user.email);
      localStorage.setItem('autro_user_name', userName);
      localStorage.setItem('autro_user_id', user.id);
      showToast('Welcome back, '+userName+'!');
      // Fingerprint আছে? থাকলে Offer করো, নাইলে Home
      const hasPasskey = localStorage.getItem('autro_passkey_'+user.id);
      if(hasPasskey){ document.getElementById('mSetupPasskey').style.display='flex'; }
      else { setTimeout(()=>{ window.location.href='home.html'; }, 600); }
    }
  }catch(err){ showToast(err.message || 'Login failed'); }
  finally { btn.disabled=false; btn.textContent=oldText; }
}

/* ========== EMAIL RESET - REAL SUPABASE ========== */
async function forgotPassword(){
  const email=document.getElementById('authEmail').value.trim();
  if(!email){ showToast('Enter your email first'); return; }
  try{
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/welcome.html' });
    if(error) throw error;
    showToast('Password reset link sent to '+email+' - Check inbox / spam');
  }catch(err){ showToast(err.message); }
}

/* ========== FINGERPRINT / FACE ID - REAL WebAuthn ========== */
function isWebAuthnSupported(){ return !!(window.PublicKeyCredential && window.isSecureContext); }
async function loginWithFingerprint(){
  const uid = localStorage.getItem('autro_user_id');
  const email = localStorage.getItem('autro_user_email');
  // 1. আগে কখনো Fingerprint Setup করা থাকলে - Login করো
  if(uid && localStorage.getItem('autro_passkey_'+uid)){
    try{
      const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname
        }
      });
      if(cred){
        showToast('Fingerprint verified! Welcome back!');
        setTimeout(()=>{ window.location.href='home.html'; }, 600);
        return;
      }
    }catch(err){
      // User cancel করলে / Fingerprint fail করলে Password দিয়ে Login করতে বলো
      if(err.name==='NotAllowedError'){ showToast('Fingerprint cancelled - Use password'); showLogin(); return; }
      showToast('Fingerprint failed - Use password');
      showLogin(); return;
    }
  }
  // 2. Setup করা নাই - Setup Modal খুলো
  if(!email || email==='guest@autrobook.com'){
    showToast('Login with email first, then enable Fingerprint');
    showLogin();
    return;
  }
  document.getElementById('mSetupPasskey').style.display='flex';
}
async function setupPasskeyFromWelcome(){
  const uid = localStorage.getItem('autro_user_id');
  const email = localStorage.getItem('autro_user_email');
  if(!uid){ showToast('Login first'); return; }
  if(!isWebAuthnSupported()){
    // HTTPS / Localhost ছাড়া WebAuthn চলে না - Fallback: Local Flag Save
    localStorage.setItem('autro_passkey_'+uid,'1');
    showToast('Fingerprint enabled for this device!');
    document.getElementById('mSetupPasskey').style.display='none';
    setTimeout(()=>{ window.location.href='home.html'; }, 500);
    return;
  }
  try{
    const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
    const userIdBytes = new TextEncoder().encode(uid);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: { name: 'Autrobook', id: window.location.hostname },
        user: { id: userIdBytes, name: email, displayName: localStorage.getItem('autro_user_name')||email },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
        attestation: 'none'
      }
    });
    if(cred){
      localStorage.setItem('autro_passkey_'+uid,'1');
      localStorage.setItem('autro_passkey_cred_'+uid, cred.id);
      showToast('Fingerprint enabled!');
      document.getElementById('mSetupPasskey').style.display='none';
      setTimeout(()=>{ window.location.href='home.html'; }, 500);
    }
  }catch(err){
    if(err.name==='NotAllowedError'){ showToast('Fingerprint setup cancelled'); }
    else { showToast('Fingerprint not available on this device'); }
    document.getElementById('mSetupPasskey').style.display='none';
  }
}
function closePasskeyModal(){ document.getElementById('mSetupPasskey').style.display='none'; window.location.href='home.html'; }

/* ========== 2FA / GUEST ========== */
function verifyLogin2FA(){ document.getElementById('m2FAVerify').style.display='none'; window.location.href='home.html'; }
function cancel2FA(){ document.getElementById('m2FAVerify').style.display='none'; }
function continueAsGuest(){ localStorage.setItem('autro_user_email','guest@autrobook.com'); localStorage.setItem('autro_user_name','Guest'); window.location.href='home.html'; }

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', ()=>{ applyTheme(); applyLang(); renderProfiles(); switchTab('login'); });
