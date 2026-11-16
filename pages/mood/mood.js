function setVibe(vibeKey, vibeName) {
    localStorage.setItem('autrobook_vibe', vibeKey);
    document.getElementById('activeVibe').textContent = `Current Vibe: ${vibeName} Active ✨`;
    alert(`Feed successfully tuned to: ${vibeName}`);
}
