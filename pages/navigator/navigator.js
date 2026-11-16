/* ==========================================================
   AUTROBOOK - NAVIGATOR & ROUTING SCRIPT
   ========================================================== */

function navigateToPage(pageUrl) {
    window.location.href = pageUrl;
}

function toggleAppTheme() {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    alert(isLight ? '☀️ Switched to Light Theme' : '🌙 Switched to Dark Theme');
}

// Load theme on startup
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light');
    }
});
