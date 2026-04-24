const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const MAX_LEVEL = 300;
const AUTH_STORAGE_KEY = "rankion_unlock_until";
const APP_PASSCODE = "2486";
const SERVER_STATE_ENDPOINT = "/api/state";
const SYNC_POLL_INTERVAL = 15000;
const CATEGORY_DEFINITIONS = [
    { key: "physique", label: "Physique", color: "#89d36b", tagClass: "task-tag-physique" },
    { key: "earnings", label: "Earnings", color: "#ffd263", tagClass: "task-tag-earnings" },
    { key: "intelligence", label: "Intelligence", color: "#7ec8ff", tagClass: "task-tag-intelligence" }
];
const STORAGE_KEYS = {
    tasks: "tasks",
    xp: "xp",
    level: "level",
    streak: "streak",
    history: "history",
    updatedAt: "updatedAt"
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LEVEL_RANKS = [
    { min: 1, max: 9, title: "Beginner" },
    { min: 10, max: 24, title: "Initiate" },
    { min: 25, max: 49, title: "Apprentice" },
    { min: 50, max: 74, title: "Adept" },
    { min: 75, max: 99, title: "Vanguard" },
    { min: 100, max: 124, title: "Guardian" },
    { min: 125, max: 149, title: "Champion" },
    { min: 150, max: 174, title: "Master" },
    { min: 175, max: 199, title: "Grandmaster" },
    { min: 200, max: 224, title: "Legend" },
    { min: 225, max: 249, title: "Mythic" },
    { min: 250, max: 274, title: "Sovereign" },
    { min: 275, max: 299, title: "Demigod" },
    { min: 300, max: 300, title: "God" }
];
const DAILY_MOTIVATION_LINES = [
    "Small progress done with consistency becomes a standard, not a lucky streak.",
    "A focused hour today is stronger than a perfect plan you never start.",
    "The task in front of you is enough. Finish it well and let momentum handle the rest.",
    "Discipline grows quietly. Show up today and let the result speak later.",
    "You do not need a dramatic reset. You need one clean win today.",
    "Every completed task is proof that your future self can trust you.",
    "Consistency is built on ordinary days, not only your most motivated ones.",
    "A short session done now beats a longer session postponed again.",
    "Progress compounds when you stop negotiating with the task and begin it.",
    "Keep the promise simple, then keep it fully.",
    "Your routine becomes powerful when it survives low-energy days.",
    "Finishing one meaningful task can change the tone of the whole day.",
    "Momentum starts the moment action becomes more important than mood.",
    "A steady pace will take you farther than occasional intensity.",
    "Each checked box is a quiet vote for the person you want to become.",
    "Make today clean, even if it is not perfect.",
    "Structure creates freedom when you actually use it.",
    "The habit gets easier to trust every time you complete it on schedule.",
    "One honest effort today keeps tomorrow lighter.",
    "Your future progress is hidden inside the next small completion."
];

const DateUtils = {
    pad(value) {
        return String(value).padStart(2, "0");
    },

    normalizeDate(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    },

    toKey(date = new Date()) {
        const localDate = this.normalizeDate(date);
        return `${localDate.getFullYear()}-${this.pad(localDate.getMonth() + 1)}-${this.pad(localDate.getDate())}`;
    },

    parseKey(dateKey) {
        const [year, month, day] = String(dateKey).split("-").map(Number);
        return new Date(year, month - 1, day);
    },

    addDays(date, amount) {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + amount);
        return nextDate;
    },

    diffInDays(leftDate, rightDate) {
        const left = this.normalizeDate(leftDate).getTime();
        const right = this.normalizeDate(rightDate).getTime();
        return Math.round((left - right) / MS_PER_DAY);
    },

    getDayName(date = new Date()) {
        const index = (date.getDay() + 6) % 7;
        return DAYS[index];
    },

    getShortDay(dayName) {
        return dayName.slice(0, 3);
    },

    formatLongDate(date = new Date()) {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).format(date);
    },

    formatMonthLabel(monthKey) {
        const [year, month] = monthKey.split("-").map(Number);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            year: "2-digit"
        }).format(new Date(year, month - 1, 1));
    },

    formatTime(date = new Date()) {
        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit"
        }).format(date);
    },

    getWeekStart(date = new Date()) {
        const localDate = this.normalizeDate(date);
        const index = (localDate.getDay() + 6) % 7;
        return this.addDays(localDate, -index);
    },

    getWeekStartKey(date = new Date()) {
        return this.toKey(this.getWeekStart(date));
    },

    formatWeekRange(startDate) {
        const safeStart = this.normalizeDate(startDate);
        const endDate = this.addDays(safeStart, 6);
        const formatter = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric"
        });

        return `${formatter.format(safeStart)} - ${formatter.format(endDate)}`;
    }
};

const Storage = {
    loadJSON(key, fallbackValue) {
        try {
            const rawValue = localStorage.getItem(key);
            return rawValue ? JSON.parse(rawValue) : fallbackValue;
        } catch (error) {
            return fallbackValue;
        }
    },

    loadNumber(key, fallbackValue) {
        const rawValue = Number(localStorage.getItem(key));
        return Number.isFinite(rawValue) ? rawValue : fallbackValue;
    },

    loadState() {
        const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(this.loadNumber(STORAGE_KEYS.level, 1))));

        return {
            tasks: sanitizeTasks(this.loadJSON(STORAGE_KEYS.tasks, [])),
            xp: level >= MAX_LEVEL ? 0 : Math.max(0, Math.floor(this.loadNumber(STORAGE_KEYS.xp, 0))),
            level,
            streak: Math.max(0, Math.floor(this.loadNumber(STORAGE_KEYS.streak, 0))),
            history: sanitizeHistory(this.loadJSON(STORAGE_KEYS.history, [])),
            updatedAt: sanitizeTimestamp(this.loadNumber(STORAGE_KEYS.updatedAt, 0))
        };
    },

    saveState(currentState) {
        localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(currentState.tasks));
        localStorage.setItem(STORAGE_KEYS.xp, String(currentState.xp));
        localStorage.setItem(STORAGE_KEYS.level, String(currentState.level));
        localStorage.setItem(STORAGE_KEYS.streak, String(currentState.streak));
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(currentState.history));
        localStorage.setItem(STORAGE_KEYS.updatedAt, String(sanitizeTimestamp(currentState.updatedAt)));
    },

    reset() {
        Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    }
};

const SyncService = {
    pollTimer: 0,
    pushTimer: 0,
    isPulling: false,
    isPushing: false,
    started: false,

    start() {
        if (this.started) {
            return;
        }

        this.started = true;
        this.setStatus("idle", "Sync: local");
        this.pullLatestState({ allowAdoptLocal: true });
        this.startPolling();
        window.addEventListener("focus", () => {
            this.pullLatestState();
        });
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                this.pullLatestState();
            }
        });
    },

    startPolling() {
        window.clearInterval(this.pollTimer);
        this.pollTimer = window.setInterval(() => {
            if (!document.hidden) {
                this.pullLatestState();
            }
        }, SYNC_POLL_INTERVAL);
    },

    setStatus(mode, label) {
        if (!elements.syncStatus) {
            return;
        }

        elements.syncStatus.className = `sync-chip ${mode ? `is-${mode}` : ""}`.trim();
        elements.syncStatus.textContent = label;
    },

    schedulePush(reason = "update") {
        window.clearTimeout(this.pushTimer);
        this.setStatus("syncing", "Sync: updating");
        this.pushTimer = window.setTimeout(() => {
            this.pushLatestState(reason);
        }, 300);
    },

    async pullLatestState(options = {}) {
        if (!window.fetch || this.isPulling) {
            return false;
        }

        this.isPulling = true;
        this.setStatus("syncing", "Sync: checking");

        try {
            const response = await fetch(SERVER_STATE_ENDPOINT, {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                const syncError = await buildSyncError(response, `Unable to load shared state (${response.status}).`);
                throw syncError;
            }

            const payload = await response.json();
            const remoteState = sanitizeStateSnapshot(payload.state || payload);
            const localStamp = getStateTimestamp(state);
            const remoteStamp = getStateTimestamp(remoteState);

            if (remoteStamp === 0 && options.allowAdoptLocal && isStatePopulated(state)) {
                await this.pushLatestState("bootstrap");
                return true;
            }

            if (remoteStamp > localStamp) {
                applySnapshotToState(state, remoteState);
                Storage.saveState(state);
                renderApp();
            } else if (localStamp > remoteStamp && isStatePopulated(state)) {
                this.schedulePush("recover");
            }

            this.setStatus("synced", "Sync: live");
            return true;
        } catch (error) {
            if (error && error.code === "SYNC_SETUP") {
                this.setStatus("setup", "Sync: setup");
            } else {
                this.setStatus("error", "Sync: offline");
            }
            return false;
        } finally {
            this.isPulling = false;
        }
    },

    async pushLatestState(reason = "update") {
        if (!window.fetch || this.isPushing) {
            return false;
        }

        this.isPushing = true;
        this.setStatus("syncing", reason === "bootstrap" ? "Sync: publishing" : "Sync: uploading");

        try {
            state.updatedAt = Date.now();
            Storage.saveState(state);

            const response = await fetch(SERVER_STATE_ENDPOINT, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    state: buildStateSnapshot(state)
                })
            });

            if (!response.ok) {
                const syncError = await buildSyncError(response, `Unable to save shared state (${response.status}).`);
                throw syncError;
            }

            const payload = await response.json();
            const savedState = sanitizeStateSnapshot(payload.state || payload);
            applySnapshotToState(state, savedState);
            Storage.saveState(state);
            renderApp();
            this.setStatus("synced", "Sync: live");
            return true;
        } catch (error) {
            if (error && error.code === "SYNC_SETUP") {
                this.setStatus("setup", "Sync: setup");
            } else {
                this.setStatus("error", "Sync: retrying");
            }
            return false;
        } finally {
            this.isPushing = false;
        }
    }
};

