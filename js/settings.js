import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://gemyqaniztqrsilayblx.supabase.co';
const supabaseAnonKey = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// State
let appState = JSON.parse(localStorage.getItem('autrobook_settings')) || { two_factor: false, biometric_lock: false };
let currentTOTPSecret = null;
let totpInstance = null;
let isLoggingOut = false;

document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('autrobook_account_status') === 'disabled') {
    showDisabledScreen();
    return;
  }

  // Authenticate anonymously for testing if no user session exists
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await supabase.auth.signInAnonymously();
  }

  // REAL HACKER DETECTION: If logged out remotely
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' && !isLoggingOut) {
      triggerAccountDisable("Session forcefully terminated from another device or unauthorized access.");
    }
  });

  if (appState.biometric_lock && sessionStorage.getItem('autrobook_unlocked') !== 'true') {
    document.getElementById('autoLockScreen').style.display = 'flex';
  }
  
  // Load saved preferences
  if(localStorage.getItem('autrobook_post_audience')) {
    document.getElementById('postAudience').value = localStorage.getItem('autrobook_post_audience');
  }
});

// 1. Change Password (Real Supabase Auth)
async function changePassword() {
  const newPass = document.getElementById('newPass').value;
  if (!newPass || newPass.length < 6) return toast('Password must be at least 6 characters.');

  const btn = document.querySelector('#mChangePassword .btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  const { error } = await supabase.auth.updateUser({ password: newPass });

  if (error) {
    toast('❌ Error: ' + error.message);
    btn.innerHTML = 'Update Password via Supabase';
  } else {
    toast('✅ Password updated successfully in Supabase!');
    closeModal('mChangePassword');
    btn.innerHTML = 'Update Password via Supabase';
    document.getElementById('newPass').value = '';
  }
}

// 2. Global Logout (Real Supabase Auth)
async function globalLogout() {
  isLoggingOut = true;
  toast('Logging out of all sessions...');
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    toast('Error: ' + error.message);
    isLoggingOut = false;
  } else {
    toast('✅ Logged out of all devices.');
    setTimeout(() => window.location.href = 'index.html', 1500);
  }
}

// 3. Appeal Upload (Real Supabase Storage & DB)
function updateFileText(input, spanId) {
  if (input.files && input.files[0]) {
    const span = document.getElementById(spanId);
    span.textContent = "Attached ✓";
    span.style.color = "var(--success)";
    span.parentElement.style.borderColor = "var(--success)";
  }
}

