<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign In — Autrobook</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    :root,
    :root[data-theme="light"] {
      --bg-page: #f0f2f5;
      --bg-card: #ffffff;
      --text-main: #050505;
      --text-muted: #65676b;
      --border-color: #e4e6eb;
      --btn-bg: #16a34a;
      --btn-hover: #15803d;
      --btn-text: #ffffff;
      --shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    :root[data-theme="dark"],
    html.dark,
    body.dark-theme {
      --bg-page: #18191a;
      --bg-card: #242526;
      --text-main: #e4e6eb;
      --text-muted: #b0b3b8;
      --border-color: #3e4042;
      --btn-bg: #22c55e;
      --btn-hover: #16a34a;
      --btn-text: #050505;
      --shadow-soft: 0 6px 20px rgba(0, 0, 0, 0.35);
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        --bg-page: #18191a;
        --bg-card: #242526;
        --text-main: #e4e6eb;
        --text-muted: #b0b3b8;
        --border-color: #3e4042;
        --btn-bg: #22c55e;
        --btn-hover: #16a34a;
        --btn-text: #050505;
        --shadow-soft: 0 6px 20px rgba(0, 0, 0, 0.35);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    html, body {
      height: 100%;
      background-color: var(--bg-page);
      color: var(--text-main);
    }

    .login-shell {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: var(--shadow-soft);
    }

    .login-card h1 {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .login-card p {
      font-size: 14.5px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }

    .google-btn {
      width: 100%;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 700;
      background-color: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background-color 0.15s ease, opacity 0.15s ease, transform 0.12s ease;
    }

    .google-btn:hover:not(:disabled) {
      background-color: var(--btn-hover);
    }

    .google-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .google-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .status-msg {
      margin-top: 14px;
      font-size: 13px;
      color: var(--text-muted);
      min-height: 18px;
    }
  </style>
</head>
<body>
  <main class="login-shell">
    <section class="login-card">
      <h1>Welcome to Autrobook</h1>
      <p>Please sign in to continue</p>

      <button id="googleLoginBtn" class="google-btn" type="button">
        Continue with Google
      </button>

      <div id="statusMessage" class="status-msg" role="status" aria-live="polite"></div>
    </section>
  </main>

  <script>
    (function () {
      const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
      const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
      const REDIRECT_URL = 'https://autrobook.vercel.app';

      const googleBtn = document.getElementById('googleLoginBtn');
      const statusMessage = document.getElementById('statusMessage');

      let supabaseClient = null;
      try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
          supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
      } catch (err) {
        console.error('Supabase init error:', err);
      }

      function applySavedTheme() {
        const keys = ['autro_theme', 'autrobook_theme', 'theme', 'autrobook_dark_mode'];
        for (const k of keys) {
          try {
            const val = (localStorage.getItem(k) || sessionStorage.getItem(k) || '').toLowerCase().trim();
            if (val === 'dark' || val === '1' || val === 'true') {
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.classList.add('dark');
              return;
            }
            if (val === 'light' || val === '0' || val === 'false') {
              document.documentElement.setAttribute('data-theme', 'light');
              document.documentElement.classList.remove('dark');
              return;
            }
          } catch (_) {}
        }
      }

      async function checkExistingSession() {
        if (!supabaseClient) return;
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session && session.user) {
            window.location.replace(REDIRECT_URL);
          }
        } catch (_) {}
      }

      async function handleGoogleLogin() {
        if (!supabaseClient) {
          statusMessage.textContent = 'Authentication service is unavailable.';
          return;
        }

        googleBtn.disabled = true;
        googleBtn.textContent = 'Signing in...';
        statusMessage.textContent = '';

        try {
          const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: REDIRECT_URL
            }
          });

          if (error) {
            console.error('Login Error:', error.message);
            statusMessage.textContent = error.message || 'Could not start Google sign-in.';
            googleBtn.disabled = false;
            googleBtn.textContent = 'Continue with Google';
          }
        } catch (err) {
          console.error('Login Error:', err);
          statusMessage.textContent = 'Network error while signing in.';
          googleBtn.disabled = false;
          googleBtn.textContent = 'Continue with Google';
        }
      }

      applySavedTheme();
      checkExistingSession();
      googleBtn.addEventListener('click', handleGoogleLogin);
    })();
  </script>
</body>
</html>
