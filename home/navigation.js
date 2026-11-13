// ========== AUTROBOOK PAGE NAVIGATION SYSTEM ==========

// Load a component into a div. Used for Header and Bottom Nav
async function loadComponent(containerId, filePath) {
  const container = document.getElementById(containerId);
  if (!container) return console.error('Container not found:', containerId);
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    container.innerHTML = html;
    
    // Run any script tags inside loaded html
    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    
  } catch (error) {
    console.error('Error loading component:', filePath, error);
    container.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load ${filePath}</div>`;
  }
}

// Main function to navigate between pages
let currentPage = '';

async function navigateTo(pagePath, addToHistory = true) {
  const app = document.getElementById('app-container');
  if (!app) return;
  
  // Don't reload same page
  if (currentPage === pagePath) return;
  
  // Show loading
  app.innerHTML = `
    <div class="card" style="text-align:center;padding:40px">
      <p>Loading...</p>
    </div>
  `;
  window.scrollTo(0, 0);
  
  try {
    const response = await fetch(pagePath);
    if (!response.ok) throw new Error(`Page not found: ${pagePath}`);
    
    const html = await response.text();
    app.innerHTML = html;
    currentPage = pagePath;
    
    // Update URL without reload
    if (addToHistory) {
      history.pushState({ page: pagePath }, '', `#${pagePath.replace('pages/', '').replace('.html', '')}`);
    }
    
    // Update active tab in bottom nav
    updateActiveNav(pagePath);
    
    // Run scripts inside loaded page
    app.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    
  } catch (error) {
    console.error('Navigation Error:', error);
    app.innerHTML = `
      <div class="card" style="text-align:center">
        <h3 style="color:var(--danger)">404 - Page Not Found</h3>
        <p>File: ${pagePath}</p>
        <button onclick="navigateTo('pages/01-feed.html')">Go to Home</button>
      </div>
    `;
  }
}

// Update active class in bottom navigation
function updateActiveNav(pagePath) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === pagePath) {
      item.classList.add('active');
    }
  });
}

// Handle browser back/forward button
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.page) {
    navigateTo(event.state.page, false);
  } else {
    navigateTo('pages/01-feed.html', false);
  }
});

// Quick helper to go to page by name only
function goTo(pageName) {
  navigateTo(`pages/${pageName}.html`);
}

// Show Toast Notification
function showToast(message) {
  let toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: var(--brand); color: white; padding: 12px 20px;
    border-radius: 20px; z-index: 9999; font-weight: 600;
    animation: fadeInOut 2s forwards;
  `;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Add fade animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInOut {
  0% {opacity: 0; transform: translateX(-50%) translateY(20px)}
  20% {opacity: 1; transform: translateX(-50%) translateY(0)}
  80% {opacity: 1; transform: translateX(-50%) translateY(0)}
  100% {opacity: 0; transform: translateX(-50%) translateY(-20px)}
}`;
document.head.appendChild(style);
