// Constants
const PRICES = {
  coding: 8,
  games: 6,
  social: 4,
  youtube: 3,
};

const ACTIVITY_NAMES = {
  coding: "Coding Time",
  games: "Gaming Time",
  social: "Social Media",
  youtube: "YouTube Time",
};

const TIME_OPTIONS = [15, 25, 30, 45, 60];
const DEFAULT_BONUS_TASKS = [
  "Complete all homework",
  "Read for 30 minutes",
  "Create study notes",
  "Review past lectures",
];
const STUDY_GOAL = 120; // 2 hours in minutes
const ACTIVITY_TIME = 30 * 60; // 30 minutes in seconds
const COINS_PER_STUDY_MINUTES = 15; // 1 coin per 15 minutes
const BONUS_TASK_COINS = 5;
const TWO_HOUR_BONUS = 2;
const REFUND_TIME_LIMIT = 3 * 60 * 1000; // 3 minutes in milliseconds

// DOM Elements
const elements = {
  // Headers and containers
  coinBalance: document.getElementById("coinBalance"),
  editCoinsBtn: document.getElementById("editCoinsBtn"),

  // Tab navigation
  tabButtons: document.querySelectorAll(".tab-button"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Study timer tab
  timerDisplay: document.getElementById("timerDisplay"),
  timerProgress: document.getElementById("timerProgress"),
  durationButtons: document.querySelectorAll(".duration-btn"),
  startTimerBtn: document.getElementById("startTimerBtn"),
  pauseTimerBtn: document.getElementById("pauseTimerBtn"),
  resetTimerBtn: document.getElementById("resetTimerBtn"),
  studyProgressBar: document.getElementById("studyProgressBar"),
  studyTimeToday: document.getElementById("studyTimeToday"),
  studyGoalMessage: document.getElementById("studyGoalMessage"),
  bonusTasksList: document.getElementById("bonusTasksList"),
  newTaskInput: document.getElementById("newTaskInput"),
  addTaskBtn: document.getElementById("addTaskBtn"),

  // Reward shop tab
  shopItems: document.getElementById("shopItems"),
  noActivitiesMessage: document.getElementById("noActivitiesMessage"),
  activeTimersList: document.getElementById("activeTimersList"),
  noHistoryMessage: document.getElementById("noHistoryMessage"),
  historyList: document.getElementById("historyList"),

  // Modals
  purchaseModal: document.getElementById("purchaseModal"),
  purchaseMessage: document.getElementById("purchaseMessage"),
  purchaseCost: document.getElementById("purchaseCost"),
  confirmPurchaseBtn: document.getElementById("confirmPurchaseBtn"),
  editCoinsModal: document.getElementById("editCoinsModal"),
  newCoinsInput: document.getElementById("newCoinsInput"),
  saveCoinsBtn: document.getElementById("saveCoinsBtn"),
  closeModalButtons: document.querySelectorAll(".close-modal, .cancel-btn"),

  // Notification
  notification: document.getElementById("notification"),
  notificationContent: document.getElementById("notificationContent"),
};

// Application State
let appState = {
  user: {
    coins: 0,
    studyTimeToday: 0,
  },
  studyTimer: {
    selectedDuration: 25,
    remainingTime: 0,
    isActive: false,
    isPaused: false,
  },
  bonusTasks: DEFAULT_BONUS_TASKS.map((description, index) => ({
    id: `default-${index}`,
    description,
    completed: false,
  })),
  activities: [],
  history: [],
};

// Intervals
let timerInterval;
let activityTimerInterval;

// Initialize the app
function init() {
  // Load saved state
  loadState();

  // Setup event listeners
  setupEventListeners();

  // Initialize UI
  updateUI();

  // Start activity timer interval
  startActivityTimerInterval();
}

function setupEventListeners() {
  // Tab navigation
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");

      // Remove active class from all tabs
      elements.tabButtons.forEach((btn) => btn.classList.remove("active"));
      elements.tabContents.forEach((content) =>
        content.classList.remove("active")
      );

      // Add active class to selected tab
      button.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });

  // Duration selection
  elements.durationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const duration = parseInt(button.getAttribute("data-duration"));
      selectDuration(duration);
    });
  });

  // Timer controls
  elements.startTimerBtn.addEventListener("click", startTimer);
  elements.pauseTimerBtn.addEventListener("click", pauseTimer);
  elements.resetTimerBtn.addEventListener("click", resetTimer);

  // Bonus tasks
  elements.addTaskBtn.addEventListener("click", addCustomTask);

  // Edit coins
  elements.editCoinsBtn.addEventListener("click", () => {
    elements.newCoinsInput.value = appState.user.coins;
    elements.editCoinsModal.classList.add("show");
  });

  // Modals
  elements.closeModalButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.target.closest(".modal").classList.remove("show");
    });
  });

  // Save coins
  elements.saveCoinsBtn.addEventListener("click", () => {
    const newCoins = parseInt(elements.newCoinsInput.value);
    if (!isNaN(newCoins) && newCoins >= 0) {
      updateCoins(newCoins);
      elements.editCoinsModal.classList.remove("show");
      showNotification("Coin balance updated!", "success");
    } else {
      showNotification("Please enter a valid coin amount.", "error");
    }
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("show");
    }
  });

  // Setup shop items
  setupShopItems();
}

