const directoryUsers = [
  { id: "usr_101", name: "Babul Kumar Mazumder" },
  { id: "usr_102", name: "Monika Mitra" },
  { id: "usr_103", name: "Aovijit Halder" },
  { id: "usr_104", name: "Arnab Mandal" },
  { id: "usr_105", name: "Rama Mitra" }
];

let selectedFamily = [];

function previewEditImage(event, imgId) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = document.getElementById(imgId);
    img.src = reader.result;
    img.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function verifyDocuments() {
  const front = document.getElementById("nidFrontInput").files.length;
  const back = document.getElementById("nidBackInput").files.length;
  const selfie = document.getElementById("selfieInput").files.length;

  if (!front || !back || !selfie) {
    alert("Please upload NID Front, NID Back, and a Selfie first!");
    return;
  }

  document.getElementById("editBlackBadgeToggle").checked = true;
  document.getElementById("kycStatusMsg").textContent = "✔ Documents Verified! Black Verification Badge is now ACTIVE.";
}

function searchFamilyIds() {
  const query = document.getElementById("familySearchInput").value.toLowerCase();
  const resultsBox = document.getElementById("familySearchResults");
  if (!query) {
    resultsBox.innerHTML = "";
    return;
  }
  const matches = directoryUsers.filter(u => u.name.toLowerCase().includes(query) || u.id.includes(query));
  resultsBox.innerHTML = matches.map(u =>
    `<div class="search-option" onclick="selectFamilyMember('${u.name}')">${u.name} (${u.id})</div>`
  ).join("");
}

function selectFamilyMember(name) {
  const relation = document.getElementById("familyRelationSelect").value;
  selectedFamily.push({ name, relation });
  document.getElementById("familySearchInput").value = "";
  document.getElementById("familySearchResults").innerHTML = "";
  renderFamilyTags();
}

function renderFamilyTags() {
  document.getElementById("selectedFamilyList").innerHTML = selectedFamily
    .map(f => `<span class="family-tag">${f.name} (${f.relation})</span>`).join("");
}

function saveProfileEdits() {
  const payload = {
    name: document.getElementById("editName").value,
    bio: document.getElementById("editBio").value,
    school: document.getElementById("editSchool").value,
    university: document.getElementById("editUniversity").value,
    relationship: document.getElementById("editRelationship").value,
    profileGuard: document.getElementById("editProfileGuard").checked,
    blackBadge: document.getElementById("editBlackBadgeToggle").checked,
    family: selectedFamily
  };
  localStorage.setItem("autro_normal_profile", JSON.stringify(payload));
  alert("Normal Profile updated successfully!");
  window.location.href = "../profile-section.html";
}
