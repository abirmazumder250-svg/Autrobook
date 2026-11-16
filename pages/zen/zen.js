function toggleZen() {
    document.body.classList.toggle('zen-active');
    const active = document.body.classList.contains('zen-active');
    alert(active ? "Zen Mode Enabled" : "Zen Mode Disabled");
}