function setupShopItems() {
  elements.shopItems.innerHTML = "";

  Object.entries(PRICES).forEach(([activity, cost]) => {
    const itemEl = document.createElement("div");
    itemEl.className = "shop-item";
    itemEl.setAttribute("data-activity", activity);

    const infoDiv = document.createElement("div");
    infoDiv.className = "shop-item-info";

    const title = document.createElement("h3");
    title.textContent = ACTIVITY_NAMES[activity];

    const description = document.createElement("p");
    if (activity === "coding") {
      description.textContent = "Fun projects & learning";
    } else if (activity === "games") {
      description.textContent = "Gaming time";
    } else if (activity === "social") {
      description.textContent = "Browsing time";
    } else if (activity === "youtube") {
      description.textContent = "Video watching";
    }

    infoDiv.appendChild(title);
    infoDiv.appendChild(description);

    const priceDiv = document.createElement("div");
    priceDiv.className = "shop-item-price";

    const priceSpan = document.createElement("span");
    priceSpan.textContent = cost;

    const coinIcon = document.createElement("i");
    coinIcon.className = "fas fa-coins ml-1";

    const perTime = document.createElement("small");
    perTime.textContent = "per 30 min";

    priceDiv.appendChild(priceSpan);
    priceDiv.appendChild(coinIcon);
    priceDiv.appendChild(document.createElement("br"));
    priceDiv.appendChild(perTime);

    const buyBtn = document.createElement("button");
    buyBtn.className = "buy-btn";
    buyBtn.textContent = "Buy";
    buyBtn.disabled = appState.user.coins < cost;

    buyBtn.addEventListener("click", () => {
      openPurchaseModal(activity, ACTIVITY_NAMES[activity], cost);
    });

    itemEl.appendChild(infoDiv);
    itemEl.appendChild(priceDiv);
    itemEl.appendChild(buyBtn);

    elements.shopItems.appendChild(itemEl);
  });
}

function saveState() {
  localStorage.setItem("studyRewardsState", JSON.stringify(appState));
}

function loadState() {
  const savedState = localStorage.getItem("studyRewardsState");
  if (savedState) {
    appState = JSON.parse(savedState);
  }
}

function updateUI() {
  // Update coin balance
  elements.coinBalance.textContent = appState.user.coins;

  // Update timer display
  updateTimerDisplay();

  // Update timer controls
  updateTimerControls();

  // Update study progress
  updateStudyProgress();

  // Render bonus tasks
  renderBonusTasks();

  // Render activities
  renderActivities();

  // Render history
  renderHistory();

  // Update shop items (enable/disable buttons)
  const shopItemButtons = document.querySelectorAll(".shop-item .buy-btn");
  shopItemButtons.forEach((button) => {
    const activity = button.closest(".shop-item").getAttribute("data-activity");
    const cost = PRICES[activity];
    button.disabled = appState.user.coins < cost;
  });
}

function updateCoins(coins) {
  appState.user.coins = coins;
  updateUI();
  saveState();
}

