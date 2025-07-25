(() => {
  const body = document.body;
  if (!body.classList.contains("dark") && !body.classList.contains("light")) body.classList.add("light");
})();
const authContainer = document.querySelector(".auth-container"),
  loginForm = document.getElementById("login-form"),
  registerForm = document.getElementById("register-form"),
  showLoginBtn = document.getElementById("show-login"),
  showRegisterBtn = document.getElementById("show-register"),
  loginUsername = document.getElementById("login-username"),
  loginPassword = document.getElementById("login-password"),
  registerUsername = document.getElementById("register-username"),
  registerPassword = document.getElementById("register-password"),
  authNotif = document.getElementById("auth-notification"),
  toggleThemeBtn = document.getElementById("toggle-theme"),
  appContainer = document.querySelector(".app-container"),
  sidebar = document.querySelector(".sidebar"),
  navItems = document.querySelectorAll(".sidebar nav ul li"),
  pages = document.querySelectorAll(".page"),
  usernameDisplay = document.getElementById("usernameDisplay"),
  journalText = document.getElementById("journalText"),
  moodSelect = document.getElementById("moodSelect"),
  saveEntryBtn = document.getElementById("saveEntryBtn"),
  entriesContainer = document.getElementById("entriesContainer"),
  customEmotionInput = document.getElementById("customEmotionInput"),
  addEmotionBtn = document.getElementById("addEmotionBtn"),
  emotionList = document.getElementById("emotionList"),
  notifPanel = document.getElementById("notificationPanel"),
  notifList = document.getElementById("notifList"),
  notifCount = document.getElementById("notifCount"),
  notificationsIcon = document.querySelector(".notifications"),
  themeToggleSidebar = document.querySelector(".theme-toggle"),
  chartTypeSelect = document.getElementById("chartTypeSelect"),
  timeFrameSelect = document.getElementById("timeFrameSelect"),
  moodChartCtx = document.getElementById("moodChart").getContext("2d"),
  displayNameInput = document.getElementById("displayName"),
  saveSettingsBtn = document.getElementById("saveSettingsBtn"),
  clearDataBtn = document.getElementById("clearDataBtn");

let moodChart = null;
let currentUser = null;
let emotions = [];
let journals = [];
let notifications = [];
let settings = { displayName: "", theme: "light" };

function saveToStorage() {
  if (!currentUser) return;
  localStorage.setItem(currentUser + "-emotions", JSON.stringify(emotions));
  localStorage.setItem(currentUser + "-journals", JSON.stringify(journals));
  localStorage.setItem(currentUser + "-settings", JSON.stringify(settings));
  localStorage.setItem(currentUser + "-displayName", settings.displayName);
}
function loadFromStorage() {
  if (!currentUser) return;
  emotions = JSON.parse(localStorage.getItem(currentUser + "-emotions") || "[]");
  journals = JSON.parse(localStorage.getItem(currentUser + "-journals") || "[]");
  const s = JSON.parse(localStorage.getItem(currentUser + "-settings") || "{}");
  settings = Object.assign({ displayName: "", theme: "light" }, s);
  displayNameInput.value = settings.displayName || "";
  setTheme(settings.theme);
}

function addNotification(text) {
  notifications.push({ id: Date.now(), text });
  updateNotifUI();
}
function updateNotifUI() {
  notifCount.textContent = notifications.length;
  if (notifications.length) notifCount.classList.remove("hidden");
  else notifCount.classList.add("hidden");
  notifList.innerHTML = "";
  notifications.forEach((notif) => {
    const li = document.createElement("li");
    li.textContent = notif.text;
    li.onclick = () => {
      notifications = notifications.filter((n) => n.id !== notif.id);
      updateNotifUI();
    };
    notifList.appendChild(li);
  });
}
function clearNotifications() {
  notifications = [];
  updateNotifUI();
}
notificationsIcon.onclick = () => notifPanel.classList.toggle("hidden");
notifPanel.onclick = (e) => {
  if (e.target === notifPanel) notifPanel.classList.add("hidden");
};

function setTheme(t) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(t);
  settings.theme = t;
  saveToStorage();
}
toggleThemeBtn.onclick = () => {
  const t = settings.theme === "light" ? "dark" : "light";
  setTheme(t);
};
themeToggleSidebar.onclick = () => {
  const t = settings.theme === "light" ? "dark" : "light";
  setTheme(t);
};