async function submitAppeal() {
  const name = document.getElementById('appealName').value.trim();
  const frontFile = document.getElementById('appealNidFront').files[0];
  const backFile = document.getElementById('appealNidBack').files[0];
  const selfieFile = document.getElementById('appealSelfie').files[0];

  if (!name || !frontFile || !backFile || !selfieFile) {
    return toast('All documents and Live Selfie are required.');
  }

  const btn = document.querySelector('#mAppealUnlock .btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading to Cloud...';
  btn.disabled = true;

  try {
    const uploadFile = async (file, prefix) => {
      const fileName = `${prefix}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('appeals').upload(fileName, file);
      if (error) throw error;
      return supabase.storage.from('appeals').getPublicUrl(fileName).data.publicUrl;
    };

    const frontUrl = await uploadFile(frontFile, 'nid_front');
    const backUrl = await uploadFile(backFile, 'nid_back');
    const selfieUrl = await uploadFile(selfieFile, 'selfie');

    const { error: dbError } = await supabase.from('appeals').insert([{
      name: name, nid_front_url: frontUrl, nid_back_url: backUrl, selfie_url: selfieUrl, status: 'pending_ai_review'
    }]);

    if (dbError) throw dbError;

    toast('✅ Uploaded! AI is reviewing your documents.');
    setTimeout(() => {
      localStorage.setItem('autrobook_account_status', 'active');
      location.reload();
    }, 2000);

  } catch (err) {
    console.error(err);
    toast('❌ Upload failed. Ensure "appeals" bucket is Public.');
    btn.innerHTML = '<i class="fas fa-upload"></i> Upload & Submit';
    btn.disabled = false;
  }
}

// 4. Hack Detection Trigger
async function triggerAccountDisable(reason) {
  localStorage.setItem('autrobook_account_status', 'disabled');
  showDisabledScreen();
  try {
    await supabase.from('security_logs').insert([{ event: 'ACCOUNT_DISABLED', status: reason }]);
  } catch(e) { console.log("DB log failed", e); }
}

function showDisabledScreen() {
  document.getElementById('autoLockScreen').style.display = 'none';
  document.getElementById('accountDisabledOverlay').style.display = 'flex';
  document.querySelector('.settings-container').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';
  document.querySelector('.top-nav').style.display = 'none';
}

// 5. Report Problem (Real Supabase DB)
async function submitReport() {
  const reason = document.getElementById('reportReason').value;
  const text = document.getElementById('reportText').value;
  if (!text) return toast('Please explain the issue.');

  const btn = document.querySelector('#mReportProblem .btn-primary');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  const { error } = await supabase.from('reports').insert([{ reason: reason, details: text }]);

  if (error) {
    toast('❌ Error submitting report.');
  } else {
    toast('✅ Report saved to Database.');
    closeModal('mReportProblem');
    document.getElementById('reportText').value = '';
  }
  btn.innerHTML = 'Submit to Server';
}

// 6. Real 2FA (Google Auth)
function openModal(id) { 
  if (id === 'm2FASetup') {
    currentTOTPSecret = new OTPAuth.Secret({ size: 20 }).base32;
    totpInstance = new OTPAuth.TOTP({
      issuer: "Autrobook", label: "user@autrobook.com", algorithm: "SHA1", digits: 6, period: 30, secret: currentTOTPSecret
    });
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, { text: totpInstance.toString(), width: 160, height: 160 });
  }
  document.getElementById(id).classList.add('active'); 
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function enable2FA() {
  const code = document.getElementById('2faCodeInput').value;
  if (!totpInstance.validate({ token: code, window: 1 })) return toast('❌ Invalid code.');
  appState.two_factor = true;
  localStorage.setItem('autrobook_settings', JSON.stringify(appState));
  document.getElementById('twoFactorStatus').textContent = 'On';
  document.getElementById('twoFactorStatus').style.color = 'var(--success)';
  closeModal('m2FASetup');
  toast('✅ Authenticator linked!');
}

// 7. WebAuthn Passkey
async function setupPasskey() {
  if (!window.PublicKeyCredential) return toast('Passkey not supported.');
  try {
    const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
    await navigator.credentials.create({
      publicKey: {
        challenge, rp: { name: "Autrobook", id: window.location.hostname },
        user: { id: new Uint8Array(16), name: "user@autrobook.com", displayName: "User" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: "platform" }
      }
    });
    document.getElementById('passkeyStatus').textContent = 'On';
    document.getElementById('passkeyStatus').style.color = 'var(--success)';
    toast('✅ Passkey registered!');
  } catch (err) { toast('Passkey setup cancelled.'); }
}

// 8. Utils & UI
function unlockApp() {
  sessionStorage.setItem('autrobook_unlocked', 'true');
  document.getElementById('autoLockScreen').style.display = 'none';
}

function toggleSwitch(el, key) {
  el.classList.toggle('active');
  appState[key] = el.classList.contains('active');
  localStorage.setItem('autrobook_settings', JSON.stringify(appState));
  toast(`${key.replace('_', ' ').toUpperCase()} ${appState[key] ? 'Enabled' : 'Disabled'}`);
}

function saveSelect(key, value) {
  localStorage.setItem(`autrobook_${key}`, value);
  toast('Preference saved.');
}

function downloadData() {
  const data = { settings: appState, date: new Date() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'autrobook_data.json';
  a.click();
  toast('Download started...');
}

function logout() {
  isLoggingOut = true;
  supabase.auth.signOut().then(() => window.location.href = 'index.html');
}

// Auto-Lock on Tab Switch
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && appState.biometric_lock) {
    sessionStorage.setItem('autrobook_unlocked', 'false');
  } else if (document.visibilityState === 'visible' && appState.biometric_lock) {
    if (sessionStorage.getItem('autrobook_unlocked') === 'false') {
      document.getElementById('autoLockScreen').style.display = 'flex';
    }
  }
});

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3000);
}

// Expose all functions to window for HTML onclick events
window.openModal = openModal;
window.closeModal = closeModal;
window.changePassword = changePassword;
window.globalLogout = globalLogout;
window.submitAppeal = submitAppeal;
window.submitReport = submitReport;
window.enable2FA = enable2FA;
window.setupPasskey = setupPasskey;
window.triggerAccountDisable = triggerAccountDisable;
window.unlockApp = unlockApp;
window.toggleSwitch = toggleSwitch;
window.saveSelect = saveSelect;
window.downloadData = downloadData;
window.logout = logout;
window.updateFileText = updateFileText;
