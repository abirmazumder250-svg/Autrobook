function applyFilter(type) {
    const preview = document.getElementById('photoPreview');
    const filters = {
        vivid: 'contrast(1.3) saturate(1.4)',
        noir: 'grayscale(1)',
        emerald: 'hue-rotate(90deg) saturate(1.3)'
    };
    preview.style.filter = filters[type] || 'none';
}
