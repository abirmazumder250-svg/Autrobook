(function () {
  const LOGO_SOURCES = [
    "logo.png",
    "./logo.png",
    "/logo.png",
    "assets/logo.png",
    "images/logo.png"
  ];

  function applySystemTheme() {
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("autro_theme_mode");
    const useDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    document.documentElement.setAttribute("data-theme", useDark ? "dark" : "light");
    document.body.classList.toggle("dark", useDark);
    document.body.classList.toggle("theme-dark", useDark);
  }

  function hydrateBrandLogos() {
    const imgs = document.querySelectorAll("[data-autro-logo]");
    if (!imgs.length) return;

    const probe = new Image();
    let idx = 0;

    function nextSrc() {
      if (idx >= LOGO_SOURCES.length) return;
      const candidate = LOGO_SOURCES[idx++];
      probe.onload = () => {
        imgs.forEach((img) => {
          img.src = candidate;
          img.style.display = "block";
          const fallback = img.parentElement
            ? img.parentElement.querySelector("[data-autro-logo-fallback]")
            : null;
          if (fallback) fallback.style.display = "none";
          if (img.classList.contains("footer-small-logo")) {
            const footerFb = document.querySelector(".footer-small-logo-fallback");
            if (footerFb) footerFb.style.display = "none";
          }
        });
      };
      probe.onerror = nextSrc;
      probe.src = candidate;
    }

    nextSrc();
  }

  function bindSettingsSearch() {
    const searchInput = document.getElementById("settingsSearchInput");
    const focusBtn = document.getElementById("searchFocusBtn");
    const sections = Array.from(document.querySelectorAll(".settings-section"));

    if (focusBtn && searchInput) {
      focusBtn.addEventListener("click", () => {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();

      sections.forEach((section) => {
        const items = Array.from(section.querySelectorAll(".setting-link-item, .autro-account-card"));
        if (!query) {
          section.classList.remove("is-hidden");
          items.forEach((item) => item.classList.remove("is-hidden"));
          return;
        }

        let matchedCount = 0;
        items.forEach((item) => {
          const text = (item.textContent || "").toLowerCase();
          const match = text.includes(query);
          item.classList.toggle("is-hidden", !match);
          if (match) matchedCount += 1;
        });

        section.classList.toggle("is-hidden", matchedCount === 0);
      });
    });
  }

  window.showSettingsToast = function (message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window._autroToastTimer);
    window._autroToastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  };

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySystemTheme);
  }

  applySystemTheme();
  hydrateBrandLogos();
  bindSettingsSearch();
})();
