import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://gemyqaniztqrsilayblx.supabase.co';
const supabaseAnonKey = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Feature name -> target link mapping
const FEATURE_LINKS = {
  'autro account': 'autro-account.html',
  'meta account': 'autro-account.html',
  'subscriptions': 'subscriptions.html',
  'privacy checkup': 'privacy-checkup.html',
  'family center': 'family-center.html',
  'default audience settings': 'default-audience.html',
  'content preferences': 'content-preferences.html',
  'reaction preferences': 'reaction-preferences.html',
  'notifications': 'notifications-settings.html',
  'accessibility': 'accessibility.html',
  'tab bar': 'tab-bar.html',
  'language and region': 'language-region.html',
  'media': 'media-settings.html',
  'time management': 'settings.html#time',
  'browser': 'browser-settings.html',
  'dark mode': 'dark-mode.html',
  'dashboards': 'Dashboard.html',
  'camera roll sharing suggestions': 'camera-roll-settings.html',
  'ads in content you create': 'ads-in-content.html',
  'early access to features': 'early-access.html',
  'profile locking': 'profile-locking.html',
  'profile details': 'profile-details.html',
  'professional mode': 'professional-mode.html',
  'how people find and contact you': 'find-contact-settings.html',
  'posts': 'posts-settings.html',
  'stories': 'stories-settings.html',
  'pages': 'pages-settings.html',
  'reels': 'reels-settings.html',
  'followers and public content': 'followers-public-content.html',
  'profile and tagging': 'profile-tagging.html',
  'blocking': 'blocking.html',
  'active status': 'active-status.html',
  'ads payments': 'order-payments.html',
  'activity log': 'activity-log.html',
  'device permissions': 'device-permissions.html',
  'apps and websites': 'apps-websites.html',
  'business integrations': 'business-integrations.html',
  'learn how to manage your information': 'manage-information.html',
  'terms of service': 'public/terms/index.html',
  'privacy policy': 'public/privacy-policy/index.html',
  'cookies policy': 'cookies-policy.html',
  'community standards': 'community-standards.html',
  'about': 'about-autrobook.html'
};

// State
let appState = JSON.parse(localStorage.getItem('autrobook_settings') || 'null') || {
  two_factor: false,
  biometric_lock: false
};
let currentTOTPSecret = null;
let totpInstance = null;
let isLoggingOut = false;

function getSystemDefaultTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applySystemDefaultTheme() {
  const savedTheme = localStorage.getItem('theme') || localStorage.getItem('autro_theme');
  const activeTheme = savedTheme || getSystemDefaultTheme();
  const isDark = activeTheme === 'dark';

  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.body.classList.toggle('theme-dark', isDark);
  document.body.classList.toggle('dark', isDark);

  if (window.matchMedia && !savedTheme) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme') && !localStorage.getItem('autro_theme')) {
        const darkNow = e.matches;
        document.documentElement.setAttribute('data-theme', darkNow ? 'dark' : 'light');
        document.body.setAttribute('data-theme', darkNow ? 'dark' : 'light');
        document.body.classList.toggle('theme-dark', darkNow);
        document.body.classList.toggle('dark', darkNow);
      }
    });
  }
}

