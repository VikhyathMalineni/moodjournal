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

function toast(msg) {
  const t = document.getElementById("toast")
  t.textContent = msg
  t.classList.add("show")
  setTimeout(() => t.classList.remove("show"), 3000)
}

function save() {
  localStorage.setItem("et_entries", JSON.stringify(entries))
  localStorage.setItem("et_moods", JSON.stringify(moods))
  localStorage.setItem("et_settings", JSON.stringify(settings))
}

function load() {
  entries = JSON.parse(localStorage.getItem("et_entries") || "[]")
  moods = JSON.parse(
    localStorage.getItem("et_moods") ||
      JSON.stringify(["Happy", "Sad", "Anxious", "Excited", "Calm", "Angry", "Grateful", "Stressed"]),
  )
  settings = JSON.parse(localStorage.getItem("et_settings") || '{"displayName":"EmotionTracker","theme":"light"}')

  document.getElementById("displayName").value = settings.displayName
  document.getElementById("userName").textContent = settings.displayName
  document.body.className = settings.theme

  renderMoods()
  updateDash()
  renderEntries()
  renderMoodList()
}

function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"))
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"))

  document.getElementById(page + "Page").classList.add("active")
  document.querySelector(`[data-page="${page}"]`).classList.add("active")

  const titles = { dashboard: "Dashboard", journal: "Journal", analytics: "Analytics", settings: "Settings" }
  document.getElementById("pageTitle").textContent = titles[page]

  if (page === "analytics") updateChart()
}

function renderMoods() {
  ;["quickMoods", "journalMoods", "editMoods"].forEach((id) => {
    const container = document.getElementById(id)
    if (container) {
      container.innerHTML = moods
        .map((mood) => `<button type="button" class="mood-btn" data-mood="${mood}">${mood}</button>`)
        .join("")
    }
  })
}

function selectMood(btn) {
  btn.parentElement.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("active"))
  btn.classList.add("active")
}

function quickSave() {
  const selected = document.querySelector("#quickMoods .mood-btn.active")
  const text = document.getElementById("quickText").value.trim()

  if (!selected) return toast("Please select a mood")

  const entry = {
    id: Date.now(),
    mood: selected.dataset.mood,
    text: text || `Feeling ${selected.dataset.mood.toLowerCase()}`,
    timestamp: Date.now(),
    date: new Date().toDateString(),
  }

  entries.unshift(entry)
  save()
  updateDash()
  renderEntries()

  document.getElementById("quickText").value = ""
  document.querySelectorAll("#quickMoods .mood-btn").forEach((btn) => btn.classList.remove("active"))

  toast("Entry saved!")
}

function saveEntry() {
  const selected = document.querySelector("#journalMoods .mood-btn.active")
  const text = document.getElementById("journalText").value.trim()

  if (!selected || !text) return toast("Please select a mood and write something")

  const entry = {
    id: Date.now(),
    mood: selected.dataset.mood,
    text,
    timestamp: Date.now(),
    date: new Date().toDateString(),
  }

  entries.unshift(entry)
  save()
  updateDash()
  renderEntries()

  document.getElementById("journalText").value = ""
  document.querySelectorAll("#journalMoods .mood-btn").forEach((btn) => btn.classList.remove("active"))

  toast("Entry saved!")
}

function useTemplate() {
  const template = templates[Math.floor(Math.random() * templates.length)]
  document.getElementById("journalText").value = template
}