function addStudyTime(minutes) {
  // Update study time
  appState.user.studyTimeToday += minutes;

  // Calculate coins earned (1 coin per 15 minutes)
  const coinsEarned = Math.floor(minutes / COINS_PER_STUDY_MINUTES);

  // Add coins
  appState.user.coins += coinsEarned;

  // Add to history
  addHistoryItem({
    type: "study",
    description: `Studied for ${minutes} minutes`,
    coins: coinsEarned,
    timestamp: Date.now(),
  });

  // Check for 2+ hour bonus
  if (appState.user.studyTimeToday >= STUDY_GOAL && !hasTwoHourBonus()) {
    appState.user.coins += TWO_HOUR_BONUS;
    addHistoryItem({
      type: "bonus",
      description: "2+ hour study streak",
      coins: TWO_HOUR_BONUS,
      timestamp: Date.now(),
    });
    showNotification(
      `Bonus: +${TWO_HOUR_BONUS} coins for reaching a 2+ hour study streak!`,
      "success"
    );
  }

  // Update UI
  updateUI();

  // Show notification
  showNotification(`Study session completed! +${coinsEarned} coins`, "success");
}

function selectDuration(minutes) {
  appState.studyTimer.selectedDuration = minutes;
  appState.studyTimer.remainingTime = minutes * 60;

  // Update active button
  elements.durationButtons.forEach((button) => {
    const duration = parseInt(button.getAttribute("data-duration"));
    if (duration === minutes) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  updateTimerDisplay();
  saveState();
}

function startTimer() {
  // Check if timer is already active
  if (appState.studyTimer.isActive) return;

  // Set timer as active
  appState.studyTimer.isActive = true;
  appState.studyTimer.isPaused = false;

  // If remaining time is 0, set it to the selected duration
  if (appState.studyTimer.remainingTime <= 0) {
    appState.studyTimer.remainingTime =
      appState.studyTimer.selectedDuration * 60;
  }

  // Update UI
  updateTimerControls();
  updateTimerDisplay();

  // Save state
  saveState();

  // Start interval
  timerInterval = setInterval(() => {
    // Decrease time
    appState.studyTimer.remainingTime--;

    // Update display
    updateTimerDisplay();

    // Check if timer is finished
    if (appState.studyTimer.remainingTime <= 0) {
      // Add study time
      addStudyTime(appState.studyTimer.selectedDuration);

      // Reset timer
      clearInterval(timerInterval);
      appState.studyTimer.isActive = false;
      appState.studyTimer.isPaused = false;
      appState.studyTimer.remainingTime = 0;

      // Update UI
      updateTimerControls();

      // Save state
      saveState();
    }
  }, 1000);
}

function pauseTimer() {
  if (!appState.studyTimer.isActive || appState.studyTimer.isPaused) return;

  appState.studyTimer.isPaused = true;
  clearInterval(timerInterval);

  updateTimerControls();
  saveState();
}

function resetTimer() {
  clearInterval(timerInterval);

  appState.studyTimer.isActive = false;
  appState.studyTimer.isPaused = false;
  appState.studyTimer.remainingTime = 0;

  updateTimerDisplay();
  updateTimerControls();
  saveState();
}

function updateTimerDisplay() {
  elements.timerDisplay.textContent = formatTime(
    appState.studyTimer.remainingTime
  );

  // Update progress circle
  const circumference = 2 * Math.PI * 45; // r = 45
  const offset =
    circumference *
    (1 -
      calculateTimerProgress(
        appState.studyTimer.selectedDuration * 60,
        appState.studyTimer.remainingTime
      ));

  elements.timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
  elements.timerProgress.style.strokeDashoffset = offset;
}

function updateTimerControls() {
  if (appState.studyTimer.isActive) {
    elements.startTimerBtn.disabled = true;
    elements.resetTimerBtn.disabled = false;

    if (appState.studyTimer.isPaused) {
      elements.pauseTimerBtn.textContent = "Resume";
      elements.pauseTimerBtn.disabled = false;
    } else {
      elements.pauseTimerBtn.textContent = "Pause";
      elements.pauseTimerBtn.disabled = false;
    }
  } else {
    elements.startTimerBtn.disabled = false;
    elements.pauseTimerBtn.disabled = true;
    elements.resetTimerBtn.disabled = true;
    elements.pauseTimerBtn.textContent = "Pause";
  }
}

function updateStudyProgress() {
  const progressPercentage = calculateProgress(appState.user.studyTimeToday);
  elements.studyProgressBar.style.width = `${progressPercentage}%`;
  elements.studyTimeToday.textContent = appState.user.studyTimeToday;

  // Update goal message
  if (appState.user.studyTimeToday >= STUDY_GOAL) {
    elements.studyGoalMessage.textContent = "2+ hour goal reached!";
  } else {
    const remaining = STUDY_GOAL - appState.user.studyTimeToday;
    elements.studyGoalMessage.textContent = `${remaining} min until 2 hour bonus`;
  }
}

function renderBonusTasks() {
  elements.bonusTasksList.innerHTML = "";

  appState.bonusTasks.forEach((task) => {
    const taskEl = document.createElement("div");
    taskEl.className = "bonus-task";
    taskEl.setAttribute("data-id", task.id);

    const description = document.createElement("div");
    description.className = "task-description";
    description.textContent = task.description;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "task-buttons";

    const completeBtn = document.createElement("button");
    completeBtn.className = "task-complete-btn";

    if (task.completed) {
      completeBtn.textContent = "Completed";
      completeBtn.classList.add("completed");
    } else {
      completeBtn.textContent = "Complete";
      completeBtn.addEventListener("click", () => {
        completeBonusTask(task.id, task.description);
      });
    }

    const removeBtn = document.createElement("button");
    removeBtn.className = "task-remove-btn";
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener("click", () => removeBonusTask(task.id));

    buttonContainer.appendChild(removeBtn);
    buttonContainer.appendChild(completeBtn);
    taskEl.appendChild(description);
    taskEl.appendChild(buttonContainer);

    elements.bonusTasksList.appendChild(taskEl);
  });
}

function removeBonusTask(taskId) {
  appState.bonusTasks = appState.bonusTasks.filter(
    (task) => task.id !== taskId
  );
  renderBonusTasks();
  saveState();
  showNotification("Task removed successfully!", "success");
}

function addCustomTask() {
  const description = elements.newTaskInput.value.trim();

  if (!description) {
    showNotification("Please enter a task description.", "error");
    return;
  }

  const taskId = `task-${Date.now()}`;

  appState.bonusTasks.push({
    id: taskId,
    description,
    completed: false,
  });

  elements.newTaskInput.value = "";
  renderBonusTasks();
  saveState();

  showNotification("Task added successfully!", "success");
}

function completeBonusTask(id, description) {
  // Mark task as completed
  appState.bonusTasks = appState.bonusTasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: true };
    }
    return task;
  });

  // Add coins
  appState.user.coins += BONUS_TASK_COINS;

  // Add to history
  addHistoryItem({
    type: "bonus",
    description,
    coins: BONUS_TASK_COINS,
    timestamp: Date.now(),
  });

  // Update UI
  updateUI();

  // Show notification
  showNotification(`Task completed! +${BONUS_TASK_COINS} coins`, "success");
}