function createBrandBadge(labelText, isLarge = false) {
  const badge = document.createElement('span');
  badge.className = 'autro-brand-badge';
  badge.textContent = labelText;
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${isLarge ? '28px' : '24px'};
    height: ${isLarge ? '28px' : '24px'};
    border-radius: 50%;
    background: #059669;
    color: #ffffff;
    font-weight: 800;
    font-size: ${isLarge ? '14px' : '12px'};
    flex-shrink: 0;
  `;
  return badge;
}

function slugifyFeatureName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.html';
}

function customizeSettingsPageUI() {
  applySystemDefaultTheme();

  // Remove any WhatsApp entries if present in DOM
  document.querySelectorAll('a, button, .setting-item, .settings-row, .list-item, li').forEach((item) => {
    const txt = (item.textContent || '').trim().toLowerCase();
    if (txt === 'whatsapp') {
      item.remove();
    }
  });

  // Replace "Facebook" wording with "Autrobook" in text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && /facebook/i.test(node.nodeValue)) {
      node.nodeValue = node.nodeValue.replace(/facebook/gi, 'Autrobook');
    }
  }

  // Update items, Meta Account -> Autro Account with "A" icon, and feature links
  const candidates = document.querySelectorAll('a, button, .setting-item, .settings-row, .list-item, li, div');
  candidates.forEach((el) => {
    if (el.closest('#autrobookSystemFooter')) return;
    if (el.children.length > 5) return;

    const rawText = (el.textContent || '').trim();
    const firstLine = rawText.split('\n')[0].trim();
    const normalized = firstLine.toLowerCase();

    if (!normalized) return;

    if (normalized.includes('meta account')) {
      const svgOrIcon = el.querySelector('svg, img, i, .icon, .meta-icon');
      if (svgOrIcon) {
        svgOrIcon.replaceWith(createBrandBadge('A', true));
      }
      el.innerHTML = el.innerHTML.replace(/Meta Account/gi, 'Autro Account');
    }

    const matchedKey = Object.keys(FEATURE_LINKS).find((k) => normalized === k || normalized.startsWith(k + '\n'));
    if (matchedKey) {
      const targetUrl = FEATURE_LINKS[matchedKey] || slugifyFeatureName(matchedKey);

      if (matchedKey === 'about') {
        const iconEl = el.querySelector('svg, img, i, .icon');
        if (iconEl) {
          iconEl.replaceWith(createBrandBadge('A', false));
        }
        el.setAttribute('data-brand', 'Autrobook');
      }

      if (el.tagName === 'A') {
        el.setAttribute('href', targetUrl);
      } else if (!el.dataset.linkBound) {
        el.dataset.linkBound = '1';
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          if (e.target.closest('input, select, button, .switch, .toggle')) return;
          window.location.href = targetUrl;
        });
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  customizeSettingsPageUI();

  if (localStorage.getItem('autrobook_account_status') === 'disabled') {
    showDisabledScreen();
    return;
  }

  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session) {
      await supabase.auth.signInAnonymously();
    }
  } catch (e) {
    console.warn('Auth session check warning:', e);
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !isLoggingOut) {
      triggerAccountDisable('Session forcefully terminated from another device or unauthorized access.');
    }
  });

  const autoLockEl = document.getElementById('autoLockScreen');
  if (autoLockEl && appState.biometric_lock && sessionStorage.getItem('autrobook_unlocked') !== 'true') {
    autoLockEl.style.display = 'flex';
  }

  const postAudienceEl = document.getElementById('postAudience');
  if (postAudienceEl && localStorage.getItem('autrobook_post_audience')) {
    postAudienceEl.value = localStorage.getItem('autrobook_post_audience');
  }
});

async function changePassword() {
  const newPassInput = document.getElementById('newPass');
  const newPass = newPassInput ? newPassInput.value : '';
  if (!newPass || newPass.length < 6) {
    return toast('Password must be at least 6 characters.');
  }

  const btn = document.querySelector('#mChangePassword .btn-primary');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  const { error } = await supabase.auth.updateUser({ password: newPass });

  if (error) {
    toast('❌ Error: ' + error.message);
    if (btn) btn.innerHTML = 'Update Password via Supabase';
  } else {
    toast('✅ Password updated successfully in Supabase!');
    closeModal('mChangePassword');
    if (btn) btn.innerHTML = 'Update Password via Supabase';
    if (newPassInput) newPassInput.value = '';
  }
}

async function globalLogout() {
  isLoggingOut = true;
  toast('Logging out of all sessions...');
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    toast('Error: ' + error.message);
    isLoggingOut = false;
  } else {
    toast('✅ Logged out of all devices.');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }
}

function updateFileText(input, spanId) {
  if (input.files && input.files[0]) {
    const span = document.getElementById(spanId);
    if (span) {
      span.textContent = 'Attached ✓';
      span.style.color = 'var(--success)';
      if (span.parentElement) {
        span.parentElement.style.borderColor = 'var(--success)';
      }
    }
  }
}

async function submitAppeal() {
  const name = document.getElementById('appealName')?.value.trim();
  const frontFile = document.getElementById('appealNidFront')?.files[0];
  const backFile = document.getElementById('appealNidBack')?.files[0];
  const selfieFile = document.getElementById('appealSelfie')?.files[0];

  if (!name || !frontFile || !backFile || !selfieFile) {
    return toast('All documents and Live Selfie are required.');
  }

  const btn = document.querySelector('#mAppealUnlock .btn-primary');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading to Cloud...';
    btn.disabled = true;
  }

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

    const { error: dbError } = await supabase.from('appeals').insert([
      {
        name,
        nid_front_url: frontUrl,
        nid_back_url: backUrl,
        selfie_url: selfieUrl,
        status: 'pending_ai_review'
      }
    ]);

    if (dbError) throw dbError;

    toast('✅ Uploaded! AI is reviewing your documents.');
    setTimeout(() => {
      localStorage.setItem('autrobook_account_status', 'active');
      location.reload();
    }, 2000);
  } catch (err) {
    console.error(err);
    toast('❌ Upload failed. Ensure "appeals" bucket is Public.');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-upload"></i> Upload & Submit';
      btn.disabled = false;
    }
  }
}

async function triggerAccountDisable(reason) {
  localStorage.setItem('autrobook_account_status', 'disabled');
  showDisabledScreen();
  try {
    await supabase.from('security_logs').insert([{ event: 'ACCOUNT_DISABLED', status: reason }]);
  } catch (e) {
    console.log('DB log failed', e);
  }
}

function showDisabledScreen() {
  const autoLock = document.getElementById('autoLockScreen');
  const disabledOverlay = document.getElementById('accountDisabledOverlay');
  if (autoLock) autoLock.style.display = 'none';
  if (disabledOverlay) disabledOverlay.style.display = 'flex';

  ['.settings-container', '.bottom-nav', '.top-nav'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });
}

async function submitReport() {
  const reason = document.getElementById('reportReason')?.value;
  const textEl = document.getElementById('reportText');
  const text = textEl?.value;
  if (!text) return toast('Please explain the issue.');

  const btn = document.querySelector('#mReportProblem .btn-primary');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  const { error } = await supabase.from('reports').insert([{ reason, details: text }]);

  if (error) {
    toast('❌ Error submitting report.');
  } else {
    toast('✅ Report saved to Database.');
    closeModal('mReportProblem');
    if (textEl) textEl.value = '';
  }
  if (btn) btn.innerHTML = 'Submit to Server';
}

function openModal(id) {
  if (id === 'm2FASetup' && window.OTPAuth && window.QRCode) {
    currentTOTPSecret = new OTPAuth.Secret({ size: 20 }).base32;
    totpInstance = new OTPAuth.TOTP({
      issuer: 'Autrobook',
      label: 'user@autrobook.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: currentTOTPSecret
    });
    const qrContainer = document.getElementById('qrcode-container');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, { text: totpInstance.toString(), width: 160, height: 160 });
    }
  }
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function enable2FA() {
  const code = document.getElementById('2faCodeInput')?.value;
  if (!totpInstance || !totpInstance.validate({ token: code, window: 1 })) {
    return toast('❌ Invalid code.');
  }
  appState.two_factor = true;
  localStorage.setItem('autrobook_settings', JSON.stringify(appState));
  const statusEl = document.getElementById('twoFactorStatus');
  if (statusEl) {
    statusEl.textContent = 'On';
    statusEl.style.color = 'var(--success)';
  }
  closeModal('m2FASetup');
  toast('✅ Authenticator linked!');
}

async function setupPasskey() {
  if (!window.PublicKeyCredential) return toast('Passkey not supported.');
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Autrobook', id: window.location.hostname },
        user: { id: new Uint8Array(16), name: 'user@autrobook.com', displayName: 'User' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: 'platform' }
      }
    });
    const statusEl = document.getElementById('passkeyStatus');
    if (statusEl) {
      statusEl.textContent = 'On';
      statusEl.style.color = 'var(--success)';
    }
    toast('✅ Passkey registered!');
  } catch (err) {
    toast('Passkey setup cancelled.');
  }
}

function unlockApp() {
  sessionStorage.setItem('autrobook_unlocked', 'true');
  const autoLock = document.getElementById('autoLockScreen');
  if (autoLock) autoLock.style.display = 'none';
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
  supabase.auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

document.addEventListener('visibilitychange', () => {
  const autoLock = document.getElementById('autoLockScreen');
  if (!autoLock) return;
  if (document.visibilityState === 'hidden' && appState.biometric_lock) {
    sessionStorage.setItem('autrobook_unlocked', 'false');
  } else if (document.visibilityState === 'visible' && appState.biometric_lock) {
    if (sessionStorage.getItem('autrobook_unlocked') === 'false') {
      autoLock.style.display = 'flex';
    }
  }
});

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3000);
}

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