const HistoryService = {
    ensureUpToToday(history) {
        const normalizedHistory = sanitizeHistory(history);
        const todayKey = DateUtils.toKey();

        if (!normalizedHistory.length) {
            return [createEmptyHistoryEntry(todayKey)];
        }

        const historyMap = new Map(normalizedHistory.map((entry) => [entry.date, cloneHistoryEntry(entry)]));
        let cursor = DateUtils.parseKey(normalizedHistory[normalizedHistory.length - 1].date);
        const todayDate = DateUtils.parseKey(todayKey);

        while (DateUtils.diffInDays(todayDate, cursor) > 0) {
            cursor = DateUtils.addDays(cursor, 1);
            const cursorKey = DateUtils.toKey(cursor);
            if (!historyMap.has(cursorKey)) {
                historyMap.set(cursorKey, createEmptyHistoryEntry(cursorKey));
            }
        }

        if (!historyMap.has(todayKey)) {
            historyMap.set(todayKey, createEmptyHistoryEntry(todayKey));
        }

        return Array.from(historyMap.values()).sort((left, right) => left.date.localeCompare(right.date));
    },

    ensureEntry(history, dateKey) {
        const entry = history.find((item) => item.date === dateKey);
        if (entry) {
            return entry;
        }

        const freshEntry = createEmptyHistoryEntry(dateKey);
        history.push(freshEntry);
        history.sort((left, right) => left.date.localeCompare(right.date));
        return freshEntry;
    },

    recordCompletion(history, dateKey, completionData) {
        const entry = this.ensureEntry(history, dateKey);
        entry.tasksCompleted += 1;
        entry.xpEarned += completionData.xpEarned;
        entry.completedTasks.push({
            taskId: completionData.taskId,
            taskName: completionData.taskName,
            category: completionData.category,
            remark: completionData.remark,
            xpEarned: completionData.xpEarned,
            completedAt: completionData.completedAt
        });
    },

    getEntry(history, dateKey) {
        return history.find((item) => item.date === dateKey) || createEmptyHistoryEntry(dateKey);
    },

    buildRecentWindow(history, days) {
        const historyMap = new Map(history.map((entry) => [entry.date, entry]));
        const result = [];

        for (let offset = days - 1; offset >= 0; offset -= 1) {
            const targetDate = DateUtils.addDays(new Date(), -offset);
            const targetKey = DateUtils.toKey(targetDate);
            const match = historyMap.get(targetKey);
            result.push(
                match
                    ? cloneHistoryEntry(match)
                    : createEmptyHistoryEntry(targetKey)
            );
        }

        return result;
    },

    getFilteredHistory(history, filter) {
        if (filter === "monthly") {
            return this.buildRecentWindow(history, 30);
        }

        if (filter === "all") {
            return history.length ? history.map((entry) => cloneHistoryEntry(entry)) : [createEmptyHistoryEntry(DateUtils.toKey())];
        }

        return this.buildRecentWindow(history, 7);
    },

    getTotals(historyEntries) {
        return historyEntries.reduce(
            (totals, entry) => {
                totals.tasksCompleted += entry.tasksCompleted;
                totals.xpEarned += entry.xpEarned;
                return totals;
            },
            { tasksCompleted: 0, xpEarned: 0 }
        );
    },

    computeCurrentStreak(history) {
        const normalizedHistory = this.ensureUpToToday(history);
        const historyMap = new Map(normalizedHistory.map((entry) => [entry.date, entry]));
        const todayKey = DateUtils.toKey();
        const yesterdayKey = DateUtils.toKey(DateUtils.addDays(new Date(), -1));
        const todayEntry = historyMap.get(todayKey);

        let anchorDate;

        if (todayEntry && todayEntry.tasksCompleted > 0) {
            anchorDate = DateUtils.parseKey(todayKey);
        } else {
            const yesterdayEntry = historyMap.get(yesterdayKey);
            if (!yesterdayEntry || yesterdayEntry.tasksCompleted === 0) {
                return 0;
            }
            anchorDate = DateUtils.parseKey(yesterdayKey);
        }

        let streak = 0;
        let cursor = anchorDate;

        while (true) {
            const cursorKey = DateUtils.toKey(cursor);
            const entry = historyMap.get(cursorKey);

            if (!entry || entry.tasksCompleted === 0) {
                break;
            }

            streak += 1;
            cursor = DateUtils.addDays(cursor, -1);
        }

        return streak;
    },

    getChartData(history, filter) {
        if (filter === "all") {
            const source = history.length ? history : [{ date: DateUtils.toKey(), tasksCompleted: 0, xpEarned: 0, completedTasks: [] }];
            const monthMap = new Map();

            source.forEach((entry) => {
                const monthKey = entry.date.slice(0, 7);
                const existing = monthMap.get(monthKey) || {
                    label: DateUtils.formatMonthLabel(monthKey),
                    fullLabel: DateUtils.formatMonthLabel(monthKey),
                    tasksCompleted: 0,
                    xpEarned: 0
                };

                existing.tasksCompleted += entry.tasksCompleted;
                existing.xpEarned += entry.xpEarned;
                monthMap.set(monthKey, existing);
            });

            return Array.from(monthMap.entries())
                .sort((left, right) => left[0].localeCompare(right[0]))
                .map(([, value]) => value);
        }

        const entries = this.getFilteredHistory(history, filter);
        const isMonthly = filter === "monthly";

        return entries.map((entry, index) => {
            const entryDate = DateUtils.parseKey(entry.date);
            const dayLabel = DateUtils.getShortDay(DateUtils.getDayName(entryDate));
            const compactLabel = isMonthly
                ? index % 5 === 0 || index === entries.length - 1
                    ? String(entryDate.getDate())
                    : ""
                : dayLabel;

            return {
                label: compactLabel,
                fullLabel: `${dayLabel}, ${DateUtils.formatLongDate(entryDate)}`,
                tasksCompleted: entry.tasksCompleted,
                xpEarned: entry.xpEarned
            };
        });
    },

    getCategoryTotals(historyEntries) {
        const totals = createEmptyCategoryTotals();

        historyEntries.forEach((entry) => {
            (entry.completedTasks || []).forEach((taskLog) => {
                if (totals[taskLog.category] !== undefined) {
                    totals[taskLog.category] += 1;
                }
            });
        });

        return totals;
    },

    getWeeklyCategoryBuckets(history, filter) {
        const filteredHistory = this.getFilteredHistory(history, filter);
        const weekMap = new Map();

        filteredHistory.forEach((entry) => {
            const weekStart = DateUtils.getWeekStart(DateUtils.parseKey(entry.date));
            const weekKey = DateUtils.toKey(weekStart);
            const bucket = weekMap.get(weekKey) || {
                weekKey,
                label: DateUtils.formatWeekRange(weekStart),
                fullLabel: `Week of ${DateUtils.formatLongDate(weekStart)}`,
                ...createEmptyCategoryTotals(),
                total: 0
            };

            (entry.completedTasks || []).forEach((taskLog) => {
                if (bucket[taskLog.category] !== undefined) {
                    bucket[taskLog.category] += 1;
                    bucket.total += 1;
                }
            });

            weekMap.set(weekKey, bucket);
        });

        if (!weekMap.size) {
            const thisWeek = DateUtils.getWeekStart(new Date());
            const weekKey = DateUtils.toKey(thisWeek);
            weekMap.set(weekKey, {
                weekKey,
                label: DateUtils.formatWeekRange(thisWeek),
                fullLabel: `Week of ${DateUtils.formatLongDate(thisWeek)}`,
                ...createEmptyCategoryTotals(),
                total: 0
            });
        }

        return Array.from(weekMap.values()).sort((left, right) => left.weekKey.localeCompare(right.weekKey));
    },

    getLogbookEntries(history, filter) {
        return this.getFilteredHistory(history, filter)
            .filter((entry) => entry.tasksCompleted > 0)
            .sort((left, right) => right.date.localeCompare(left.date));
    }
};