function openPurchaseModal(activity, activityName, cost) {
  elements.purchaseMessage.textContent = `Purchase ${activityName} (30 minutes)`;
  elements.purchaseCost.textContent = cost;

  // Set confirm button action
  elements.confirmPurchaseBtn.onclick = () => {
    purchaseActivity(activity, cost);
    elements.purchaseModal.classList.remove("show");
  };

  // Show modal
  elements.purchaseModal.classList.add("show");
}

function purchaseActivity(activity, cost) {
  if (appState.user.coins < cost) {
    showNotification("Not enough coins!", "error");
    return;
  }

  const existingActivity = appState.activities.find((a) => a.type === activity);

  if (existingActivity) {
    appState.activities = appState.activities.map((a) => {
      if (a.type === activity) {
        const additionalTime = ACTIVITY_TIME;

        if (a.isPaused) {
          return {
            ...a,
            endTime: Date.now() + (a.timeLeft + additionalTime) * 1000,
            timeLeft: a.timeLeft + additionalTime,
            isPaused: false,
            purchaseTime: Date.now(), // Add purchase timestamp
          };
        } else {
          return {
            ...a,
            endTime: Date.now() + (a.timeLeft + additionalTime) * 1000,
            timeLeft: a.timeLeft + additionalTime,
            purchaseTime: Date.now(), // Add purchase timestamp
          };
        }
      }
      return a;
    });
  } else {
    appState.activities.push({
      type: activity,
      endTime: Date.now() + ACTIVITY_TIME * 1000,
      timeLeft: ACTIVITY_TIME,
      isPaused: false,
      purchaseTime: Date.now(), // Add purchase timestamp
      cost: cost, // Store the original cost
    });
  }

  appState.user.coins -= cost;
  addHistoryItem({
    type: "purchase",
    description: `Purchased ${activity}`,
    coins: -cost,
    timestamp: Date.now(),
  });

  updateUI();
  showNotification(
    `Purchased ${ACTIVITY_NAMES[activity]} successfully!`,
    "success"
  );
}