function togglePage(pageId) {
  pages.forEach((page) => {
    if (page.id === pageId + "Page") page.classList.remove("hidden");
    else page.classList.add("hidden");
  });
  navItems.forEach((nav) => {
    if (nav.dataset.page === pageId) nav.classList.add("active");
    else nav.classList.remove("active");
  });
}

navItems.forEach((nav) => {
  nav.onclick = () => {
    togglePage(nav.dataset.page);
  };
});

function renderEmotions() {
  emotionList.innerHTML = "";
  if (emotions.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No emotions defined";
    emotionList.appendChild(li);
    moodSelect.innerHTML = '<option>No emotions available</option>';
    moodSelect.disabled = true;
    return;
  }
  moodSelect.disabled = false;
  moodSelect.innerHTML = "";
  emotions.forEach((emo) => {
    const option = document.createElement("option");
    option.value = emo;
    option.textContent = emo;
    moodSelect.appendChild(option);
  });
  emotions.forEach((emo) => {
    const li = document.createElement("li");
    li.textContent = emo;
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.onclick = () => {
      emotions = emotions.filter((e) => e !== emo);
      journals = journals.filter((j) => j.mood !== emo);
      addNotification(`Removed emotion "${emo}" and its journals.`);
      renderEmotions();
      renderJournals();
      renderChart();
      saveToStorage();
    };
    li.appendChild(btn);
    emotionList.appendChild(li);
  });
}

function renderJournals() {
  entriesContainer.innerHTML = "";
  if (journals.length === 0) {
    entriesContainer.textContent = "No journal entries yet.";
    return;
  }
  const grouped = {};
  journals.forEach((j) => {
    if (!grouped[j.mood]) grouped[j.mood] = [];
    grouped[j.mood].push(j);
  });
  for (const mood in grouped) {
    const container = document.createElement("div");
    const header = document.createElement("h3");
    header.textContent = mood;
    header.style.color = "var(--emerald)";
    header.style.marginBottom = "0.25em";
    container.appendChild(header);
    grouped[mood].forEach((entry) => {
      const card = document.createElement("div");
      card.classList.add("entry-card");
      const headerDiv = document.createElement("div");
      headerDiv.classList.add("entry-header");
      const moodDiv = document.createElement("div");
      moodDiv.classList.add("entry-mood");
      moodDiv.textContent = entry.mood.toUpperCase();
      const dateDiv = document.createElement("div");
      dateDiv.classList.add("entry-date");
      dateDiv.textContent = new Date(entry.timestamp).toLocaleString();
      headerDiv.appendChild(moodDiv);
      headerDiv.appendChild(dateDiv);
      const textDiv = document.createElement("div");
      textDiv.classList.add("entry-text");
      textDiv.textContent = entry.text;
      card.appendChild(headerDiv);
      card.appendChild(textDiv);
      container.appendChild(card);
    });
    entriesContainer.appendChild(container);
  }
}

function saveJournal() {
  const text = journalText.value.trim(),
    mood = moodSelect.value;
  if (!text) return void addNotification("Please write something before saving.");
  if (!mood || mood === "No emotions available")
    return void addNotification("Please select a valid emotion.");
  const newEntry = { text, mood, timestamp: Date.now() };
  journals.unshift(newEntry);
  addNotification("Journal entry saved.");
  journalText.value = "";
  renderJournals();
  renderChart();
  saveToStorage();
}
saveEntryBtn.onclick = saveJournal;
addEmotionBtn.onclick = () => {
  const val = customEmotionInput.value.trim();
  if (!val) return void addNotification("Enter a valid emotion.");
  if (emotions.includes(val)) return void addNotification("That emotion already exists.");
  emotions.push(val);
  customEmotionInput.value = "";
  addNotification(`Emotion "${val}" added.`);
  renderEmotions();
  saveToStorage();
};