const LevelService = {
    getThreshold(level) {
        return level * 100;
    },

    getRank(level) {
        const safeLevel = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL);
        return LEVEL_RANKS.find((rank) => safeLevel >= rank.min && safeLevel <= rank.max) || LEVEL_RANKS[0];
    },

    getRankTitle(level) {
        return this.getRank(level).title;
    },

    getNextRank(level) {
        const currentRank = this.getRank(level);
        return LEVEL_RANKS.find((rank) => rank.min > currentRank.max) || null;
    },

    normalizeState(currentState) {
        let nextLevel = Math.min(Math.max(Math.floor(currentState.level || 1), 1), MAX_LEVEL);
        let nextXp = Math.max(0, Math.floor(currentState.xp || 0));

        while (nextLevel < MAX_LEVEL && nextXp >= this.getThreshold(nextLevel)) {
            nextXp -= this.getThreshold(nextLevel);
            nextLevel += 1;
        }

        if (nextLevel >= MAX_LEVEL) {
            nextLevel = MAX_LEVEL;
            nextXp = 0;
        }

        currentState.level = nextLevel;
        currentState.xp = nextXp;
    },

    addXp(currentState, amount) {
        if (currentState.level >= MAX_LEVEL) {
            currentState.level = MAX_LEVEL;
            currentState.xp = 0;

            return {
                leveledUp: false,
                levelsGained: 0,
                newLevel: MAX_LEVEL,
                reachedMax: true
            };
        }

        let nextXp = currentState.xp + amount;
        let nextLevel = currentState.level;
        let levelsGained = 0;

        while (nextLevel < MAX_LEVEL && nextXp >= this.getThreshold(nextLevel)) {
            nextXp -= this.getThreshold(nextLevel);
            nextLevel += 1;
            levelsGained += 1;
        }

        if (nextLevel >= MAX_LEVEL) {
            nextLevel = MAX_LEVEL;
            nextXp = 0;
        }

        currentState.xp = nextXp;
        currentState.level = nextLevel;

        return {
            leveledUp: levelsGained > 0,
            levelsGained,
            newLevel: nextLevel,
            reachedMax: nextLevel === MAX_LEVEL
        };
    },

    getProgress(currentState) {
        if (currentState.level >= MAX_LEVEL) {
            const threshold = this.getThreshold(MAX_LEVEL);

            return {
                current: threshold,
                threshold,
                remaining: 0,
                percent: 100,
                isMax: true
            };
        }

        const threshold = this.getThreshold(currentState.level);
        return {
            current: currentState.xp,
            threshold,
            remaining: Math.max(0, threshold - currentState.xp),
            percent: Math.min((currentState.xp / threshold) * 100, 100),
            isMax: false
        };
    }
};

const TaskService = {
    getTasksForDay(tasks, dayName) {
        return tasks.filter((task) => task.scheduledDays.includes(dayName));
    },

    getRollingWeeklyCount(task, referenceKey = DateUtils.toKey()) {
        const referenceDate = DateUtils.parseKey(referenceKey);

        return task.completedDates.filter((dateKey) => {
            const taskDate = DateUtils.parseKey(dateKey);
            const dayDiff = DateUtils.diffInDays(referenceDate, taskDate);
            return dayDiff >= 0 && dayDiff < 7;
        }).length;
    },

    completeTask(currentState, taskId, remark = "") {
        const task = currentState.tasks.find((item) => item.id === taskId);
        const todayKey = DateUtils.toKey();
        const todayDay = DateUtils.getDayName();

        if (!task) {
            return { success: false, message: "Task not found." };
        }

        if (!task.scheduledDays.includes(todayDay)) {
            return { success: false, message: "This task is not scheduled for today." };
        }

        if (task.completedDates.includes(todayKey)) {
            return { success: false, message: "This task is already completed for today." };
        }

        const weeklyCountBefore = task.repeatType === "weekly" ? this.getRollingWeeklyCount(task, todayKey) : 0;

        task.completedDates = uniqueValues([...task.completedDates, todayKey]).sort();

        let xpAwarded = 10;
        let bonusAwarded = false;

        if (task.repeatType === "weekly" && weeklyCountBefore < task.targetPerWeek) {
            const weeklyCountAfter = this.getRollingWeeklyCount(task, todayKey);
            if (weeklyCountAfter >= task.targetPerWeek) {
                xpAwarded += 20;
                bonusAwarded = true;
            }
        }

        const levelInfo = LevelService.addXp(currentState, xpAwarded);
        HistoryService.recordCompletion(currentState.history, todayKey, {
            taskId: task.id,
            taskName: task.name,
            category: task.category,
            remark,
            xpEarned: xpAwarded,
            completedAt: new Date().toISOString()
        });
        currentState.history = HistoryService.ensureUpToToday(currentState.history);
        currentState.streak = HistoryService.computeCurrentStreak(currentState.history);

        return {
            success: true,
            taskName: task.name,
            category: task.category,
            xpAwarded,
            bonusAwarded,
            levelInfo
        };
    }
};

const state = Storage.loadState();
let selectedDay = DateUtils.getDayName();
let highlightedTaskId = "";
let toastTimer = 0;
let levelUpTimer = 0;
let autoLockTimer = 0;
let pendingCompletionTaskId = "";

const elements = {
    pageShell: document.getElementById("pageShell"),
    lockOverlay: document.getElementById("lockOverlay"),
    passcodeForm: document.getElementById("passcodeForm"),
    passcodeInput: document.getElementById("passcodeInput"),
    passcodeFeedback: document.getElementById("passcodeFeedback"),
    completionModal: document.getElementById("completionModal"),
    completionForm: document.getElementById("completionForm"),
    completionTaskName: document.getElementById("completionTaskName"),
    completionTaskCategory: document.getElementById("completionTaskCategory"),
    completionRemark: document.getElementById("completionRemark"),
    completionCancelBtn: document.getElementById("completionCancelBtn"),
    topbar: document.getElementById("topbar"),
    levelBadge: document.getElementById("levelBadge"),
    syncStatus: document.getElementById("syncStatus"),
    todayLabel: document.getElementById("todayLabel"),
    heroStreak: document.getElementById("heroStreak"),
    heroFocus: document.getElementById("heroFocus"),
    xpSummary: document.getElementById("xpSummary"),
    xpRemaining: document.getElementById("xpRemaining"),
    xpProgressBar: document.getElementById("xpProgressBar"),
    currentRank: document.getElementById("currentRank"),
    nextRank: document.getElementById("nextRank"),
    taskForm: document.getElementById("taskForm"),
    taskName: document.getElementById("taskName"),
    taskCategory: document.getElementById("taskCategory"),
    repeatType: document.getElementById("repeatType"),
    weeklyTargetField: document.getElementById("weeklyTargetField"),
    targetPerWeek: document.getElementById("targetPerWeek"),
    daySelector: document.getElementById("daySelector"),
    motivationMessage: document.getElementById("motivationMessage"),
    dailyLineDate: document.getElementById("dailyLineDate"),
    dailyLineText: document.getElementById("dailyLineText"),
    todayCompletedCount: document.getElementById("todayCompletedCount"),
    todayXpCount: document.getElementById("todayXpCount"),
    weeklyGoalsHit: document.getElementById("weeklyGoalsHit"),
    taskBoardTitle: document.getElementById("taskBoardTitle"),
    taskBoardHint: document.getElementById("taskBoardHint"),
    dayTabs: document.getElementById("dayTabs"),
    taskList: document.getElementById("taskList"),
    statsFilter: document.getElementById("statsFilter"),
    statTasksCompleted: document.getElementById("statTasksCompleted"),
    statXpEarned: document.getElementById("statXpEarned"),
    statCurrentLevel: document.getElementById("statCurrentLevel"),
    statCurrentStreak: document.getElementById("statCurrentStreak"),
    categorySummaryGrid: document.getElementById("categorySummaryGrid"),
    chartTitle: document.getElementById("chartTitle"),
    chartSummary: document.getElementById("chartSummary"),
    chartBars: document.getElementById("chartBars"),
    categoryChartTitle: document.getElementById("categoryChartTitle"),
    categoryChartSummary: document.getElementById("categoryChartSummary"),
    categoryLineChart: document.getElementById("categoryLineChart"),
    weeklyCategoryTableBody: document.getElementById("weeklyCategoryTableBody"),
    logbookList: document.getElementById("logbookList"),
    toast: document.getElementById("toast"),
    resetDataBtn: document.getElementById("resetDataBtn"),
    levelUpBanner: document.getElementById("levelUpBanner"),
    levelUpText: document.getElementById("levelUpText")
};

