import { Chart } from "@/components/ui/chart"
let entries = []
let moods = ["Happy", "Sad", "Anxious", "Excited", "Calm", "Angry", "Grateful", "Stressed"]
let settings = { displayName: "EmotionTracker", theme: "light" }
let editingEntry = null
let chart = null

const templates = [
  "Today I felt... because...",
  "I'm grateful for...",
  "What challenged me today was...",
  "I learned that...",
  "Tomorrow I want to...",
]

function showToast(message) {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.classList.add("show")
  setTimeout(() => toast.classList.remove("show"), 3000)
}

function saveData() {
  localStorage.setItem("emotiontracker_entries", JSON.stringify(entries))
  localStorage.setItem("emotiontracker_moods", JSON.stringify(moods))
  localStorage.setItem("emotiontracker_settings", JSON.stringify(settings))
}

function loadData() {
  entries = JSON.parse(localStorage.getItem("emotiontracker_entries") || "[]")
  moods = JSON.parse(
    localStorage.getItem("emotiontracker_moods") ||
      JSON.stringify(["Happy", "Sad", "Anxious", "Excited", "Calm", "Angry", "Grateful", "Stressed"]),
  )
  settings = JSON.parse(
    localStorage.getItem("emotiontracker_settings") || '{"displayName":"EmotionTracker","theme":"light"}',
  )

  document.getElementById("displayName").value = settings.displayName
  document.getElementById("userName").textContent = settings.displayName
  document.body.className = settings.theme

  renderMoodButtons()
  updateDashboard()
  renderAllEntries()
  renderMoodList()
}

function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"))
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"))

  document.getElementById(`${page}Page`).classList.add("active")
  document.querySelector(`[onclick="showPage('${page}')"]`).classList.add("active")

  const titles = { dashboard: "Dashboard", journal: "Journal", analytics: "Analytics", settings: "Settings" }
  document.getElementById("pageTitle").textContent = titles[page]

  if (page === "analytics") updateChart()
}

function renderMoodButtons() {
  const containers = ["quickMoods", "journalMoods", "editMoods"]
  containers.forEach((id) => {
    const container = document.getElementById(id)
    if (container) {
      container.innerHTML = moods
        .map(
          (mood) => `<button type="button" class="mood-btn" onclick="selectMood('${mood}', '${id}')">${mood}</button>`,
        )
        .join("")
    }
  })
}

function selectMood(mood, container) {
  document.querySelectorAll(`#${container} .mood-btn`).forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`#${container} [onclick="selectMood('${mood}', '${container}')"]`).classList.add("active")
}

function quickSave() {
  const selectedMood = document.querySelector("#quickMoods .mood-btn.active")
  const text = document.getElementById("quickText").value.trim()

  if (!selectedMood) {
    showToast("Please select a mood")
    return
  }

  const entry = {
    id: Date.now(),
    mood: selectedMood.textContent,
    text: text || `Feeling ${selectedMood.textContent.toLowerCase()}`,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString(),
  }

  entries.unshift(entry)
  saveData()
  updateDashboard()
  renderAllEntries()

  document.getElementById("quickText").value = ""
  document.querySelectorAll("#quickMoods .mood-btn").forEach((btn) => btn.classList.remove("active"))

  showToast("Entry saved!")
}

function saveEntry() {
  const selectedMood = document.querySelector("#journalMoods .mood-btn.active")
  const text = document.getElementById("journalText").value.trim()

  if (!selectedMood || !text) {
    showToast("Please select a mood and write something")
    return
  }

  const entry = {
    id: Date.now(),
    mood: selectedMood.textContent,
    text,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString(),
  }

  entries.unshift(entry)
  saveData()
  updateDashboard()
  renderAllEntries()

  document.getElementById("journalText").value = ""
  document.querySelectorAll("#journalMoods .mood-btn").forEach((btn) => btn.classList.remove("active"))

  showToast("Entry saved!")
}

function useTemplate() {
  const template = templates[Math.floor(Math.random() * templates.length)]
  document.getElementById("journalText").value = template
}

