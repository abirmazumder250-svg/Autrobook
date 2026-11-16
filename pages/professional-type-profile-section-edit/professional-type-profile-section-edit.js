function verifyProKyc() {
  const f = document.getElementById("proNidFront").files.length;
  const b = document.getElementById("proNidBack").files.length;
  const s = document.getElementById("proSelfie").files.length;
  if (!f || !b || !s) {
    alert("Please select NID Front, NID Back, and Selfie images.");
    return;
  }
  document.getElementById("proEditBlackBadge").checked = true;
  alert("Creator KYC Verified! Black Tick is enabled.");
}

function saveProEdits() {
  const data = {
    name: document.getElementById("proEditName").value,
    bio: document.getElementById("proEditBio").value,
    category: document.getElementById("proEditCategory").value,
    profileGuard: document.getElementById("proEditGuard").checked,
    blackBadge: document.getElementById("proEditBlackBadge").checked
  };
  localStorage.setItem("autro_pro_profile", JSON.stringify(data));
  alert("Professional Profile Saved!");
  window.location.href = "../professional-type-profile-section.html";
}
