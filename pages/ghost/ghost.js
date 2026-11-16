function toggleGhostMode(checkbox) {
    const statusEl = document.getElementById('ghostStatus');
    if (checkbox.checked) {
        localStorage.setItem('autrobook_ghost', 'active');
        statusEl.textContent = "Status: Active 👻 (You are completely invisible)";
        statusEl.style.color = "var(--brand-green)";
    } else {
        localStorage.setItem('autrobook_ghost', 'inactive');
        statusEl.textContent = "Status: Inactive (Standard Browsing)";
        statusEl.style.color = "var(--text-secondary)";
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('autrobook_ghost') === 'active') {
        document.getElementById('ghostToggle').checked = true;
        document.getElementById('ghostStatus').textContent = "Status: Active 👻 (You are completely invisible)";
    }
});