function updateDashboard() {
  document.getElementById("totalEntries").textContent = entries.length

  const streak = calculateStreak()
  document.getElementById("currentStreak").textContent = streak

  const topMood = getTopMood()
  document.getElementById("topMood").textContent = topMood || "-"

  const recentEntries = entries.slice(0, 6)
  document.getElementById("recentEntries").innerHTML = recentEntries
    .map(
      (entry) =>
        `<div class="entry-card">
      <div class="entry-header">
        <span class="entry-mood">${entry.mood}</span>
        <span class="entry-date">${new Date(entry.timestamp).toLocaleDateString()}</span>
      </div>
      <div class="entry-actions">
        <button class="action-btn" onclick="editEntry(${entry.id})" style="background: var(--primary);">✏️</button>
        <button class="action-btn" onclick="deleteEntry(${entry.id})" style="background: #ef4444;">🗑️</button>
      </div>
      <div>${entry.text}</div>
    </div>`,
    )
    .join("")
}

function renderAllEntries() {
  const container = document.getElementById("allEntries")
  if (!container) return

  container.innerHTML = entries
    .map(
      (entry) =>
        `<div class="entry-card">
      <div class="entry-header">
        <span class="entry-mood">${entry.mood}</span>
        <span class="entry-date">${new Date(entry.timestamp).toLocaleDateString()}</span>
      </div>
      <div class="entry-actions">
        <button class="action-btn" onclick="editEntry(${entry.id})" style="background: var(--primary);">✏️</button>
        <button class="action-btn" onclick="deleteEntry(${entry.id})" style="background: #ef4444;">🗑️</button>
      </div>
      <div>${entry.text}</div>
    </div>`,
    )
    .join("")
}

function searchEntries() {
  const query = document.getElementById("searchInput").value.toLowerCase()
  const filtered = entries.filter(
    (entry) => entry.text.toLowerCase().includes(query) || entry.mood.toLowerCase().includes(query),
  )

  document.getElementById("allEntries").innerHTML = filtered
    .map(
      (entry) =>
        `<div class="entry-card">
      <div class="entry-header">
        <span class="entry-mood">${entry.mood}</span>
        <span class="entry-date">${new Date(entry.timestamp).toLocaleDateString()}</span>
      </div>
      <div class="entry-actions">
        <button class="action-btn" onclick="editEntry(${entry.id})" style="background: var(--primary);">✏️</button>
        <button class="action-btn" onclick="deleteEntry(${entry.id})" style="background: #ef4444;">🗑️</button>
      </div>
      <div>${entry.text}</div>
    </div>`,
    )
    .join("")
}

function editEntry(id) {
  editingEntry = entries.find((e) => e.id === id)
  if (!editingEntry) return

  document.getElementById("editText").value = editingEntry.text
  renderMoodButtons()

  setTimeout(() => {
    const moodBtn = document.querySelector(`#editMoods [onclick="selectMood('${editingEntry.mood}', 'editMoods')"]`)
    if (moodBtn) moodBtn.classList.add("active")
  }, 100)

  document.getElementById("editModal").classList.add("active")
}

function updateEntry() {
  const selectedMood = document.querySelector("#editMoods .mood-btn.active")
  const text = document.getElementById("editText").value.trim()

  if (!selectedMood || !text) {
    showToast("Please select a mood and write something")
    return
  }

  editingEntry.mood = selectedMood.textContent
  editingEntry.text = text

  saveData()
  updateDashboard()
  renderAllEntries()
  closeModal()
  showToast("Entry updated!")
}

function deleteEntry(id) {
  if (confirm("Delete this entry?")) {
    entries = entries.filter((e) => e.id !== id)
    saveData()
    updateDashboard()
    renderAllEntries()
    showToast("Entry deleted")
  }
}

function closeModal() {
  document.getElementById("editModal").classList.remove("active")
  editingEntry = null
}

