(function () {
  const LOGO_SOURCES = [
    "logo.png",
    "./logo.png",
    "/logo.png",
    "assets/logo.png",
    "images/logo.png"
  ];

  function applyThemeByTextColor() {
    const target = document.body || document.documentElement;
    if (!target) return;

    const color = getComputedStyle(target).color;
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return;

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);

    // লেখা সাদা হলে true (Dark theme), কালো হলে false (Light theme)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const useDark = brightness >= 128;

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyThemeByTextColor);
  } else {
    applyThemeByTextColor();
  }

  const observer = new MutationObserver(applyThemeByTextColor);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"]
  });
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  hydrateBrandLogos();
  bindSettingsSearch();
})();
