* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

:root {
  --bg-page: #f0f2f5;
  --bg-card: #ffffff;
  --bg-row: #f7f8fa;
  --bg-row-hover: #eceef2;
  --text-main: #050505;
  --text-muted: #65676b;
  --border-color: #e4e6eb;
  --brand-green: #0a7d3b;
  --brand-white: #ffffff;
}

html[data-theme="dark"],
body.dark,
body.theme-dark {
  --bg-page: #121212;
  --bg-card: #1e1e1e;
  --bg-row: #262626;
  --bg-row-hover: #303030;
  --text-main: #e4e6eb;
  --text-muted: #b0b3b8;
  --border-color: #323436;
}

body {
  background-color: var(--bg-page);
  color: var(--text-main);
  min-height: 100vh;
  padding-bottom: 36px;
}

.settings-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.back-btn,
.search-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: var(--bg-row);
  color: var(--text-main);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.topbar-logo-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background-color: var(--brand-green);
  color: var(--brand-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.topbar-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: none;
}

.topbar-logo-fallback {
  font-size: 15px;
  font-weight: 800;
  color: var(--brand-white);
}

.settings-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-page-wrap {
  max-width: 680px;
  margin: 0 auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search-box-wrap {
  background-color: var(--bg-card);
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  background-color: var(--bg-row);
  color: var(--text-main);
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 14px;
}

.settings-section {
  background-color: var(--bg-card);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-heading {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.section-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.autro-account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background-color: var(--bg-row);
  text-decoration: none;
  color: var(--text-main);
  margin-bottom: 2px;
}

.autro-account-card:hover {
  background-color: var(--bg-row-hover);
}

.autro-logo-a {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--brand-green);
  color: var(--brand-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.card-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: none;
}

.card-logo-fallback {
  font-size: 20px;
  font-weight: 800;
  color: var(--brand-white);
}

.autro-account-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.autro-account-meta strong {
  font-size: 15px;
  font-weight: 700;
}

.autro-account-meta span {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.35;
}

.setting-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  background-color: var(--bg-row);
  text-decoration: none;
  color: var(--text-main);
  font-size: 14.5px;
  font-weight: 500;
}

.setting-link-item:hover {
  background-color: var(--bg-row-hover);
}

.setting-link-item > i:first-child {
  width: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 15px;
  flex-shrink: 0;
}

.setting-link-item > span:nth-of-type(1) {
  flex: 1;
}

.chevron-right {
  color: var(--text-muted);
  font-size: 12px;
}

.footer-mini-logo {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background-color: var(--brand-green);
  color: var(--brand-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.mini-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: none;
}

.mini-logo-fallback {
  font-size: 11px;
  font-weight: 800;
  color: var(--brand-white);
}

.autrobook-system-footer {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.footer-small-logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  object-fit: cover;
  display: none;
}

.footer-small-logo-fallback {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background-color: var(--brand-green);
  color: var(--brand-white);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.footer-platform-caption {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
}

#toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #111111;
  color: #ffffff;
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 13px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 999;
}

#toast.show {
  opacity: 1;
}