function init() {
    LevelService.normalizeState(state);
    state.history = HistoryService.ensureUpToToday(state.history);
    state.streak = HistoryService.computeCurrentStreak(state.history);
    Storage.saveState(state);

    bindEvents();
    initializeRevealObserver();
    updateFormDayButtons([DateUtils.getDayName()]);
    toggleWeeklyTargetField();
    handleScrollState();
    renderApp();
    syncAccessGate({ focusInput: true });
    SyncService.start();
}

function bindEvents() {
    elements.passcodeForm.addEventListener("submit", handlePasscodeSubmit);
    elements.passcodeInput.addEventListener("input", clearPasscodeFeedback);
    elements.completionForm.addEventListener("submit", handleCompletionSubmit);
    elements.completionCancelBtn.addEventListener("click", closeCompletionModal);
    elements.completionModal.addEventListener("click", handleCompletionModalClick);
    elements.taskForm.addEventListener("submit", handleTaskSubmit);
    elements.repeatType.addEventListener("change", toggleWeeklyTargetField);
    elements.daySelector.addEventListener("click", handleDaySelectorClick);
    elements.dayTabs.addEventListener("click", handleDayTabClick);
    elements.taskList.addEventListener("change", handleTaskCompletion);
    elements.taskList.addEventListener("click", handleTaskActions);
    elements.statsFilter.addEventListener("change", renderDashboard);
    elements.resetDataBtn.addEventListener("click", handleReset);
    window.addEventListener("scroll", handleScrollState, { passive: true });
    document.addEventListener("keydown", handleGlobalKeydown);
}

function handlePasscodeSubmit(event) {
    event.preventDefault();

    const passcode = String(elements.passcodeInput.value || "").trim();

    if (passcode !== APP_PASSCODE) {
        elements.passcodeFeedback.textContent = "Incorrect passcode. Try again.";
        elements.passcodeInput.value = "";
        elements.passcodeInput.focus();
        return;
    }

    const unlockUntil = Date.now() + MS_PER_DAY;
    localStorage.setItem(AUTH_STORAGE_KEY, String(unlockUntil));
    elements.passcodeInput.value = "";
    clearPasscodeFeedback();
    syncAccessGate();
    showToast("Rankion unlocked for 24 hours on this device.");
}

function handleCompletionModalClick(event) {
    if (event.target === elements.completionModal) {
        closeCompletionModal();
    }
}

function handleGlobalKeydown(event) {
    if (event.key === "Escape" && elements.completionModal.classList.contains("is-visible")) {
        closeCompletionModal();
    }
}

function openCompletionModal(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) {
        showToast("Task not found.");
        return;
    }

    pendingCompletionTaskId = taskId;
    elements.completionTaskName.textContent = task.name;
    elements.completionTaskCategory.className = `task-tag ${getCategoryDefinition(task.category).tagClass}`;
    elements.completionTaskCategory.textContent = getCategoryLabel(task.category);
    elements.completionRemark.value = "";
    elements.completionModal.classList.add("is-visible");
    elements.completionModal.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
        elements.completionRemark.focus();
    }, 30);
}

function closeCompletionModal() {
    pendingCompletionTaskId = "";
    elements.completionForm.reset();
    elements.completionModal.classList.remove("is-visible");
    elements.completionModal.setAttribute("aria-hidden", "true");
}

function handleCompletionSubmit(event) {
    event.preventDefault();

    if (!pendingCompletionTaskId) {
        closeCompletionModal();
        return;
    }

    const taskId = pendingCompletionTaskId;
    const remark = normalizeRemark(elements.completionRemark.value);
    const result = TaskService.completeTask(state, taskId, remark);
    closeCompletionModal();

    if (!result.success) {
        renderTaskBoard();
        showToast(result.message);
        return;
    }

    highlightedTaskId = taskId;
    persistAndRender();

    let completionMessage = `${result.taskName} completed in ${getCategoryLabel(result.category)}. +${result.xpAwarded} XP earned.`;
    if (result.bonusAwarded) {
        completionMessage += " Weekly target bonus unlocked.";
    }

    showToast(completionMessage);

    if (result.levelInfo.leveledUp) {
        showLevelUp(result.levelInfo.newLevel);
    }
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskName = normalizeTaskName(elements.taskName.value);
    const normalizedTaskName = taskName.toLowerCase();
    const repeatType = elements.repeatType.value === "weekly" ? "weekly" : "daily";
    const category = sanitizeCategory(elements.taskCategory.value);
    const scheduledDays = getSelectedFormDays();

    if (!taskName) {
        showToast("Add a task name before saving.");
        return;
    }

    if (!scheduledDays.length) {
        showToast("Choose at least one weekday for this task.");
        return;
    }

    const duplicateExists = state.tasks.some(
        (task) => normalizeTaskName(task.name).toLowerCase() === normalizedTaskName
    );

    if (duplicateExists) {
        showToast("Task names should stay unique so progress is easier to track.");
        return;
    }

    const targetPerWeek = repeatType === "weekly"
        ? clampNumber(elements.targetPerWeek.value, 1, 7)
        : null;

    state.tasks.unshift({
        id: createId(),
        name: taskName,
        category,
        repeatType,
        targetPerWeek,
        scheduledDays: orderDays(scheduledDays),
        completedDates: []
    });

    selectedDay = DateUtils.getDayName();
    event.target.reset();
    elements.targetPerWeek.value = "3";
    updateFormDayButtons([DateUtils.getDayName()]);
    toggleWeeklyTargetField();
    persistAndRender();

    showToast(`${getCategoryLabel(category)} task added for ${formatDayList(scheduledDays)}.`);
}

function handleDaySelectorClick(event) {
    const button = event.target.closest(".day-toggle");
    if (!button) {
        return;
    }

    const isSelected = button.classList.toggle("is-selected");
    button.setAttribute("aria-pressed", String(isSelected));
}

function handleDayTabClick(event) {
    const button = event.target.closest(".day-tab");
    if (!button) {
        return;
    }

    selectedDay = button.dataset.day;
    renderDayTabs();
    renderTaskBoard();
}

function handleTaskCompletion(event) {
    const checkbox = event.target.closest('input[data-action="complete"]');
    if (!checkbox) {
        return;
    }

    if (!checkbox.checked) {
        checkbox.checked = true;
        return;
    }

    checkbox.checked = false;
    openCompletionModal(checkbox.dataset.id);
}

function handleTaskActions(event) {
    const deleteButton = event.target.closest('button[data-action="delete"]');
    if (!deleteButton) {
        return;
    }

    const task = state.tasks.find((item) => item.id === deleteButton.dataset.id);
    if (!task) {
        return;
    }

    const userConfirmed = window.confirm(`Delete "${task.name}" from Rankion?`);
    if (!userConfirmed) {
        return;
    }

    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    persistAndRender();
    showToast("Task removed.");
}

