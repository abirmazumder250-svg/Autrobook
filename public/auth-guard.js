(function () {
  const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

  // Change to your login or signup page filename (e.g., 'login.html', 'signup.html', or 'index.html')
  const AUTH_PAGE = 'login.html';

  // Pages that do not require authentication
  const PUBLIC_PAGES = ['login.html', 'signup.html', 'auth.html'];

  const currentFile = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if (PUBLIC_PAGES.includes(currentFile)) {
    return;
  }

  // Hide page content until the session is verified
  const hideStyle = document.createElement('style');
  hideStyle.id = 'autro-auth-guard-style';
  hideStyle.textContent =
    'html.autro-auth-checking body { visibility: hidden !important; opacity: 0 !important; }';
  document.documentElement.classList.add('autro-auth-checking');
  (document.head || document.documentElement).appendChild(hideStyle);

  function redirectToAuth() {
    try {
      const nextUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`${AUTH_PAGE}?next=${nextUrl}`);
    } catch (_) {
      window.location.href = AUTH_PAGE;
    }
  }

  function revealPage() {
    document.documentElement.classList.remove('autro-auth-checking');
    const styleEl = document.getElementById('autro-auth-guard-style');
    if (styleEl) styleEl.remove();
  }

  async function enforceAuth() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      redirectToAuth();
      return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
      const { data, error } = await sb.auth.getSession();
      let user = data?.session?.user || null;

      if (!user && typeof sb.auth.getUser === 'function') {
        const { data: userData } = await sb.auth.getUser();
        user = userData?.user || null;
      }

      if (error || !user) {
        redirectToAuth();
        return;
      }

      revealPage();

      if (sb.auth && typeof sb.auth.onAuthStateChange === 'function') {
        sb.auth.onAuthStateChange((_event, session) => {
          if (!session || !session.user) {
            redirectToAuth();
          }
        });
      }
    } catch (_) {
      redirectToAuth();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceAuth);
  } else {
    enforceAuth();
  }
})();