function startActivityTimerInterval() {
  // Clear any existing interval
  if (activityTimerInterval) clearInterval(activityTimerInterval);

  // Start interval to update activity timers
  activityTimerInterval = setInterval(updateActivityTimers, 1000);
}

function updateActivityTimers() {
  if (appState.activities.length === 0) return;

  const now = Date.now();
  appState.activities = appState.activities
    .map((activity) => {
      // Only update time left if activity is not paused
      if (activity.isPaused) {
        return activity;
      }

      return {
        ...activity,
        timeLeft: Math.max(0, Math.floor((activity.endTime - now) / 1000)),
      };
    })
    .filter((activity) => activity.timeLeft > 0);

  renderActivities();
  saveState();
}

function toggleActivityPause(activityType) {
  // Find the activity
  const activityIndex = appState.activities.findIndex(
    (a) => a.type === activityType
  );
  if (activityIndex === -1) return;

  const activity = appState.activities[activityIndex];
  const wasPaused = activity.isPaused;

  // Toggle pause state
  appState.activities[activityIndex].isPaused = !wasPaused;

  // If unpausing, adjust the endTime to account for the time it was paused
  if (wasPaused) {
    appState.activities[activityIndex].endTime =
      Date.now() + activity.timeLeft * 1000;
  }

  // Update UI
  renderActivities();
  saveState();

  // Show notification
  if (wasPaused) {
    showNotification(
      `Resumed ${ACTIVITY_NAMES[activityType]} timer`,
      "success"
    );
  } else {
    showNotification(`Paused ${ACTIVITY_NAMES[activityType]} timer`, "success");
  }
}

function renderActivities() {
  if (appState.activities.length === 0) {
    elements.noActivitiesMessage.style.display = "block";
    elements.activeTimersList.innerHTML = "";
    return;
  }

  elements.noActivitiesMessage.style.display = "none";
  elements.activeTimersList.innerHTML = "";

  appState.activities.forEach((activity) => {
    const activityEl = document.createElement("div");
    activityEl.className = "activity-timer";
    activityEl.setAttribute("data-activity", activity.type);

    const timerHeader = document.createElement("div");
    timerHeader.className = "timer-header";

    const activityName = document.createElement("h3");
    activityName.className = "timer-name";
    activityName.textContent = ACTIVITY_NAMES[activity.type];

    const timerControls = document.createElement("div");
    timerControls.className = "timer-controls-small";

    const timerDisplay = document.createElement("span");
    timerDisplay.className = `timer-display-small ${
      activity.isPaused ? "text-yellow-600" : ""
    }`;
    timerDisplay.textContent = formatTime(activity.timeLeft);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "activity-buttons";

    // Pause/Resume button
    const pauseBtn = document.createElement("button");
    if (activity.isPaused) {
      pauseBtn.className = "resume-timer-btn";
      pauseBtn.innerHTML = '<i class="fas fa-play-circle"></i>';
      pauseBtn.title = "Resume timer";
    } else {
      pauseBtn.className = "pause-timer-btn";
      pauseBtn.innerHTML = '<i class="fas fa-pause-circle"></i>';
      pauseBtn.title = "Pause timer";
    }
    pauseBtn.addEventListener("click", () =>
      toggleActivityPause(activity.type)
    );

    // Refund button (only show if within time limit)
    const canBeRefunded =
      Date.now() - activity.purchaseTime <= REFUND_TIME_LIMIT;
    if (canBeRefunded) {
      const refundBtn = document.createElement("button");
      refundBtn.className = "activity-refund-btn";
      refundBtn.innerHTML = '<i class="fas fa-undo"></i>';
      refundBtn.title = "Refund activity";
      refundBtn.addEventListener("click", () => refundActivity(activity));
      buttonContainer.appendChild(refundBtn);
    }

    // Sell button
    const sellBtn = document.createElement("button");
    sellBtn.className = "activity-sell-btn";
    sellBtn.innerHTML = '<i class="fas fa-dollar-sign"></i>';
    sellBtn.title = "Sell activity (no refund)";
    sellBtn.addEventListener("click", () => sellActivity(activity));

    buttonContainer.appendChild(pauseBtn);
    buttonContainer.appendChild(sellBtn);

    timerControls.appendChild(timerDisplay);
    timerControls.appendChild(buttonContainer);

    timerHeader.appendChild(activityName);
    timerHeader.appendChild(timerControls);

    const progressContainer = document.createElement("div");
    progressContainer.className = "activity-progress-container";

    const progress = document.createElement("div");
    progress.className = `activity-progress ${
      activity.isPaused ? "paused" : ""
    }`;
    progress.style.width = `${calculateActivityProgress(activity.timeLeft)}%`;

    progressContainer.appendChild(progress);

    activityEl.appendChild(timerHeader);
    activityEl.appendChild(progressContainer);

    if (activity.isPaused) {
      const pausedMessage = document.createElement("div");
      pausedMessage.className = "activity-paused-message";
      pausedMessage.textContent = "Timer paused";
      activityEl.appendChild(pausedMessage);
    }

    elements.activeTimersList.appendChild(activityEl);
  });
}