function handleReset() {
    const userConfirmed = window.confirm("Reset all Rankion data? This removes tasks, XP, streak, and history.");
    if (!userConfirmed) {
        return;
    }

    Storage.reset();
    const freshState = Storage.loadState();
    state.tasks = freshState.tasks;
    state.xp = freshState.xp;
    state.level = freshState.level;
    state.streak = freshState.streak;
    state.history = HistoryService.ensureUpToToday(freshState.history);
    selectedDay = DateUtils.getDayName();
    closeCompletionModal();
    elements.statsFilter.value = "weekly";
    elements.taskForm.reset();
    elements.targetPerWeek.value = "3";
    updateFormDayButtons([DateUtils.getDayName()]);
    toggleWeeklyTargetField();
    persistAndRender();

    showToast("All Rankion data has been reset.");
}

function toggleWeeklyTargetField() {
    const isWeekly = elements.repeatType.value === "weekly";
    elements.weeklyTargetField.classList.toggle("is-hidden", !isWeekly);
}

function persistAndRender() {
    state.history = HistoryService.ensureUpToToday(state.history);
    state.streak = HistoryService.computeCurrentStreak(state.history);
    state.updatedAt = Date.now();
    Storage.saveState(state);
    renderApp();
    SyncService.schedulePush();
}

function renderApp() {
    renderHero();
    renderInsights();
    renderDayTabs();
    renderTaskBoard();
    renderDashboard();
    animateHighlightedTask();
}

function renderHero() {
    const today = new Date();
    const todayDay = DateUtils.getDayName(today);
    const todayKey = DateUtils.toKey(today);
    const todayTasks = TaskService.getTasksForDay(state.tasks, todayDay);
    const pendingTasks = todayTasks.filter((task) => !task.completedDates.includes(todayKey));
    const progress = LevelService.getProgress(state);
    const currentRankTitle = LevelService.getRankTitle(state.level);
    const nextRank = LevelService.getNextRank(state.level);

    elements.levelBadge.textContent = `Lv ${state.level} | ${currentRankTitle}`;
    elements.todayLabel.textContent = `${todayDay}, ${DateUtils.formatLongDate(today)}`;
    elements.heroStreak.textContent = formatDayCount(state.streak);
    elements.xpSummary.textContent = progress.isMax
        ? `Max Level ${MAX_LEVEL} reached`
        : `${progress.current} / ${progress.threshold} XP`;
    elements.xpRemaining.textContent = progress.isMax
        ? "Final rank unlocked: God"
        : `${progress.remaining} XP to level ${state.level + 1}`;
    elements.xpProgressBar.style.width = `${progress.percent}%`;
    elements.currentRank.textContent = `Rank: ${currentRankTitle}`;
    elements.nextRank.textContent = nextRank
        ? `Next rank: ${nextRank.title} at level ${nextRank.min}`
        : `Final rank: God at level ${MAX_LEVEL}`;

    if (!todayTasks.length) {
        elements.heroFocus.textContent = "No tasks scheduled";
    } else if (!pendingTasks.length) {
        elements.heroFocus.textContent = "Today's list is complete";
    } else if (pendingTasks.length === 1) {
        elements.heroFocus.textContent = "1 task left today";
    } else {
        elements.heroFocus.textContent = `${pendingTasks.length} tasks left today`;
    }
}

function renderInsights() {
    const today = new Date();
    const todayKey = DateUtils.toKey();
    const todayEntry = HistoryService.getEntry(state.history, todayKey);
    const todayTasks = TaskService.getTasksForDay(state.tasks, DateUtils.getDayName());
    const pendingTasks = todayTasks.filter((task) => !task.completedDates.includes(todayKey));
    const weeklyGoalsCompleted = state.tasks.filter(
        (task) => task.repeatType === "weekly" && TaskService.getRollingWeeklyCount(task, todayKey) >= task.targetPerWeek
    ).length;

    elements.todayCompletedCount.textContent = String(todayEntry.tasksCompleted);
    elements.todayXpCount.textContent = String(todayEntry.xpEarned);
    elements.weeklyGoalsHit.textContent = String(weeklyGoalsCompleted);
    elements.motivationMessage.textContent = getMotivationMessage(state.streak, todayTasks.length, pendingTasks.length);
    elements.dailyLineDate.textContent = DateUtils.formatLongDate(today);
    elements.dailyLineText.textContent = getDailyMotivationLine(todayKey);
}

function renderDayTabs() {
    const todayDay = DateUtils.getDayName();

    elements.dayTabs.innerHTML = DAYS.map((day) => {
        const count = TaskService.getTasksForDay(state.tasks, day).length;
        const label = count > 0 ? `${DateUtils.getShortDay(day)} - ${count}` : DateUtils.getShortDay(day);
        const classes = [
            "day-tab",
            selectedDay === day ? "is-active" : "",
            todayDay === day ? "is-today" : ""
        ]
            .filter(Boolean)
            .join(" ");

        return `<button type="button" class="${classes}" data-day="${day}" aria-pressed="${String(selectedDay === day)}">${label}</button>`;
    }).join("");
}

function renderTaskBoard() {
    const todayDay = DateUtils.getDayName();
    const todayKey = DateUtils.toKey();
    const isCurrentDaySelected = selectedDay === todayDay;
    const tasks = TaskService.getTasksForDay(state.tasks, selectedDay);

    elements.taskBoardTitle.textContent = `${selectedDay} Tasks`;
    elements.taskBoardHint.textContent = isCurrentDaySelected
        ? "Tasks are grouped by category. Complete today's scheduled tasks to earn XP and update the logbook."
        : `Preview mode. Tasks stay grouped by category, but only ${todayDay}'s tasks can be completed today.`;

    if (!tasks.length) {
        const emptyMessage = isCurrentDaySelected
            ? "Add your first task for today and start collecting XP."
            : `No tasks are scheduled for ${selectedDay}.`;

        elements.taskList.innerHTML = `
            <article class="empty-state">
                <h3>Nothing queued here yet</h3>
                <p>${emptyMessage}</p>
            </article>
        `;
        return;
    }

    elements.taskList.innerHTML = CATEGORY_DEFINITIONS
        .map((category) => renderTaskCategoryGroup(category, tasks.filter((task) => task.category === category.key), isCurrentDaySelected, todayKey))
        .join("");
}

