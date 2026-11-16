/* ============================================================
   AUTROBOOK - SETTINGS PAGE JAVASCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Set dynamic year (2026, 2027, etc.)
  document.getElementById('dynamicYear').textContent = new Date().getFullYear();
});

// ===== MODAL CONTROLS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ===== TOGGLE SWITCHES =====
function toggleSwitch(element, featureName) {
  // Toggle the visual state
  const toggle = element.querySelector('.toggle-switch');
  toggle.classList.toggle('active');
  
  const isActive = toggle.classList.contains('active');
  
  if (featureName === '18+') {
    if (isActive) {
      // Added extra confirmation for 18+ Guard
      const confirmAge = confirm("🔞 Age Verification\n\nAre you sure you want to enable 18+ Content Guard? Mature content will be hidden.");
      if (!confirmAge) {
        toggle.classList.remove('active'); // Revert if cancelled
      } else {
        alert("✅ 18+ Content Guard is now ACTIVE. Sensitive posts will be blurred.");
      }
    } else {
      alert("18+ Content Guard is OFF.");
    }
  } 
  else if (featureName === 'Zen') {
    if (isActive) {
      document.body.style.background = '#000';
      document.body.style.color = '#fff';
      alert("🌿 Zen Mode Activated. Distractions hidden.");
    } else {
      document.body.style.background = 'var(--bg)';
      document.body.style.color = 'var(--text)';
    }
  } 
  else if (featureName === 'Lower Data') {
    if (isActive) {
      alert("📶 Lower Data Mode ON.\nHD images will now load in SD to save data.");
    } else {
      alert("Lower Data Mode OFF.");
    }
  }
}

// ===== THEME (System Default) =====
function toggleTheme() {
  alert("🎨 Theme is set to: System Default.\nAutrobook automatically switches between Light and Dark mode based on your phone settings.");
}

// ===== BLOOD DONATION HUB =====
let currentBloodType = 'Donor';

function setBloodType(type) {
  currentBloodType = type;
  const btnDonor = document.getElementById('btnDonor');
  const btnReceiver = document.getElementById('btnReceiver');
  
  if (type === 'Donor') {
    btnDonor.classList.add('active');
    btnReceiver.classList.remove('active');
  } else {
    btnReceiver.classList.add('active');
    btnDonor.classList.remove('active');
  }
}

// Handle NID File Selection (Visual Feedback)
document.getElementById('nidFront').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    const label = this.parentElement;
    label.style.borderColor = 'var(--primary)';
    label.style.color = 'var(--primary)';
    label.querySelector('span').innerText = "Front Uploaded ✅";
  }
});

document.getElementById('nidBack').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    const label = this.parentElement;
    label.style.borderColor = 'var(--primary)';
    label.style.color = 'var(--primary)';
    label.querySelector('span').innerText = "Back Uploaded ✅";
  }
});

function submitBloodRequest() {
  const name = document.getElementById('bloodName').value.trim();
  const address = document.getElementById('bloodAddress').value.trim();
  const group = document.getElementById('bloodGroup').value;
  const phone = document.getElementById('bloodPhone').value.trim();
  const nidFront = document.getElementById('nidFront').files.length;
  const nidBack = document.getElementById('nidBack').files.length;

  if (!name || !address || !group || !phone || nidFront === 0 || nidBack === 0) {
    alert("⚠️ Please fill in all fields (Name, Address, Blood Group, Phone) and upload both NID pictures.");
    return;
  }

  // Simulate submission
  alert(`✅ Request Submitted Successfully!\n\nType: ${currentBloodType}\nName: ${name}\nBlood Group: ${group}\nPhone: ${phone}\n\nOur team will verify your NID within 24 hours.`);
  closeModal('mBlood');
  
  // Clear form
  document.getElementById('bloodName').value = '';
  document.getElementById('bloodAddress').value = '';
  document.getElementById('bloodGroup').value = '';
  document.getElementById('bloodPhone').value = '';
  document.getElementById('nidFront').value = '';
  document.getElementById('nidBack').value = '';
  document.querySelector('#nidFront').parentElement.querySelector('span').innerText = "NID Front";
  document.querySelector('#nidBack').parentElement.querySelector('span').innerText = "NID Back";
  document.querySelector('#nidFront').parentElement.style.borderColor = 'var(--border)';
  document.querySelector('#nidFront').parentElement.style.color = 'var(--muted)';
  document.querySelector('#nidBack').parentElement.style.borderColor = 'var(--border)';
  document.querySelector('#nidBack').parentElement.style.color = 'var(--muted)';
}

// ===== LOGOUT =====
function logout() {
  if (confirm("Are you sure you want to log out of Autrobook?")) {
    localStorage.clear();
    window.location.href = 'welcome.html';
  }
    }
