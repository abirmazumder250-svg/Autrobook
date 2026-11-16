document.addEventListener("DOMContentLoaded", () => {
  // 1. Back navigation
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "../../index.html";
      }
    });
  }

  // 2. Quick Status button
  const statusQuickBtn = document.getElementById("statusQuickBtn");
  if (statusQuickBtn) {
    statusQuickBtn.addEventListener("click", () => {
      window.location.href = "../../profile-status.html";
    });
  }

  // 3. Toggle Menu Search Bar & Live Filter
  const searchMenuBtn = document.getElementById("searchMenuBtn");
  const menuSearchBox = document.getElementById("menuSearchBox");
  const menuSearchInput = document.getElementById("menuSearchInput");
  const allCards = document.querySelectorAll(".grid-card, .sub-link");

  if (searchMenuBtn && menuSearchBox) {
    searchMenuBtn.addEventListener("click", () => {
      const isHidden = menuSearchBox.hasAttribute("hidden");
      if (isHidden) {
        menuSearchBox.removeAttribute("hidden");
        menuSearchInput.focus();
      } else {
        menuSearchBox.setAttribute("hidden", "");
        menuSearchInput.value = "";
        allCards.forEach((card) => (card.style.display = ""));
      }
    });
  }

  if (menuSearchInput) {
    menuSearchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      allCards.forEach((item) => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
          item.removeAttribute("hidden");
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  // 4. See More / See Less Toggle
  const toggleMoreBtn = document.getElementById("toggleMoreBtn");
  const extraFeatures = document.querySelectorAll(".extra-feature");
  let expanded = false;

  if (toggleMoreBtn) {
    toggleMoreBtn.addEventListener("click", () => {
      expanded = !expanded;
      extraFeatures.forEach((card) => {
        if (expanded) {
          card.removeAttribute("hidden");
        } else {
          card.setAttribute("hidden", "");
        }
      });
      toggleMoreBtn.querySelector("span").textContent = expanded ? "See less" : "See more";
      toggleMoreBtn.querySelector("i").className = expanded
        ? "ri-arrow-up-s-line"
        : "ri-arrow-down-s-line";
    });
  }

  // 5. Accordion Expand/Collapse
  const accordionHeaders = document.querySelectorAll(".accordion-header");
  accordionHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const parentItem = header.parentElement;
      parentItem.classList.toggle("open");
    });
  });

  // 6. Red Logout Button Confirmation Modal
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

  if (logoutBtn && logoutModal) {
    logoutBtn.addEventListener("click", () => {
      logoutModal.removeAttribute("hidden");
    });
  }

  if (cancelLogoutBtn && logoutModal) {
    cancelLogoutBtn.addEventListener("click", () => {
      logoutModal.setAttribute("hidden", "");
    });

    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        logoutModal.setAttribute("hidden", "");
      }
    });
  }

  // 7. Load saved user info from localStorage if available
  const savedName = localStorage.getItem("autro_user_name");
  const savedAvatar = localStorage.getItem("autro_user_avatar");
  if (savedName) {
    document.getElementById("userName").textContent = savedName;
  }
  if (savedAvatar) {
    document.getElementById("userAvatar").src = savedAvatar;
  }
});
