const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const languages = [
  {code: 'en', name: 'English - US'},
  {code: 'bn', name: 'বাংলা - Bangladesh'},
  {code: 'hi', name: 'हिन्दी - India'},
  {code: 'es', name: 'Español - Spain'},
  {code: 'fr', name: 'Français - France'},
  {code: 'ar', name: 'Arabic - العربية'},
  {code: 'pt', name: 'Português - Portugal'},
  {code: 'de', name: 'Deutsch - Germany'},
  {code: 'id', name: 'Bahasa Indonesia'},
  {code: 'tr', name: 'Türkçe - Türkiye'}
];

const translations = {
  en: {email: "Username or email", password: "Password", login: "Log in", forgot: "Forgot password?", google: "Continue with Google", create: "Create new account", error: "Please complete the reCAPTCHA", invalid: "Invalid email or password", langTitle: "Select Language", or: "or", close: "Close", footer: "18+ Free Social Media Platform"},
  bn: {email: "ইউজারনেম বা ইমেইল", password: "পাসওয়ার্ড", login: "লগ ইন", forgot: "পাসওয়ার্ড ভুলে গেছেন?", google: "Google দিয়ে চালিয়ে যান", create: "নতুন অ্যাকাউন্ট তৈরি করুন", error: "অনুগ্রহ করে reCAPTCHA সম্পূর্ণ করুন", invalid: "ভুল ইমেইল বা পাসওয়ার্ড", langTitle: "ভাষা নির্বাচন করুন", or: "অথবা", close: "বন্ধ করুন", footer: "18+ ফ্রি সোশ্যাল মিডিয়া প্ল্যাটফর্ম"},
  hi: {email: "उपयोगकर्ता नाम या ईमेल", password: "पासवर्ड", login: "लॉग इन", forgot: "पासवर्ड भूल गए?", google: "Google से जारी रखें", create: "नया खाता बनाएं", error: "कृपया reCAPTCHA पूरा करें", invalid: "गलत ईमेल या पासवर्ड", langTitle: "भाषा चुनें", or: "या", close: "बंद करें", footer: "18+ फ्री सोशल मीडिया प्लेटफॉर्म"},
  es: {email: "Nombre de usuario o correo", password: "Contraseña", login: "Iniciar sesión", forgot: "¿Olvidaste tu contraseña?", google: "Continuar con Google", create: "Crear cuenta nueva", error: "Completa el reCAPTCHA", invalid: "Correo o contraseña inválidos", langTitle: "Seleccionar idioma", or: "o", close: "Cerrar", footer: "Plataforma de redes sociales gratuita 18+"},
  fr: {email: "Nom d'utilisateur ou email", password: "Mot de passe", login: "Se connecter", forgot: "Mot de passe oublié ?", google: "Continuer avec Google", create: "Créer un nouveau compte", error: "Veuillez compléter le reCAPTCHA", invalid: "Email ou mot de passe invalide", langTitle: "Choisir la langue", or: "ou", close: "Fermer", footer: "Plateforme de médias sociaux gratuite 18+"},
  ar: {email: "اسم المستخدم أو البريد الإلكتروني", password: "كلمة السر", login: "تسجيل الدخول", forgot: "نسيت كلمة السر؟", google: "المتابعة مع Google", create: "إنشاء حساب جديد", error: "يرجى إكمال reCAPTCHA", invalid: "البريد الإلكتروني أو كلمة السر غير صحيحة", langTitle: "اختر اللغة", or: "أو", close: "إغلاق", footer: "منصة التواصل الاجتماعي المجانية 18+"},
  pt: {email: "Nome de usuário ou email", password: "Senha", login: "Entrar", forgot: "Esqueceu a senha?", google: "Continuar com Google", create: "Criar nova conta", error: "Complete o reCAPTCHA", invalid: "Email ou senha inválidos", langTitle: "Selecionar idioma", or: "ou", close: "Fechar", footer: "Plataforma de mídia social gratuita 18+"},
  de: {email: "Benutzername oder E-Mail", password: "Passwort", login: "Anmelden", forgot: "Passwort vergessen?", google: "Mit Google fortfahren", create: "Neues Konto erstellen", error: "Bitte reCAPTCHA ausfüllen", invalid: "Ungültige E-Mail oder Passwort", langTitle: "Sprache auswählen", or: "oder", close: "Schließen", footer: "Kostenlose Social-Media-Plattform 18+"},
  id: {email: "Nama pengguna atau email", password: "Kata sandi", login: "Masuk", forgot: "Lupa kata sandi?", google: "Lanjutkan dengan Google", create: "Buat akun baru", error: "Harap lengkapi reCAPTCHA", invalid: "Email atau kata sandi tidak valid", langTitle: "Pilih Bahasa", or: "atau", close: "Tutup", footer: "Platform Media Sosial Gratis 18+"},
  tr: {email: "Kullanıcı adı veya e-posta", password: "Şifre", login: "Giriş Yap", forgot: "Şifreni mi unuttun?", google: "Google ile devam et", create: "Yeni hesap oluştur", error: "Lütfen reCAPTCHA'yı tamamlayın", invalid: "Geçersiz e-posta veya şifre", langTitle: "Dil Seç", or: "veya", close: "Kapat", footer: "18+ Ücretsiz Sosyal Medya Platformu"}
};

