(function () {
  const LOGO_CANDIDATES = [
    "logo.png",
    "./logo.png",
    "/logo.png",
    "Logo.png",
    "./Logo.png",
    "/Logo.png",
    "assets/logo.png",
    "./assets/logo.png",
    "/assets/logo.png",
    "images/logo.png",
    "./images/logo.png",
    "/images/logo.png"
  ];

  window.AutroSettingsPage = {
    homeUrl: "index.html",
    stylesheetUrl: "css/index.css",
    scriptUrl: "js/index.js"
  };

  function resolveBrandLogos() {
    const imgs = Array.from(document.querySelectorAll("img[data-autro-logo]"));
    if (!imgs.length) return;

    const probe = new Image();
    let idx = 0;

    function applyFallback() {
      imgs.forEach((img) => {
        img.style.display = "none";
        const fb =
          img.parentElement?.querySelector("[data-autro-logo-fallback]") ||
          img.nextElementSibling;
        if (fb && fb.hasAttribute("data-autro-logo-fallback")) {
          fb.style.display = "inline-flex";
        }
      });
    }

    function applyImage(validSrc) {
      imgs.forEach((img) => {
        img.src = validSrc;
        img.style.display = "block";
        const fb =
          img.parentElement?.querySelector("[data-autro-logo-fallback]") ||
          img.nextElementSibling;
        if (fb && fb.hasAttribute("data-autro-logo-fallback")) {
          fb.style.display = "none";
        }
      });
    }

    function tryNext() {
      if (idx >= LOGO_CANDIDATES.length) {
        applyFallback();
        return;
      }
      const candidate = LOGO_CANDIDATES[idx++];
      probe.onload = () => applyImage(candidate);
      probe.onerror = tryNext;
      probe.src = candidate;
    }

    tryNext();
  }

  const backBtn = document.getElementById("backToIndexBtn");
  if (backBtn) {
    backBtn.addEventListener("click", function (e) {
      if (typeof window.onAutroBackToIndex === "function") {
        e.preventDefault();
        window.onAutroBackToIndex("index.html");
      }
    });
  }

  const searchInput = document.getElementById("settingsSearchInput");
  const searchFocusBtn = document.getElementById("searchFocusBtn");

  if (searchFocusBtn && searchInput) {
    searchFocusBtn.addEventListener("click", function () {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll(".settings-section").forEach(function (sec) {
        const links = Array.from(
          sec.querySelectorAll(".setting-link-item, .autro-account-card")
        );
        if (!links.length) return;
        let visibleCount = 0;
        links.forEach(function (item) {
          const matched = !q || item.textContent.toLowerCase().includes(q);
          item.style.display = matched ? "" : "none";
          if (matched) visibleCount++;
        });
        sec.style.display = visibleCount > 0 ? "" : "none";
      });
    });
  }

  // Strictly System Default: white text on black theme, black text on white theme
  function syncSystemTheme() {
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const mode = prefersDark ? "dark" : "light";
    const isDark = mode === "dark";

    document.documentElement.setAttribute("data-theme", mode);
    document.body.classList.toggle("theme-dark", isDark);
    document.body.classList.toggle("dark", isDark);
  }

  resolveBrandLogos();
  syncSystemTheme();
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", syncSystemTheme);
  }
})();
