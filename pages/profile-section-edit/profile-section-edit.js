function toggleGuard(checkbox) {
    localStorage.setItem('autrobook_pic_guard', checkbox.checked);
    alert(checkbox.checked ? 'Profile Picture Guard Enabled 🛡️' : 'Profile Picture Guard Disabled');
}

function toggleVerificationModal(checkbox) {
    if (checkbox.checked) {
        document.getElementById('verificationModal').style.display = 'flex';
    } else {
        localStorage.setItem('autrobook_verified', 'false');
        alert('Verification badge removed.');
    }
}

function submitVerification() {
    localStorage.setItem('autrobook_verified', 'true');
    document.getElementById('verificationModal').style.display = 'none';
    alert('Verification submitted successfully! Black badge activated ✔️');
}

function searchFamily(query) {
    const resultsBox = document.getElementById('familySearchResults');
    if (!query.trim()) {
        resultsBox.innerHTML = '';
        return;
    }
    // Simulate user search
    resultsBox.innerHTML = `<div style="padding:6px; background:var(--bg-main); border-radius:4px; margin-top:4px; cursor:pointer;" onclick="selectFamilyMember('Supon Mondal')">Supon Mondal (Friend)</div>`;
}

function selectFamilyMember(name) {
    document.getElementById('familySearch').value = name;
    document.getElementById('familySearchResults').innerHTML = '';
    alert(`Family member "${name}" linked successfully!`);
}

function saveProfileChanges() {
    alert('Profile information updated successfully! ✅');
    window.location.href = '../profile-section/profile-section.html';
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('autrobook_pic_guard') === 'true') {
        document.getElementById('guardToggle').checked = true;
    }
    if (localStorage.getItem('autrobook_verified') === 'true') {
        document.getElementById('badgeToggle').checked = true;
    }
});
