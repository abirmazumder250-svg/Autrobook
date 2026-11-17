// ========== Supabase Config ==========
const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== Language Translations ==========
const translations = {
  en: {
    useAnother: "Use another profile",
    createNew: "Create new account",
    profiles: "Profiles",
    removeAll: "Remove profiles from this device",
    confirmRemove: "Remove all saved profiles from this device?"
  },
  bn: {
    useAnother: "অন্য প্রোফাইল ব্যবহার করুন",
    createNew: "নতুন অ্যাকাউন্ট তৈরি করুন",
    profiles: "প্রোফাইল",
    removeAll: "এই ডিভাইস থেকে প্রোফাইল সরান",
    confirmRemove: "এই ডিভাইস থেকে সমস্ত সংরক্ষিত প্রোফাইল সরাবেন?"
  },
  hi: {
    useAnother: "दूसरी प्रोफ़ाइल का उपयोग करें",
    createNew: "नया खाता बनाएं",
    profiles: "प्रोफ़ाइल",
    removeAll: "इस डिवाइस से प्रोफ़ाइल हटाएं",
    confirmRemove: "इस डिवाइस से सभी सहेजे गए प्रोफ़ाइल हटाएं?"
  },
  es: {
    useAnother: "Usar otro perfil",
    createNew: "Crear cuenta nueva",
    profiles: "Perfiles",
    removeAll: "Eliminar perfiles de este dispositivo",
    confirmRemove: "¿Eliminar todos los perfiles guardados de este dispositivo?"
  },
  fr: {
    useAnother: "Utiliser un autre profil",
    createNew: "Créer un nouveau compte",
    profiles: "Profils",
    removeAll: "Supprimer les profils de cet appareil",
    confirmRemove: "Supprimer tous les profils enregistrés de cet appareil ?"
  },
  ar: {
    useAnother: "استخدم ملف شخصي آخر",
    createNew: "إنشاء حساب جديد",
    profiles: "الملفات الشخصية",
    removeAll: "إزالة الملفات الشخصية من هذا الجهاز",
    confirmRemove: "إزالة جميع الملفات الشخصية المحفوظة من هذا الجهاز؟"
  },
  pt: {
    useAnother: "Usar outro perfil",
    createNew: "Criar nova conta",
    profiles: "Perfis",
    removeAll: "Remover perfis deste dispositivo",
    confirmRemove: "Remover todos os perfis salvos deste dispositivo?"
  },
  de: {
    useAnother: "Anderes Profil verwenden",
    createNew: "Neues Konto erstellen",
    profiles: "Profile",
    removeAll: "Profile von diesem Gerät entfernen",
    confirmRemove: "Alle gespeicherten Profile von diesem Gerät entfernen?"
  },
  id: {
    useAnother: "Gunakan profil lain",
    createNew: "Buat akun baru",
    profiles: "Profil",
    removeAll: "Hapus profil dari perangkat ini",
    confirmRemove: "Hapus semua profil yang disimpan dari perangkat ini?"
  },
  tr: {
    useAnother: "Başka profil kullan",
    createNew: "Yeni hesap oluştur",
    profiles: "Profiller",
    removeAll: "Bu cihazdan profilleri kaldır",
    confirmRemove: "Bu cihazdan tüm kayıtlı profilleri kaldırmak istiyor musunuz?"
  }
};

let currentLang = localStorage.getItem('autro_lang') || 'en';

// Page Load
document.addEventListener('DOMContentLoaded', init);

async function init(){
  document.getElementById('langSelect').value = currentLang;
  applyLanguage();
  await checkActiveSession();
  loadAccounts();
}

// Change Language
function changeLanguage(){
  currentLang = document.getElementById('langSelect').value;
  localStorage.setItem('autro_lang', currentLang);
  applyLanguage();
}

// Apply Language to UI
function applyLanguage(){
  const t = translations[currentLang];
  document.documentElement.lang = currentLang;
  document.getElementById('btnOther').innerText = t.useAnother;
  document.getElementById('btnCreate').innerText = t.createNew;
  document.getElementById('sheetTitle').innerText = t.profiles;
  document.getElementById('btnRemove').innerText = t.removeAll;
}

// Check if user has active session
async function checkActiveSession(){
  const { data: { session } } = await supabase.auth.getSession();
  if(session){
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('current_user', session.user.email);
    window.location.href = 'index.html';
  }
}

// Load saved accounts from localStorage
function loadAccounts(){
  const accounts = JSON.parse(localStorage.getItem('autro_saved_accounts') || '[]');
  const list = document.getElementById('accountsList');
  
  if(accounts.length === 0){ 
    list.innerHTML = ''; 
    return; 
  }

  list.innerHTML = accounts.map(acc => `
    <div class="account-card" onclick="quickLogin('${acc.email}')">
      <img src="${acc.avatar || 'logo.png'}" alt="${acc.name}">
      <div class="account-info">
        <div class="name">${acc.name}</div>
        ${acc.notif ? `<div class="note"><span class="dot">●</span>${acc.notif} notifications</div>` : ''}
      </div>
      <div class="arrow">›</div>
    </div>
  `).join('');
}

// Quick Login - Click on account card
async function quickLogin(email){
  window.location.href = `login.html?email=${encodeURIComponent(email)}`;
}

// "Use another profile" button
function goToLogin(){
  window.location.href = 'login.html';
}

// ========== Bottom Sheet Logic ==========
function openSheet(){ 
  document.getElementById('overlay').style.display='block';
  setTimeout(() => {
    document.getElementById('bottomSheet').classList.add('show');
  }, 10);
}

function closeSheet(){
  document.getElementById('bottomSheet').classList.remove('show');
  setTimeout(() => {
    document.getElementById('overlay').style.display='none';
  }, 300);
}

// Remove All - Only removes from device, NOT from Supabase
async function removeAllAccounts(){
  const t = translations[currentLang];
  if(confirm(t.confirmRemove)){
    // 1. Sign out from Supabase - ends session only
    await supabase.auth.signOut();
    
    // 2. Clear local storage
    localStorage.removeItem('autro_saved_accounts');
    localStorage.removeItem('current_user');
    localStorage.removeItem('isLoggedIn');
    
    loadAccounts(); // Refresh UI
    closeSheet();
  }
}

// Call this from login.html after successful login
function addAccountToHistory(email, name = "User", avatar = "logo.png"){
  let accounts = JSON.parse(localStorage.getItem('autro_saved_accounts') || '[]');
  accounts = accounts.filter(acc => acc.email !== email);
  accounts.unshift({name, email, avatar});
  if(accounts.length > 5) accounts.pop();
  localStorage.setItem('autro_saved_accounts', JSON.stringify(accounts));
}
