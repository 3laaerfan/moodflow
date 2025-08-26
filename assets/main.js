class MoodTracker {
  constructor() {
    this.currentMood = null;
    this.currentPeriod = "week";
    this.moods = this.loadMoods();

    this.init();
    this.updateDisplay();
  }

  init() {
    // Initialize date display
    this.updateDateDisplay();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize theme
    this.initTheme();

    // Check if today's mood is already saved
    this.checkTodaysMood();
  }

  setupEventListeners() {
    // Mood selection buttons
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectMood(e.currentTarget.dataset.mood);
      });
    });

    // Save button
    document.getElementById("saveMood").addEventListener("click", () => {
      this.saveMood();
    });

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => {
      this.toggleTheme();
    });

    // View period buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.changePeriod(e.currentTarget.dataset.period);
      });
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem("moodTracker_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeButton();
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("moodTracker_theme", newTheme);
    this.updateThemeButton();
  }

  updateThemeButton() {
    const theme = document.documentElement.getAttribute("data-theme");
    const btn = document.getElementById("themeToggle");
    btn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }

  updateDateDisplay() {
    const today = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    document.getElementById("currentDate").textContent =
      today.toLocaleDateString("en-US", options);
  }

  selectMood(mood) {
    this.currentMood = mood;

    // Update UI
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });
    document.querySelector(`[data-mood="${mood}"]`).classList.add("selected");

    document.getElementById("saveMood").disabled = false;
  }

  saveMood() {
    if (!this.currentMood) return;

    const today = this.getTodayString();
    this.moods[today] = this.currentMood;

    localStorage.setItem("moodTracker_moods", JSON.stringify(this.moods));

    // Update display
    this.updateDisplay();

    // Reset selection
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });
    document.getElementById("saveMood").disabled = true;
    document.getElementById("saveMood").textContent = "✅ Saved!";

    setTimeout(() => {
      document.getElementById("saveMood").textContent = "Save Today's Mood";
    }, 2000);
  }

  checkTodaysMood() {
    const today = this.getTodayString();
    if (this.moods[today]) {
      document.getElementById("saveMood").textContent =
        "✅ Already logged today";
      document.getElementById("saveMood").disabled = true;
    }
  }

  changePeriod(period) {
    this.currentPeriod = period;

    // Update active button
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-period="${period}"]`).classList.add("active");

    this.updateDisplay();
  }

  getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  loadMoods() {
    const stored = localStorage.getItem("moodTracker_moods");
    return stored ? JSON.parse(stored) : {};
  }

  getFilteredMoods() {
    const now = new Date();
    const moods = {};

    Object.entries(this.moods).forEach(([date, mood]) => {
      const moodDate = new Date(date);
      let includeEntry = false;

      switch (this.currentPeriod) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          includeEntry = moodDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          includeEntry = moodDate >= monthAgo;
          break;
        case "all":
          includeEntry = true;
          break;
      }

      if (includeEntry) {
        moods[date] = mood;
      }
    });

    return moods;
  }

  updateDisplay() {
    this.updateChart();
    this.updateHistory();
    this.updateStats();
    this.updateStreak();
  }

  updateChart() {
    const moods = this.getFilteredMoods();
    const chartContainer = document.getElementById("moodChart");
    const chartTitle = document.getElementById("chartTitle");

    // Update title
    const titles = {
      week: "This Week's Mood Distribution",
      month: "This Month's Mood Distribution",
      all: "All Time Mood Distribution",
    };
    chartTitle.textContent = titles[this.currentPeriod];

    if (Object.keys(moods).length === 0) {
      chartContainer.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📊</div>
                            <p>No mood data available for this period</p>
                        </div>
                    `;
      return;
    }

    // Count moods
    const counts = { happy: 0, neutral: 0, sad: 0 };
    Object.values(moods).forEach((mood) => {
      counts[mood]++;
    });

    const maxCount = Math.max(...Object.values(counts));
    const moodEmojis = { happy: "😊", neutral: "😐", sad: "😢" };

    chartContainer.innerHTML = "";

    Object.entries(counts).forEach(([mood, count]) => {
      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

      const bar = document.createElement("div");
      bar.className = "bar";
      bar.innerHTML = `
                        <div class="bar-fill ${mood}" style="height: ${percentage}%"></div>
                        <div class="bar-label">${moodEmojis[mood]}</div>
                        <div class="bar-count">${count}</div>
                    `;

      chartContainer.appendChild(bar);
    });
  }

  updateHistory() {
    const moods = this.getFilteredMoods();
    const historyContainer = document.getElementById("moodHistory");

    if (Object.keys(moods).length === 0) {
      historyContainer.innerHTML =
        '<div class="empty-state"><p>No mood entries yet</p></div>';
      return;
    }

    const moodEmojis = { happy: "😊", neutral: "😐", sad: "😢" };
    const sortedEntries = Object.entries(moods).sort(
      ([a], [b]) => new Date(b) - new Date(a)
    );

    historyContainer.innerHTML = sortedEntries
      .map(([date, mood]) => {
        const formatDate = new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return `
                            <div class="history-item">
                                <span class="history-date">${formatDate}</span>
                                <span class="history-mood">${moodEmojis[mood]}</span>
                            </div>
                        `;
      })
      .join("");
  }

  updateStats() {
    const allMoods = this.moods;
    const totalEntries = Object.keys(allMoods).length;

    if (totalEntries === 0) {
      document.getElementById("statsGrid").innerHTML = "";
      return;
    }

    const counts = { happy: 0, neutral: 0, sad: 0 };
    Object.values(allMoods).forEach((mood) => {
      counts[mood]++;
    });

    const mostCommon = Object.entries(counts).reduce(
      ([maxMood, maxCount], [mood, count]) =>
        count > maxCount ? [mood, count] : [maxMood, maxCount]
    );

    const moodEmojis = { happy: "😊", neutral: "😐", sad: "😢" };
    const avgMoodScore =
      (counts.happy * 3 + counts.neutral * 2 + counts.sad * 1) / totalEntries;

    document.getElementById("statsGrid").innerHTML = `
                    <div class="stat-card fade-in">
                        <div class="stat-value">${totalEntries}</div>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-card fade-in">
                        <div class="stat-value">${
                          moodEmojis[mostCommon[0]]
                        }</div>
                        <div class="stat-label">Most Common Mood</div>
                    </div>
                    <div class="stat-card fade-in">
                        <div class="stat-value">${avgMoodScore.toFixed(
                          1
                        )}/3</div>
                        <div class="stat-label">Mood Score</div>
                    </div>
                    <div class="stat-card fade-in">
                        <div class="stat-value">${Math.round(
                          (counts.happy / totalEntries) * 100
                        )}%</div>
                        <div class="stat-label">Happy Days</div>
                    </div>
                `;
  }

  updateStreak() {
    const dates = Object.keys(this.moods).sort();
    if (dates.length === 0) {
      document.getElementById("streakCount").textContent = "0";
      return;
    }

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];
      if (this.moods[dateString]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dateString === this.getTodayString()) {
        // Skip today if not logged yet
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    document.getElementById("streakCount").textContent = streak;

    if (streak > 0) {
      document.getElementById("streakCount").classList.add("pulse");
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new MoodTracker();
});