function makeChartData(journalsData, timeframe) {
  let counts = {};
  const now = new Date();
  let hoursBack = 24;
  switch (timeframe) {
    case "3h":
      hoursBack = 3;
      break;
    case "day":
      hoursBack = 24;
      break;
    case "week":
      hoursBack = 24 * 7;
      break;
    case "month":
      hoursBack = 24 * 30;
      break;
    default:
      hoursBack = 24;
  }
  const cutoff = now.getTime() - hoursBack * 60 * 60 * 1000;
  const filtered = journalsData.filter((j) => j.timestamp >= cutoff);
  filtered.forEach((j) => {
    counts[j.mood] = (counts[j.mood] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  if (labels.length === 0) return { labels: ["No data"], datasets: [{ label: "No data", data: [0], backgroundColor: ["#bbb"] }] };
  const bgColors = labels.map(() => getComputedStyle(document.documentElement).getPropertyValue("--emerald-light").trim());
  return {
    labels,
    datasets: [
      {
        label: "Entries",
        data,
        backgroundColor: bgColors,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue("--emerald-dark").trim(),
        borderWidth: 1,
      },
    ],
  };
}

function renderChart() {
  const chartType = chartTypeSelect.value;
  const timeframe = timeFrameSelect.value;
  const data = makeChartData(journals, timeframe);
  if (moodChart) {
    moodChart.destroy();
    moodChart = null;
  }
  moodChart = new Chart(moodChartCtx, {
    type: chartType,
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--text").trim(),
          },
        },
        tooltip: { enabled: true },
      },
      scales:
        chartType === "bar" || chartType === "line"
          ? {
              x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text").trim() } },
              y: {
                beginAtZero: true,
                ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--text").trim() },
              },
            }
          : {},
      animation: { duration: 700 },
    },
  });
}

chartTypeSelect.onchange = renderChart;
timeFrameSelect.onchange = renderChart;

saveSettingsBtn.onclick = () => {
  settings.displayName = displayNameInput.value.trim();
  saveToStorage();
  usernameDisplay.textContent = settings.displayName || currentUser || "User";
  addNotification("Settings saved.");
};
clearDataBtn.onclick = () => {
  if (confirm("Are you sure you want to clear all your data? This cannot be undone.")) {
    emotions = [];
    journals = [];
    saveToStorage();
    renderEmotions();
    renderJournals();
    renderChart();
    addNotification("All data cleared.");
  }
};

function checkLoggedIn() {
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser && localStorage.getItem(storedUser + "-emotions")) {
    currentUser = storedUser;
    loadFromStorage();
    authContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    usernameDisplay.textContent = settings.displayName || currentUser || "User";
    renderEmotions();
    renderJournals();
    renderChart();
    togglePage("dashboard");
  } else {
    authContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
  }
}
checkLoggedIn();

showLoginBtn.onclick = () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showLoginBtn.classList.add("active");
  showRegisterBtn.classList.remove("active");
  authNotif.textContent = "";
};
showRegisterBtn.onclick = () => {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showRegisterBtn.classList.add("active");
  showLoginBtn.classList.remove("active");
  authNotif.textContent = "";
};
loginForm.onsubmit = (e) => {
  e.preventDefault();
  const user = loginUsername.value.trim(),
    pass = loginPassword.value.trim();
  if (!user || !pass) return (authNotif.textContent = "Please enter username and password.");
  const usersRaw = localStorage.getItem("users");
  if (!usersRaw) return (authNotif.textContent = "No users registered yet.");
  const users = JSON.parse(usersRaw);
  const found = users.find((u) => u.username === user && u.password === pass);
  if (found) {
    currentUser = user;
    localStorage.setItem("currentUser", currentUser);
    loadFromStorage();
    authContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    usernameDisplay.textContent = settings.displayName || currentUser || "User";
    renderEmotions();
    renderJournals();
    renderChart();
    authNotif.textContent = "";
    togglePage("dashboard");
  } else authNotif.textContent = "Invalid username or password.";
};
registerForm.onsubmit = (e) => {
  e.preventDefault();
  const user = registerUsername.value.trim(),
    pass = registerPassword.value.trim();
  if (!user || !pass) return (authNotif.textContent = "Please enter username and password.");
  let usersRaw = localStorage.getItem("users");
  let users = usersRaw ? JSON.parse(usersRaw) : [];
  if (users.find((u) => u.username === user)) return (authNotif.textContent = "Username already taken.");
  users.push({ username: user, password: pass });
  localStorage.setItem("users", JSON.stringify(users));
  authNotif.textContent = "Registration successful. You can now login.";
  registerUsername.value = "";
  registerPassword.value = "";
  showLoginBtn.click();
};

window.addEventListener("beforeunload", saveToStorage);
