// Global Session & Login Security Check
function checkUserSession() {
    const user = localStorage.getItem('autrobook_user');
    if (!user && !window.location.href.includes('login.html')) {
        window.location.replace('login.html');
    }
}

function logoutUser() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('autrobook_user');
        window.location.replace('login.html');
    }
}

document.addEventListener('DOMContentLoaded', checkUserSession);
