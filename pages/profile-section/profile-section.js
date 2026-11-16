let tempImageFile = null;
let activeImageType = '';

function toggleProfessionalMode(isPro) {
    if (isPro) {
        document.getElementById('normalButtons').style.display = 'none';
        document.getElementById('proButtons').style.display = 'flex';
        alert('Professional Mode Enabled! You can now access Dashboard & Creator Tools.');
    } else {
        document.getElementById('normalButtons').style.display = 'flex';
        document.getElementById('proButtons').style.display = 'none';
        alert('Professional Mode Disabled.');
    }
}

function previewImage(event, type) {
    const file = event.target.files[0];
    if (file) {
        tempImageFile = file;
        activeImageType = type;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('reviewImgPreview').src = e.target.result;
            document.getElementById('reviewModal').style.display = 'flex';
        }
        reader.readAsDataURL(file);
    }
}

function confirmImageUpload() {
    if (tempImageFile) {
        const imageUrl = URL.createObjectURL(tempImageFile);
        if (activeImageType === 'avatar') {
            document.getElementById('profileImg').src = imageUrl;
        } else if (activeImageType === 'cover') {
            document.getElementById('coverContainer').style.backgroundImage = `url(${imageUrl})`;
            document.getElementById('coverContainer').style.backgroundSize = 'cover';
        }
    }
    closeReviewModal();
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    tempImageFile = null;
}

function addStory() {
    alert('Opening Gallery to select story media...');
}

function openDashboard() {
    document.getElementById('dashboardModal').style.display = 'flex';
}

function openCreateMenu() {
    document.getElementById('createModal').style.display = 'flex';
}

function openSecurityCheck() {
    document.getElementById('securityModal').style.display = 'flex';
}

function fixSecurityIssues() {
    document.getElementById('secTwoFAStatus').innerHTML = '2FA Security: <strong style="color:var(--brand-green);">All is OK ✅</strong>';
    document.getElementById('securityStatusBox').style.border = '2px solid var(--brand-green)';
    alert('All security issues resolved successfully! Account is fully secure.');
}

function openActivityLog() {
    alert('Opening Activity Log & Trash bin...');
}

function viewAsPublic() {
    alert('Switching view to public visitor mode (Poke & Report options enabled for others).');
}

window.addEventListener('DOMContentLoaded', () => {
    // Load guard status
    if (localStorage.getItem('autrobook_pic_guard') === 'true') {
        document.getElementById('guardBadge').style.display = 'block';
    }
    // Load verification batch
    if (localStorage.getItem('autrobook_verified') === 'true') {
        document.getElementById('verifiedCheck').style.display = 'inline';
    }
});