function renderHistory() {
  if (appState.history.length === 0) {
    elements.noHistoryMessage.style.display = "block";
    elements.historyList.innerHTML = "";
    return;
  }

  elements.noHistoryMessage.style.display = "none";
  elements.historyList.innerHTML = "";

  // Show only the most recent 5 items
  const recentHistory = appState.history.slice(0, 5);

  recentHistory.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    const timestamp = document.createElement("span");
    timestamp.className = "history-timestamp";
    timestamp.textContent = formatTimestamp(item.timestamp);

    const description = document.createElement("span");

    switch (item.type) {
      case "study":
        description.textContent = `Studied for ${
          item.description.split(" ")[2]
        } minutes (+${item.coins} coins)`;
        break;
      case "bonus":
        description.textContent = `${item.description} (+${item.coins} coins)`;
        break;
      case "purchase":
        description.textContent = `Purchased ${
          item.description.split(" ")[1]
        } (${item.coins} coins)`;
        break;
    }

    historyItem.appendChild(timestamp);
    historyItem.appendChild(description);

    elements.historyList.appendChild(historyItem);
  });
}

function addHistoryItem(item) {
  appState.history.unshift(item);
  renderHistory();
}

function showNotification(message, type = "success") {
  elements.notificationContent.textContent = message;
  elements.notificationContent.className = `notification-content ${
    type === "success" ? "notification-success" : "notification-error"
  }`;

  elements.notification.classList.add("show");

  // Hide after 3 seconds
  setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3000);
}

// Utility Functions
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function calculateProgress(minutes, goal = STUDY_GOAL) {
  return Math.min(100, Math.round((minutes / goal) * 100));
}

function hasTwoHourBonus() {
  return appState.history.some(
    (item) =>
      item.type === "bonus" &&
      item.description === "2+ hour study streak" &&
      isToday(item.timestamp)
  );
}

function isToday(timestamp) {
  const today = new Date();
  const date = new Date(timestamp);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function calculateTimerProgress(total, remaining) {
  if (total === 0) return 0;
  return remaining / total;
}

function calculateActivityProgress(timeLeft, totalTime = ACTIVITY_TIME) {
  return Math.min(100, Math.round((timeLeft / totalTime) * 100));
}

function refundActivity(activity) {
  if (Date.now() - activity.purchaseTime > REFUND_TIME_LIMIT) {
    showNotification("Refund time limit exceeded!", "error");
    return;
  }

  appState.user.coins += activity.cost;
  appState.activities = appState.activities.filter((a) => a !== activity);

  addHistoryItem({
    type: "refund",
    description: `Refunded ${ACTIVITY_NAMES[activity.type]}`,
    coins: activity.cost,
    timestamp: Date.now(),
  });

  updateUI();
  showNotification(
    `Refunded ${ACTIVITY_NAMES[activity.type]} successfully! +${
      activity.cost
    } coins`,
    "success"
  );
}

function sellActivity(activity) {
  appState.activities = appState.activities.filter((a) => a !== activity);

  addHistoryItem({
    type: "sell",
    description: `Sold ${ACTIVITY_NAMES[activity.type]}`,
    coins: 0,
    timestamp: Date.now(),
  });

  updateUI();
  showNotification(
    `Sold ${ACTIVITY_NAMES[activity.type]} successfully!`,
    "success"
  );
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", init);