function calculateStreak() {
  if (entries.length === 0) return 0

  const dates = [...new Set(entries.map((e) => new Date(e.timestamp).toDateString()))].sort(
    (a, b) => new Date(b) - new Date(a),
  )

  let streak = 0
  const currentDate = new Date()

  for (const date of dates) {
    if (date === currentDate.toDateString()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

function getTopMood() {
  if (entries.length === 0) return null

  const moodCounts = {}
  entries.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
  })

  return Object.keys(moodCounts).reduce((a, b) => (moodCounts[a] > moodCounts[b] ? a : b))
}

function updateChart() {
  const chartType = document.getElementById("chartType").value
  const timeRange = Number.parseInt(document.getElementById("timeRange").value)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - timeRange)

  const filteredEntries = entries.filter((entry) => new Date(entry.timestamp) >= cutoff)
  const moodCounts = {}

  filteredEntries.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
  })

  const labels = Object.keys(moodCounts)
  const data = Object.values(moodCounts)

  if (chart) chart.destroy()

  const ctx = document.getElementById("moodChart").getContext("2d")
  chart = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [
        {
          label: "Mood Count",
          data,
          backgroundColor: labels.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: chartType === "pie" },
      },
    },
  })

  generateInsights(filteredEntries, moodCounts)
}

function generateInsights(filteredEntries, moodCounts) {
  const insights = []

  if (filteredEntries.length > 0) {
    const topMood = Object.keys(moodCounts).reduce((a, b) => (moodCounts[a] > moodCounts[b] ? a : b))
    insights.push(`Your most frequent mood is ${topMood} (${moodCounts[topMood]} times)`)

    const avgPerDay = (filteredEntries.length / Number.parseInt(document.getElementById("timeRange").value)).toFixed(1)
    insights.push(`You average ${avgPerDay} entries per day`)

    const uniqueMoods = Object.keys(moodCounts).length
    insights.push(`You've experienced ${uniqueMoods} different moods`)
  } else {
    insights.push("No entries in selected time range")
  }

  document.getElementById("insights").innerHTML = insights.map((insight) => `<p>• ${insight}</p>`).join("")
}

function addMood() {
  const newMood = document.getElementById("newMood").value.trim()
  if (!newMood) return

  if (moods.includes(newMood)) {
    showToast("Mood already exists")
    return
  }

  moods.push(newMood)
  saveData()
  renderMoodButtons()
  renderMoodList()
  document.getElementById("newMood").value = ""
  showToast("Mood added!")
}

function removeMood(mood) {
  if (confirm(`Remove mood "${mood}"? This will also remove all entries with this mood.`)) {
    moods = moods.filter((m) => m !== mood)
    entries = entries.filter((e) => e.mood !== mood)
    saveData()
    renderMoodButtons()
    renderMoodList()
    updateDashboard()
    renderAllEntries()
    showToast("Mood removed")
  }
}

function renderMoodList() {
  const container = document.getElementById("moodList")
  if (!container) return

  container.innerHTML = moods
    .map(
      (mood) =>
        `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg); border-radius: var(--radius); margin-bottom: 0.5rem;">
      <span>${mood}</span>
      <button onclick="removeMood('${mood}')" class="danger" style="width: auto; padding: 0.25rem 0.5rem;">Remove</button>
    </div>`,
    )
    .join("")
}

function saveSettings() {
  settings.displayName = document.getElementById("displayName").value.trim() || "EmotionTracker"
  saveData()
  document.getElementById("userName").textContent = settings.displayName
  showToast("Settings saved!")
}

function toggleTheme() {
  settings.theme = settings.theme === "light" ? "dark" : "light"
  document.body.className = settings.theme
  saveData()
}

function exportData() {
  const data = { entries, moods, settings }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `emotion-tracker-${new Date().toISOString().split("T")[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast("Data exported!")
}

function importData() {
  document.getElementById("importFile").click()
}

function handleImport() {
  const file = document.getElementById("importFile").files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (data.entries) entries = data.entries
      if (data.moods) moods = data.moods
      if (data.settings) settings = { ...settings, ...data.settings }

      saveData()
      loadData()
      showToast("Data imported successfully!")
    } catch (error) {
      showToast("Invalid file format")
    }
  }
  reader.readAsText(file)
}

function clearAllData() {
  if (confirm("This will delete ALL your data. Are you sure?")) {
    entries = []
    moods = ["Happy", "Sad", "Anxious", "Excited", "Calm", "Angry", "Grateful", "Stressed"]
    settings = { displayName: "EmotionTracker", theme: "light" }
    saveData()
    loadData()
    showToast("All data cleared")
  }
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeModal()
  }
})

loadData()