let currentLang = localStorage.getItem('autro_lang') || 'en';

// Page Load
document.addEventListener('DOMContentLoaded', async () => {
  buildLangList();
  applyLanguage();
  
  // Auto redirect if logged in
  const { data: { session } } = await supabase.auth.getSession();
  if(session){
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('current_user', session.user.email);
    window.location.href = 'index.html';
  }
});

function buildLangList(){
  const langList = document.getElementById('langList');
  langList.innerHTML = '';
  languages.forEach(lang => {
    const div = document.createElement('div');
    div.className = 'lang-item';
    div.innerHTML = `
      <span>${lang.name}</span>
      <input type="radio" name="lang" value="${lang.code}" ${currentLang === lang.code ? 'checked' : ''}>
    `;
    div.onclick = () => selectLanguage(lang.code, lang.name);
    langList.appendChild(div);
  });
}

function openLangModal(){
  document.getElementById('langModal').style.display = 'flex';
}

function closeLangModal(){
  document.getElementById('langModal').style.display = 'none';
}

function selectLanguage(code, name){
  currentLang = code;
  localStorage.setItem('autro_lang', currentLang);
  document.getElementById('langBtn').innerText = name;
  applyLanguage();
  closeLangModal();
}

function applyLanguage(){
  const t = translations[currentLang];
  document.documentElement.lang = currentLang;
  document.getElementById('email').placeholder = t.email;
  document.getElementById('password').placeholder = t.password;
  document.getElementById('loginBtn').innerText = t.login;
  document.getElementById('forgotLink').innerText = t.forgot;
  document.getElementById('googleText').innerText = t.google;
  document.getElementById('btnCreate').innerText = t.create;
  document.getElementById('orText').innerText = t.or;
  document.getElementById('langTitle').innerText = t.langTitle;
  document.getElementById('langClose').innerText = t.close;
  document.getElementById('footerSub').innerText = t.footer;
}

async function getFingerprint(){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = "top"; ctx.font = "14px Arial"; ctx.fillText("Autrobook", 2, 2);
  return btoa(navigator.userAgent + navigator.language + screen.width + canvas.toDataURL()).substring(0, 32);
}

// Login Form Submit
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const t = translations[currentLang];
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const recaptcha = grecaptcha.getResponse();
  const btn = document.getElementById('loginBtn');
  const error = document.getElementById('errorMsg');
  
  if(!recaptcha){
    error.innerText = t.error;
    error.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Logging in...';
  error.style.display = 'none';

  const fingerprint = await getFingerprint();

  try {
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if(err) throw err;

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('current_user', data.user.email);
    localStorage.setItem('device_fingerprint', fingerprint);
    
    window.location.href = 'index.html';

  } catch(err){
    error.innerText = err.message.includes('Invalid') ? t.invalid : err.message;
    error.style.display = 'block';
    btn.disabled = false;
    btn.innerText = t.login;
    grecaptcha.reset();
  }
});

// Google OAuth Login
async function googleLogin(){
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/index.html' }
  });
  if(error){
    document.getElementById('errorMsg').innerText = error.message;
    document.getElementById('errorMsg').style.display = 'block';
  }
  }
