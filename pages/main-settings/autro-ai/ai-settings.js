document.addEventListener("DOMContentLoaded", () => {
  initSystemTheme();
  loadAiSettings();
});

// System default theme handler
function initSystemTheme() {
  const savedTheme = localStorage.getItem("autroTheme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.body.setAttribute("data-theme", savedTheme);
  } else {
    // If no manual theme is saved, it will follow the system theme
    document.body.removeAttribute("data-theme");
  }
}

// Manually toggle theme function
function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  let nextTheme;
  if (!currentTheme) {
    nextTheme = systemDark ? "light" : "dark";
  } else {
    nextTheme = currentTheme === "dark" ? "light" : "dark";
  }

  document.body.setAttribute("data-theme", nextTheme);
  localStorage.setItem("autroTheme", nextTheme);
  toast(`Switched to ${nextTheme} mode`);
}

// Toggle switch function
function toggleSwitch(element, settingKey) {
  element.classList.toggle("on");
  const isActive = element.classList.contains("on");
  localStorage.setItem(settingKey, isActive);
}

// Load settings
function loadAiSettings() {
  const settings = {
    aiEnabled: localStorage.getItem("aiEnabled") !== "false",
    aiSmartReply: localStorage.getItem("aiSmartReply") !== "false",
    aiSummary: localStorage.getItem("aiSummary") !== "false",
    aiTranslate: localStorage.getItem("aiTranslate") !== "false",
    aiModel: localStorage.getItem("aiModel") || "gemini-1.5-flash",
    aiPersonality: localStorage.getItem("aiPersonality") || "Friendly"
  };

  if (!settings.aiEnabled) document.getElementById("aiMasterSwitch").classList.remove("on");
  if (!settings.aiSmartReply) document.getElementById("aiReplySwitch").classList.remove("on");
  if (!settings.aiSummary) document.getElementById("aiSummarySwitch").classList.remove("on");
  if (!settings.aiTranslate) document.getElementById("aiTranslateSwitch").classList.remove("on");

  document.getElementById("aiModelSelect").value = settings.aiModel;
  document.getElementById("aiPersonality").value = settings.aiPersonality;
}

// Auto-save on dropdown change
function saveAiConfig() {
  const model = document.getElementById("aiModelSelect").value;
  const personality = document.getElementById("aiPersonality").value;
  localStorage.setItem("aiModel", model);
  localStorage.setItem("aiPersonality", personality);
}

// Save all settings
function saveAutroAiSettings() {
  saveAiConfig();
  toast("Autro AI settings saved successfully! ✨");
}

// Clear chat history
function clearAiMemory() {
  if (confirm("Are you sure you want to clear all Autro AI chat history and cached summaries?")) {
    localStorage.removeItem("autroAiHistory");
    toast("Autro AI memory cleared 🗑️");
  }
}

// Toast notification message
function toast(message) {
  const t = document.getElementById("toast");
  t.innerText = message;
  t.classList.add("show");
  setTimeout(() => {
    t.classList.remove("show");
  }, 3000);
}