function renderTaskCategoryGroup(category, tasks, isCurrentDaySelected, todayKey) {
    const taskCountCopy = tasks.length
        ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} scheduled`
        : "No tasks scheduled in this category";

    return `
        <section class="task-category-group">
            <div class="task-category-head">
                <div>
                    <h3>${category.label}</h3>
                    <p>${taskCountCopy}</p>
                </div>
                <span class="task-tag ${category.tagClass}">${tasks.length}</span>
            </div>

            <div class="task-category-stack">
                ${tasks.length
                    ? tasks.map((task) => renderTaskCard(task, isCurrentDaySelected, todayKey)).join("")
                    : `<div class="task-category-empty">No ${category.label.toLowerCase()} tasks are assigned to ${selectedDay}.</div>`}
            </div>
        </section>
    `;
}

function renderTaskCard(task, isCurrentDaySelected, todayKey) {
    const completedToday = task.completedDates.includes(todayKey);
    const canComplete = isCurrentDaySelected && !completedToday;
    const rollingCount = task.repeatType === "weekly" ? TaskService.getRollingWeeklyCount(task, todayKey) : 0;
    const progressPercent = task.repeatType === "weekly"
        ? Math.min((rollingCount / task.targetPerWeek) * 100, 100)
        : 0;
    const scheduleLine = `Repeats on ${task.scheduledDays.map((day) => DateUtils.getShortDay(day)).join(", ")}`;
    const categoryDefinition = getCategoryDefinition(task.category);

    let statusTitle = "Scheduled";
    let statusCopy = "Preview this task from its weekday tab.";

    if (isCurrentDaySelected && completedToday) {
        statusTitle = "Completed today";
        statusCopy = "Ready again on the next scheduled day.";
    } else if (isCurrentDaySelected) {
        statusTitle = "Ready";
        statusCopy = task.repeatType === "weekly"
            ? "Worth 10 XP, with a 20 XP bonus when the weekly target is reached."
            : "Worth 10 XP on completion.";
    }

    return `
        <article class="task-card task-card-${task.category} ${completedToday && isCurrentDaySelected ? "is-complete" : ""}" data-task-id="${task.id}" data-category="${task.category}">
            <div class="task-main">
                <label class="checkbox-shell" aria-label="Complete ${escapeHTML(task.name)}">
                    <input
                        type="checkbox"
                        data-action="complete"
                        data-id="${task.id}"
                        ${completedToday && isCurrentDaySelected ? "checked" : ""}
                        ${canComplete ? "" : "disabled"}
                    >
                    <span class="checkbox-mark"></span>
                </label>

                <div class="task-copy">
                    <div class="task-title-row">
                        <h3 class="task-title">${escapeHTML(task.name)}</h3>
                        <div class="task-tags">
                            <span class="task-tag ${categoryDefinition.tagClass}">${categoryDefinition.label}</span>
                            <span class="task-tag">${task.repeatType}</span>
                            ${task.repeatType === "weekly"
                                ? `<span class="task-tag task-tag-accent">${rollingCount}/${task.targetPerWeek} in 7 days</span>`
                                : ""}
                        </div>
                    </div>

                    <p class="task-meta">${scheduleLine}</p>

                    ${task.repeatType === "weekly"
                        ? `
                            <div class="task-progress">
                                <div class="task-progress-row">
                                    <span class="checkbox-note">Rolling weekly progress</span>
                                    <strong>${rollingCount}/${task.targetPerWeek}</strong>
                                </div>
                                <div class="mini-progress-track">
                                    <div class="mini-progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                            </div>
                        `
                        : ""}
                </div>
            </div>

            <div class="task-side">
                <div class="task-status">
                    <strong>${statusTitle}</strong>
                    <span>${statusCopy}</span>
                </div>
                <button type="button" class="delete-button" data-action="delete" data-id="${task.id}">Delete</button>
            </div>
        </article>
    `;
}

function renderDashboard() {
    const filter = elements.statsFilter.value;
    const filteredHistory = HistoryService.getFilteredHistory(state.history, filter);
    const totals = HistoryService.getTotals(filteredHistory);
    const chartData = HistoryService.getChartData(state.history, filter);
    const categoryTotals = HistoryService.getCategoryTotals(filteredHistory);
    const weeklyCategoryBuckets = HistoryService.getWeeklyCategoryBuckets(state.history, filter);
    const logbookEntries = HistoryService.getLogbookEntries(state.history, filter);

    elements.statTasksCompleted.textContent = String(totals.tasksCompleted);
    elements.statXpEarned.textContent = String(totals.xpEarned);
    elements.statCurrentLevel.textContent = `${state.level} - ${LevelService.getRankTitle(state.level)}`;
    elements.statCurrentStreak.textContent = formatDayCount(state.streak);

    if (filter === "monthly") {
        elements.chartTitle.textContent = "Last 30 days";
        elements.chartSummary.textContent = `${totals.tasksCompleted} tasks completed and ${totals.xpEarned} XP earned in the last 30 days.`;
    } else if (filter === "all") {
        const activeDays = filteredHistory.filter((entry) => entry.tasksCompleted > 0).length;
        elements.chartTitle.textContent = "All-time summary";
        elements.chartSummary.textContent = `${totals.tasksCompleted} total tasks, ${totals.xpEarned} total XP, and ${activeDays} active day${activeDays === 1 ? "" : "s"} recorded.`;
    } else {
        elements.chartTitle.textContent = "Last 7 days";
        elements.chartSummary.textContent = `${totals.tasksCompleted} tasks completed and ${totals.xpEarned} XP earned in the last 7 days.`;
    }

    renderChart(chartData);
    renderCategorySummary(categoryTotals);
    renderCategoryAnalytics(weeklyCategoryBuckets);
    renderLogbook(logbookEntries);
}

function renderChart(chartData) {
    const maxTasks = Math.max(1, ...chartData.map((item) => item.tasksCompleted));
    const maxXp = Math.max(1, ...chartData.map((item) => item.xpEarned));

    elements.chartBars.innerHTML = chartData
        .map((item) => {
            const tasksHeight = item.tasksCompleted > 0
                ? Math.max((item.tasksCompleted / maxTasks) * 100, 8)
                : 6;
            const xpHeight = item.xpEarned > 0
                ? Math.max((item.xpEarned / maxXp) * 100, 8)
                : 6;

            return `
                <div class="chart-item" title="${escapeHTML(item.fullLabel)}">
                    <div class="chart-bar-pair">
                        <div class="chart-bar tasks" style="height: ${tasksHeight}%"></div>
                        <div class="chart-bar xp" style="height: ${xpHeight}%"></div>
                    </div>
                    <div class="chart-label">${escapeHTML(item.label || " ")}</div>
                    <div class="chart-value">${item.tasksCompleted} / ${item.xpEarned}</div>
                </div>
            `;
        })
        .join("");
}

function renderCategorySummary(categoryTotals) {
    const totalLogged = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    const topFocusLabel = totalLogged
        ? getFocusCategoryLabel({ ...categoryTotals, total: totalLogged })
        : "No data yet";

    elements.categorySummaryGrid.innerHTML = `
        ${CATEGORY_DEFINITIONS.map((category) => `
            <article class="category-summary-card">
                <span>${category.label}</span>
                <strong>${categoryTotals[category.key]}</strong>
                <p>Completed tasks in this category for the selected range.</p>
            </article>
        `).join("")}
        <article class="category-summary-card">
            <span>Top focus</span>
            <strong>${topFocusLabel}</strong>
            <p>${totalLogged} logged completion${totalLogged === 1 ? "" : "s"} in this range.</p>
        </article>
    `;
}

function renderCategoryAnalytics(weeklyCategoryBuckets) {
    const topWeek = getTopWeekBucket(weeklyCategoryBuckets);
    elements.categoryChartTitle.textContent = "Category focus by week";
    elements.categoryChartSummary.textContent = topWeek
        ? `${topWeek.label} had the highest logged activity, led by ${getFocusCategoryLabel(topWeek)}.`
        : "No category completions have been logged in this range yet.";

    renderCategoryLineChart(weeklyCategoryBuckets);
    renderWeeklyCategoryTable(weeklyCategoryBuckets);
}

function renderCategoryLineChart(weeklyCategoryBuckets) {
    const hasData = weeklyCategoryBuckets.some((bucket) => bucket.total > 0);

    if (!hasData) {
        elements.categoryLineChart.innerHTML = `<div class="line-chart-empty">Complete a few categorized tasks and this weekly category line chart will start filling in.</div>`;
        return;
    }

    const width = Math.max(640, weeklyCategoryBuckets.length * 120);
    const height = 240;
    const leftPad = 34;
    const rightPad = 20;
    const topPad = 20;
    const bottomPad = 26;
    const chartHeight = height - topPad - bottomPad;
    const chartWidth = width - leftPad - rightPad;
    const maxValue = Math.max(
        1,
        ...weeklyCategoryBuckets.flatMap((bucket) => CATEGORY_DEFINITIONS.map((category) => bucket[category.key]))
    );
    const step = weeklyCategoryBuckets.length === 1 ? 0 : chartWidth / (weeklyCategoryBuckets.length - 1);

    const gridLines = Array.from({ length: 4 }, (_, index) => {
        const y = topPad + (chartHeight / 3) * index;
        return `<line class="line-chart-grid" x1="${leftPad}" y1="${y}" x2="${width - rightPad}" y2="${y}"></line>`;
    }).join("");

    const series = CATEGORY_DEFINITIONS.map((category) => {
        const points = weeklyCategoryBuckets.map((bucket, index) => {
            const x = weeklyCategoryBuckets.length === 1 ? leftPad + chartWidth / 2 : leftPad + step * index;
            const value = bucket[category.key];
            const y = topPad + chartHeight - (value / maxValue) * chartHeight;
            return { x, y, value };
        });

        const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
        const circles = points
            .map((point) => `<circle class="line-chart-point" cx="${point.x}" cy="${point.y}" r="4" fill="${category.color}"></circle>`)
            .join("");

        return `<polyline class="line-chart-path" stroke="${category.color}" points="${polyline}"></polyline>${circles}`;
    }).join("");

    const labels = weeklyCategoryBuckets.map((bucket) => `
        <div class="line-chart-label">
            <strong>${escapeHTML(bucket.label)}</strong><br>
            <span>${escapeHTML(getFocusCategoryLabel(bucket))}</span>
        </div>
    `).join("");

    elements.categoryLineChart.innerHTML = `
        <div class="line-chart-wrap">
            <div class="line-chart-frame">
                <svg class="line-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Weekly category activity line chart">
                    ${gridLines}
                    <line class="line-chart-axis" x1="${leftPad}" y1="${height - bottomPad}" x2="${width - rightPad}" y2="${height - bottomPad}"></line>
                    ${series}
                </svg>
            </div>
            <div class="line-chart-labels">${labels}</div>
        </div>
    `;
}

function renderWeeklyCategoryTable(weeklyCategoryBuckets) {
    const hasData = weeklyCategoryBuckets.some((bucket) => bucket.total > 0);

    if (!hasData) {
        elements.weeklyCategoryTableBody.innerHTML = `
            <tr>
                <td colspan="5">No weekly category data yet.</td>
            </tr>
        `;
        return;
    }

    elements.weeklyCategoryTableBody.innerHTML = weeklyCategoryBuckets
        .slice()
        .reverse()
        .map((bucket) => `
            <tr>
                <td>${escapeHTML(bucket.label)}</td>
                <td>${bucket.physique}</td>
                <td>${bucket.earnings}</td>
                <td>${bucket.intelligence}</td>
                <td class="table-focus">${escapeHTML(getFocusCategoryLabel(bucket))}</td>
            </tr>
        `)
        .join("");
}

function renderLogbook(logbookEntries) {
    if (!logbookEntries.length) {
        elements.logbookList.innerHTML = `<div class="logbook-empty">No completed tasks are recorded for this range yet. Save a completion with a remark and it will appear here.</div>`;
        return;
    }

    elements.logbookList.innerHTML = logbookEntries.map((entry) => {
        const detailedLogs = entry.completedTasks
            .slice()
            .sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)));

        const detailMarkup = detailedLogs.length
            ? detailedLogs.map((taskLog) => renderLogbookTask(taskLog)).join("")
            : `<div class="task-category-empty">Detailed task entries were not stored for this date yet.</div>`;

        return `
            <article class="logbook-card">
                <div class="logbook-card-head">
                    <div>
                        <h3>${DateUtils.formatLongDate(DateUtils.parseKey(entry.date))}</h3>
                        <p class="logbook-card-summary">${entry.tasksCompleted} completions and ${entry.xpEarned} XP earned.</p>
                    </div>
                    <strong>${DateUtils.getShortDay(DateUtils.getDayName(DateUtils.parseKey(entry.date)))}</strong>
                </div>

                <div class="logbook-task-list">
                    ${detailMarkup}
                </div>
            </article>
        `;
    }).join("");
}

function renderLogbookTask(taskLog) {
    const categoryDefinition = getCategoryDefinition(taskLog.category);
    const remarkMarkup = taskLog.remark
        ? `<div class="logbook-task-remark">${escapeHTML(taskLog.remark)}</div>`
        : "";

    return `
        <article class="logbook-task-item">
            <div class="logbook-task-head">
                <strong>${escapeHTML(taskLog.taskName)}</strong>
                <div class="logbook-task-meta">
                    <span class="task-tag ${categoryDefinition.tagClass}">${categoryDefinition.label}</span>
                    <span class="task-tag">+${taskLog.xpEarned} XP</span>
                    <span class="task-tag">${escapeHTML(formatCompletedAt(taskLog.completedAt))}</span>
                </div>
            </div>
            <p class="logbook-task-copy">Logged as a completed task in the ${categoryDefinition.label.toLowerCase()} category.</p>
            ${remarkMarkup}
        </article>
    `;
}

function updateFormDayButtons(activeDays) {
    const activeSet = new Set(activeDays);

    Array.from(elements.daySelector.querySelectorAll(".day-toggle")).forEach((button) => {
        const isSelected = activeSet.has(button.dataset.day);
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
}

function getSelectedFormDays() {
    return Array.from(elements.daySelector.querySelectorAll(".day-toggle.is-selected")).map((button) => button.dataset.day);
}

function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");

    toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("is-visible");
    }, 2600);
}

function showLevelUp(level) {
    window.clearTimeout(levelUpTimer);
    elements.levelUpText.textContent = `Level ${level} - ${LevelService.getRankTitle(level)}`;
    elements.levelUpBanner.classList.add("is-visible");
    elements.levelUpBanner.setAttribute("aria-hidden", "false");

    levelUpTimer = window.setTimeout(() => {
        elements.levelUpBanner.classList.remove("is-visible");
        elements.levelUpBanner.setAttribute("aria-hidden", "true");
    }, 1800);
}

function hasValidUnlock() {
    const unlockUntil = Number(localStorage.getItem(AUTH_STORAGE_KEY) || 0);
    return Date.now() < unlockUntil;
}

function clearPasscodeFeedback() {
    elements.passcodeFeedback.textContent = "Enter the passcode to continue.";
}

function scheduleAutoLock() {
    window.clearTimeout(autoLockTimer);

    const unlockUntil = Number(localStorage.getItem(AUTH_STORAGE_KEY) || 0);
    const remaining = unlockUntil - Date.now();

    if (remaining <= 0) {
        return;
    }

    autoLockTimer = window.setTimeout(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        syncAccessGate({ expired: true, focusInput: true });
    }, remaining + 100);
}

function syncAccessGate(options = {}) {
    const unlocked = hasValidUnlock();

    document.documentElement.classList.toggle("app-locked", !unlocked);
    elements.lockOverlay.setAttribute("aria-hidden", String(unlocked));
    elements.pageShell.setAttribute("aria-hidden", String(!unlocked));

    if (unlocked) {
        clearPasscodeFeedback();
        scheduleAutoLock();
        return;
    }

    window.clearTimeout(autoLockTimer);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    elements.passcodeInput.value = "";
    elements.passcodeFeedback.textContent = options.expired
        ? "Your 24-hour access expired. Enter the passcode again."
        : "Enter the passcode to continue.";

    if (options.focusInput) {
        window.setTimeout(() => {
            elements.passcodeInput.focus();
        }, 30);
    }
}

function animateHighlightedTask() {
    if (!highlightedTaskId) {
        return;
    }

    const card = elements.taskList.querySelector(`[data-task-id="${highlightedTaskId}"]`);
    if (card) {
        card.classList.add("completion-flash");
        window.setTimeout(() => card.classList.remove("completion-flash"), 720);
    }

    highlightedTaskId = "";
}

function initializeRevealObserver() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function handleScrollState() {
    elements.topbar.classList.toggle("is-scrolled", window.scrollY > 24);
}

function getMotivationMessage(streak, todayTaskCount, pendingTaskCount) {
    if (!todayTaskCount) {
        return "Schedule a task for a weekday that matters and give yourself a clear win to chase.";
    }

    if (streak === 0 && pendingTaskCount > 0) {
        return "Clear one task today to start the streak and put fresh XP on the board.";
    }

    if (streak <= 2) {
        return pendingTaskCount > 0
            ? "You have momentum now. Finish today's board and keep the chain moving."
            : "You showed up today. Protect the streak by coming back tomorrow as well.";
    }

    if (streak <= 6) {
        return pendingTaskCount > 0
            ? "The routine is taking shape. One more solid day strengthens it."
            : "Strong pace. Your streak is healthy and your weekly targets are within reach.";
    }

    if (streak <= 13) {
        return "You are building real consistency. Keep stacking clean days and let the XP compound.";
    }

    return "Your discipline is visible now. Stay sharp today and keep the standard high.";
}

function getDailyMotivationLine(dateKey) {
    const seed = String(dateKey)
        .split("")
        .reduce((total, character) => total + character.charCodeAt(0), 0);

    return DAILY_MOTIVATION_LINES[seed % DAILY_MOTIVATION_LINES.length];
}

function createEmptyCategoryTotals() {
    return CATEGORY_DEFINITIONS.reduce((totals, category) => {
        totals[category.key] = 0;
        return totals;
    }, {});
}

function createEmptyHistoryEntry(dateKey) {
    return {
        date: dateKey,
        tasksCompleted: 0,
        xpEarned: 0,
        completedTasks: []
    };
}

function cloneHistoryEntry(entry) {
    return {
        date: entry.date,
        tasksCompleted: entry.tasksCompleted,
        xpEarned: entry.xpEarned,
        completedTasks: Array.isArray(entry.completedTasks)
            ? entry.completedTasks.map((taskLog) => ({ ...taskLog }))
            : []
    };
}

async function buildSyncError(response, fallbackMessage) {
    let message = fallbackMessage;

    try {
        const payload = await response.json();
        if (payload && payload.error) {
            message = String(payload.error);
        }
    } catch (error) {
        message = fallbackMessage;
    }

    const syncError = new Error(message);
    if (response.status === 503) {
        syncError.code = "SYNC_SETUP";
    }

    return syncError;
}

function sanitizeTimestamp(value) {
    const parsedValue = Math.floor(Number(value) || 0);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function sanitizeStateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
        return {
            tasks: [],
            xp: 0,
            level: 1,
            streak: 0,
            history: [],
            updatedAt: 0
        };
    }

    const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(snapshot.level) || 1)));

    return {
        tasks: sanitizeTasks(snapshot.tasks),
        xp: level >= MAX_LEVEL ? 0 : Math.max(0, Math.floor(Number(snapshot.xp) || 0)),
        level,
        streak: Math.max(0, Math.floor(Number(snapshot.streak) || 0)),
        history: sanitizeHistory(snapshot.history),
        updatedAt: sanitizeTimestamp(snapshot.updatedAt)
    };
}

function buildStateSnapshot(currentState) {
    return sanitizeStateSnapshot({
        tasks: currentState.tasks,
        xp: currentState.xp,
        level: currentState.level,
        streak: currentState.streak,
        history: currentState.history,
        updatedAt: currentState.updatedAt
    });
}

function applySnapshotToState(targetState, snapshot) {
    const safeSnapshot = sanitizeStateSnapshot(snapshot);

    targetState.tasks = safeSnapshot.tasks;
    targetState.xp = safeSnapshot.xp;
    targetState.level = safeSnapshot.level;
    targetState.streak = safeSnapshot.streak;
    targetState.history = HistoryService.ensureUpToToday(safeSnapshot.history);
    targetState.updatedAt = safeSnapshot.updatedAt;

    LevelService.normalizeState(targetState);
    targetState.streak = HistoryService.computeCurrentStreak(targetState.history);
}

function getStateTimestamp(snapshot) {
    return sanitizeTimestamp(snapshot?.updatedAt);
}

function isStatePopulated(snapshot) {
    const safeSnapshot = sanitizeStateSnapshot(snapshot);
    return safeSnapshot.tasks.length > 0
        || safeSnapshot.history.some((entry) => entry.tasksCompleted > 0)
        || safeSnapshot.xp > 0
        || safeSnapshot.level > 1
        || safeSnapshot.streak > 0;
}

function sanitizeCategory(value) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    return CATEGORY_DEFINITIONS.some((category) => category.key === normalizedValue)
        ? normalizedValue
        : "intelligence";
}

function getCategoryDefinition(categoryKey) {
    return CATEGORY_DEFINITIONS.find((category) => category.key === sanitizeCategory(categoryKey)) || CATEGORY_DEFINITIONS[2];
}

function getCategoryLabel(categoryKey) {
    return getCategoryDefinition(categoryKey).label;
}

function normalizeRemark(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 220);
}

function normalizeCompletedAt(value, fallbackDateKey = DateUtils.toKey()) {
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
    }

    return DateUtils.parseKey(fallbackDateKey).toISOString();
}

function formatCompletedAt(value) {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return "Time unavailable";
    }

    return DateUtils.formatTime(parsedDate);
}

function getTopCategoryKeys(categoryTotals) {
    const highestValue = Math.max(
        0,
        ...CATEGORY_DEFINITIONS.map((category) => Math.max(0, Number(categoryTotals?.[category.key] || 0)))
    );

    if (highestValue === 0) {
        return [];
    }

    return CATEGORY_DEFINITIONS
        .filter((category) => Math.max(0, Number(categoryTotals?.[category.key] || 0)) === highestValue)
        .map((category) => category.key);
}

function getTopCategoryKey(categoryTotals) {
    return getTopCategoryKeys(categoryTotals)[0] || "";
}

function getFocusCategoryLabel(categoryTotals) {
    const topCategoryKeys = getTopCategoryKeys(categoryTotals);

    if (!topCategoryKeys.length) {
        return "No data yet";
    }

    if (topCategoryKeys.length === 1) {
        return getCategoryLabel(topCategoryKeys[0]);
    }

    return `Tie: ${topCategoryKeys.map((categoryKey) => getCategoryLabel(categoryKey)).join(" / ")}`;
}

function getTopWeekBucket(weeklyCategoryBuckets) {
    return weeklyCategoryBuckets
        .filter((bucket) => bucket.total > 0)
        .sort((left, right) => right.total - left.total || right.weekKey.localeCompare(left.weekKey))[0] || null;
}

function sanitizeTasks(tasks) {
    if (!Array.isArray(tasks)) {
        return [];
    }

    return tasks.reduce((result, rawTask) => {
        if (!rawTask || typeof rawTask !== "object") {
            return result;
        }

        const name = normalizeTaskName(rawTask.name);
        if (!name) {
            return result;
        }

        const repeatType = rawTask.repeatType === "weekly" ? "weekly" : "daily";
        const scheduledDays = orderDays(
            uniqueValues(
                Array.isArray(rawTask.scheduledDays)
                    ? rawTask.scheduledDays.filter((day) => DAYS.includes(day))
                    : [DateUtils.getDayName()]
            )
        );

        const completedDates = uniqueValues(
            Array.isArray(rawTask.completedDates)
                ? rawTask.completedDates.filter(isValidDateKey)
                : []
        ).sort();

        result.push({
            id: rawTask.id ? String(rawTask.id) : createId(),
            name,
            category: sanitizeCategory(rawTask.category),
            repeatType,
            targetPerWeek: repeatType === "weekly" ? clampNumber(rawTask.targetPerWeek, 1, 7) : null,
            scheduledDays: scheduledDays.length ? scheduledDays : [DateUtils.getDayName()],
            completedDates
        });

        return result;
    }, []);
}

function sanitizeHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    const historyMap = new Map();

    history.forEach((rawEntry) => {
        if (!rawEntry || typeof rawEntry !== "object" || !isValidDateKey(rawEntry.date)) {
            return;
        }

        const completedTaskLogs = sanitizeCompletedTaskLogs(rawEntry.completedTasks, rawEntry.date);
        const safeEntry = historyMap.get(rawEntry.date) || createEmptyHistoryEntry(rawEntry.date);
        const derivedTasksCompleted = completedTaskLogs.length;
        const derivedXpEarned = completedTaskLogs.reduce((sum, taskLog) => sum + taskLog.xpEarned, 0);

        safeEntry.tasksCompleted += Math.max(0, Math.floor(Number(rawEntry.tasksCompleted) || 0), derivedTasksCompleted);
        safeEntry.xpEarned += Math.max(0, Math.floor(Number(rawEntry.xpEarned) || 0), derivedXpEarned);
        safeEntry.completedTasks.push(...completedTaskLogs);
        historyMap.set(rawEntry.date, safeEntry);
    });

    return Array.from(historyMap.values())
        .map((entry) => ({
            ...entry,
            completedTasks: entry.completedTasks
                .slice()
                .sort((left, right) => String(left.completedAt).localeCompare(String(right.completedAt)))
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
}

function isValidDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return false;
    }

    const parsedDate = DateUtils.parseKey(value);
    return !Number.isNaN(parsedDate.getTime());
}

function normalizeTaskName(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function clampNumber(value, min, max) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) {
        return min;
    }
    return Math.min(Math.max(parsed, min), max);
}

function uniqueValues(values) {
    return [...new Set(values)];
}

function orderDays(days) {
    return [...days].sort((left, right) => DAYS.indexOf(left) - DAYS.indexOf(right));
}

function formatDayList(days) {
    return orderDays(days).map((day) => DateUtils.getShortDay(day)).join(", ");
}

function formatDayCount(count) {
    return `${count} day${count === 1 ? "" : "s"}`;
}

function sanitizeCompletedTaskLogs(logs, fallbackDateKey) {
    if (!Array.isArray(logs)) {
        return [];
    }

    return logs.reduce((result, rawLog) => {
        if (!rawLog || typeof rawLog !== "object") {
            return result;
        }

        const taskName = normalizeTaskName(rawLog.taskName || rawLog.name);
        if (!taskName) {
            return result;
        }

        result.push({
            taskId: rawLog.taskId ? String(rawLog.taskId) : createId(),
            taskName,
            category: sanitizeCategory(rawLog.category),
            remark: normalizeRemark(rawLog.remark),
            xpEarned: Math.max(0, Math.floor(Number(rawLog.xpEarned) || 0)),
            completedAt: normalizeCompletedAt(rawLog.completedAt, fallbackDateKey)
        });

        return result;
    }, []);
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

init();
