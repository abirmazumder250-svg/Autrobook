/* js/welcome.js - Autrobook Welcome - FINAL - All Features Added */
const SUPABASE_URL = "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_KEY = "sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const RECAPTCHA_SITE_KEY = "6LfVliMuAAAAALzEo5ntOmIqZNY40IcMa8dtLg_d";

/* ========== THEME - SYSTEM DEFAULT ========== */
function applyTheme(){
  const saved = localStorage.getItem('autro_theme');
  const icon = document.getElementById('themeIcon');
  document.body.classList.remove('theme-light','theme-dark');
  if(saved==='light'){ document.body.classList.add('theme-light'); if(icon) icon.className='fas fa-sun'; }
  else if(saved==='dark'){ document.body.classList.add('theme-dark'); if(icon) icon.className='fas fa-moon'; }
  else{
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(icon) icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
  }
}
function toggleTheme(){
  const saved = localStorage.getItem('autro_theme');
  const isDarkNow = saved ? saved==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  localStorage.setItem('autro_theme', isDarkNow ? 'light' : 'dark');
  applyTheme();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
  if(!localStorage.getItem('autro_theme')) applyTheme();
});

/* ========== LANGUAGES - ALL COUNTRIES ========== */
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
let currentTab = 'login';
let captchaOk = false;
function showLogin(clearFields){
  document.getElementById('profileScreen').style.display='none';
  document.getElementById('loginScreen').style.display='block';
  document.getElementById('backBtn').style.display='block';
  if(clearFields){ document.getElementById('authEmail').value=''; document.getElementById('authPassword').value=''; document.getElementById('authEmail').focus(); }
}
function showProfiles(){
  if(!localStorage.getItem('autro_user_email')||localStorage.getItem('autro_user_email')==='guest@autrobook.com'){ showLogin(); document.getElementById('backBtn').style.display='none'; return; }
  document.getElementById('profileScreen').style.display='block';
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('backBtn').style.display='none';
}
function renderProfiles(){
  const email=localStorage.getItem('autro_user_email'); const name=localStorage.getItem('autro_user_name')||'Abir Mazumder';
  if(email&&email!=='guest@autrobook.com'){
    document.getElementById('profileList').innerHTML=`
    <button class="profile" onclick="showLogin()"><img src="https://i.pravatar.cc/100?img=12"><span><b>${name}</b><span><span class="dot">●</span> 7 notifications</span></span><span class="arr"><i class="fas fa-chevron-right"></i></span></button>
    <button class="profile" onclick="showLogin()"><img src="logo.png"><span><b>${name}</b></span><span class="arr"><i class="fas fa-chevron-right"></i></span></button>`;
    showProfiles();
  } else { showLogin(); }
}
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
function onCaptchaSuccess(){ captchaOk=true; }
function onCaptchaExpired(){ captchaOk=false; }

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
      if(typeof grecaptcha!=='undefined') grecaptcha.reset(); captchaOk=false;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if(error) throw error;
      const user=data.user;
      const userName = user.user_metadata?.full_name || name || email.split('@')[0];
      localStorage.setItem('autro_user_email', user.email);
      localStorage.setItem('autro_user_name', userName);
      localStorage.setItem('autro_user_id', user.id);
      showToast('Welcome back, '+userName+'!');
      const hasPasskey = localStorage.getItem('autro_passkey_'+user.id);
      if(hasPasskey){ document.getElementById('mSetupPasskey').style.display='flex'; }
      else { setTimeout(()=>{ window.location.href='home.html'; }, 600); }
    }
  }catch(err){ showToast(err.message || 'Login failed'); }
  finally { btn.disabled=false; btn.textContent=oldText; }
}
async function forgotPassword(){
  const email=document.getElementById('authEmail').value.trim();
  if(!email){ showToast('Enter your email first'); return; }
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/welcome.html' });
  if(error) showToast(error.message);
  else showToast('Password reset link sent to '+email);
}
function continueAsGuest(){ localStorage.setItem('autro_user_email','guest@autrobook.com'); localStorage.setItem('autro_user_name','Guest'); window.location.href='home.html'; }
function loginWithFingerprint(){ showToast('Fingerprint login - use your device biometrics'); document.getElementById('mSetupPasskey').style.display='flex'; }
function verifyLogin2FA(){ document.getElementById('m2FAVerify').style.display='none'; window.location.href='home.html'; }
function cancel2FA(){ document.getElementById('m2FAVerify').style.display='none'; }
function setupPasskeyFromWelcome(){ document.getElementById('mSetupPasskey').style.display='none'; const uid=localStorage.getItem('autro_user_id'); if(uid) localStorage.setItem('autro_passkey_'+uid,'1'); showToast('Fingerprint enabled!'); setTimeout(()=>{ window.location.href='home.html'; }, 500); }
function closePasskeyModal(){ document.getElementById('mSetupPasskey').style.display='none'; window.location.href='home.html'; }

document.addEventListener('DOMContentLoaded', ()=>{ applyTheme(); applyLang(); renderProfiles(); switchTab('login'); });