function updateDash() {
  document.getElementById("totalEntries").textContent = entries.length
  document.getElementById("currentStreak").textContent = calcStreak()
  document.getElementById("topMood").textContent = getTopMood() || "-"

  const recent = entries.slice(0, 6)
  document.getElementById("recentEntries").innerHTML = recent
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

function renderEntries() {
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
  renderMoods()

  setTimeout(() => {
    const moodBtn = document.querySelector(`#editMoods [data-mood="${editingEntry.mood}"]`)
    if (moodBtn) moodBtn.classList.add("active")
  }, 100)

  document.getElementById("editModal").classList.add("active")
}

function updateEntry() {
  const selected = document.querySelector("#editMoods .mood-btn.active")
  const text = document.getElementById("editText").value.trim()

  if (!selected || !text) return toast("Please select a mood and write something")

  editingEntry.mood = selected.dataset.mood
  editingEntry.text = text

  save()
  updateDash()
  renderEntries()
  closeModal()
  toast("Entry updated!")
}

function deleteEntry(id) {
  if (confirm("Delete this entry?")) {
    entries = entries.filter((e) => e.id !== id)
    save()
    updateDash()
    renderEntries()
    toast("Entry deleted")
  }
}

function closeModal() {
  document.getElementById("editModal").classList.remove("active")
  editingEntry = null
}

function calcStreak() {
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

  const counts = {}
  entries.forEach((entry) => {
    counts[entry.mood] = (counts[entry.mood] || 0) + 1
  })

  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
}

function updateChart() {
  const chartType = document.getElementById("chartType").value
  const timeRange = Number.parseInt(document.getElementById("timeRange").value)

  const cutoff = Date.now() - timeRange * 24 * 60 * 60 * 1000
  const filtered = entries.filter((entry) => entry.timestamp >= cutoff)
  const counts = {}

  filtered.forEach((entry) => {
    counts[entry.mood] = (counts[entry.mood] || 0) + 1
  })

  const labels = Object.keys(counts)
  const data = Object.values(counts)

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

  generateInsights(filtered, counts)
}

function generateInsights(filtered, counts) {
  const insights = []

  if (filtered.length > 0) {
    const topMood = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
    insights.push(`Most frequent mood: ${topMood} (${counts[topMood]} times)`)

    const avgPerDay = (filtered.length / Number.parseInt(document.getElementById("timeRange").value)).toFixed(1)
    insights.push(`Average entries per day: ${avgPerDay}`)

    const uniqueMoods = Object.keys(counts).length
    insights.push(`Different moods experienced: ${uniqueMoods}`)

    const moodTrend = predictMoodTrend()
    if (moodTrend) insights.push(`Predicted next mood: ${moodTrend}`)

    const bestDay = getBestDay()
    if (bestDay) insights.push(`Most active day: ${bestDay}`)
  } else {
    insights.push("No entries in selected time range")
  }

  document.getElementById("insights").innerHTML = insights.map((insight) => `<p>• ${insight}</p>`).join("")
}

function predictMoodTrend() {
  if (entries.length < 3) return null

  const recent = entries.slice(0, 5)
  const moodCounts = {}

  recent.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
  })

  return Object.keys(moodCounts).reduce((a, b) => (moodCounts[a] > moodCounts[b] ? a : b))
}

function getBestDay() {
  if (entries.length === 0) return null

  const dayCounts = {}
  entries.forEach((entry) => {
    const day = new Date(entry.timestamp).toLocaleDateString("en-US", { weekday: "long" })
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })

  return Object.keys(dayCounts).reduce((a, b) => (dayCounts[a] > dayCounts[b] ? a : b))
}

function addMood() {
  const newMood = document.getElementById("newMood").value.trim()
  if (!newMood) return

  if (moods.includes(newMood)) return toast("Mood already exists")

  moods.push(newMood)
  save()
  renderMoods()
  renderMoodList()
  document.getElementById("newMood").value = ""
  toast("Mood added!")
}

function removeMood(mood) {
  if (confirm(`Remove mood "${mood}"? This will also remove all entries with this mood.`)) {
    moods = moods.filter((m) => m !== mood)
    entries = entries.filter((e) => e.mood !== mood)
    save()
    renderMoods()
    renderMoodList()
    updateDash()
    renderEntries()
    toast("Mood removed")
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
  save()
  document.getElementById("userName").textContent = settings.displayName
  toast("Settings saved!")
}

function toggleTheme() {
  settings.theme = settings.theme === "light" ? "dark" : "light"
  document.body.className = settings.theme
  save()
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
  toast("Data exported!")
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

      save()
      load()
      toast("Data imported!")
    } catch (error) {
      toast("Invalid file format")
    }
  }
  reader.readAsText(file)
}

function clearAllData() {
  if (confirm("This will delete ALL your data. Are you sure?")) {
    entries = []
    moods = ["Happy", "Sad", "Anxious", "Excited", "Calm", "Angry", "Grateful", "Stressed"]
    settings = { displayName: "EmotionTracker", theme: "light" }
    save()
    load()
    toast("All data cleared")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  load()

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => showPage(item.dataset.page))
  })

  document.querySelector(".theme-toggle").addEventListener("click", toggleTheme)

  document.getElementById("quickSaveBtn").addEventListener("click", quickSave)
  document.getElementById("saveEntryBtn").addEventListener("click", saveEntry)
  document.getElementById("templateBtn").addEventListener("click", useTemplate)
  document.getElementById("searchInput").addEventListener("input", searchEntries)
  document.getElementById("chartType").addEventListener("change", updateChart)
  document.getElementById("timeRange").addEventListener("change", updateChart)
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings)
  document.getElementById("addMoodBtn").addEventListener("click", addMood)
  document.getElementById("exportBtn").addEventListener("click", exportData)
  document.getElementById("importBtn").addEventListener("click", importData)
  document.getElementById("clearBtn").addEventListener("click", clearAllData)
  document.getElementById("importFile").addEventListener("change", handleImport)
  document.getElementById("updateBtn").addEventListener("click", updateEntry)
  document.getElementById("cancelBtn").addEventListener("click", closeModal)

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("mood-btn")) {
      selectMood(e.target)
    }
    if (e.target.classList.contains("modal")) {
      closeModal()
    }
  })
})
