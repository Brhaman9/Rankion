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
const BASE_TASK_XP = 10;
const DEFAULT_TASK_REWARD_POINTS = 10;
const DEFAULT_STREAK_BOOST_PERCENT = 10;
const WEEKLY_TARGET_BONUS_XP = 20;
const WEEKLY_TARGET_BONUS_POINTS = 20;
const MISSED_DAY_XP_PENALTY = 20;

const SUPABASE_CONFIG = {
    url: "https://kyebdjjlfmahlcblcgmg.supabase.co",
    anonKey: "sb_publishable_vVAU4DyP3SqqJTAsnR8aXw_4hPt4bc3"
};

const CATEGORY_DEFINITIONS = [
    { key: "physique", label: "Physique", color: "#89d36b", tagClass: "task-tag-physique" },
    { key: "earnings", label: "Earnings", color: "#ffd263", tagClass: "task-tag-earnings" },
    { key: "intelligence", label: "Intelligence", color: "#7ec8ff", tagClass: "task-tag-intelligence" }
];

const STORAGE_KEYS = {
    tasks: "tasks",
    xp: "xp",
    points: "points",
    rewards: "rewards",
    redemptions: "redemptions",
    level: "level",
    streak: "streak",
    history: "history",
    learningItems: "rankion_learning_items",
    revisions: "rankion_revisions",
    sessions: "rankion_sessions",
    migrationCompleted: "rankion_migration_completed",
    updatedAt: "updatedAt"
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SPACING_INTERVALS = [0, 3, 7, 14, 30, 60, 120, 240];

const LEVEL_RANKS = [
    { min: 1, max: 14, code: "E", title: "Hunter" },
    { min: 15, max: 34, code: "D", title: "Hunter" },
    { min: 35, max: 59, code: "C", title: "Hunter" },
    { min: 60, max: 89, code: "B", title: "Hunter" },
    { min: 90, max: 129, code: "A", title: "Hunter" },
    { min: 130, max: 179, code: "S", title: "Hunter" },
    { min: 180, max: 229, code: "N", title: "National-Level Hunter" },
    { min: 230, max: 274, code: "SM", title: "Shadow Monarch" },
    { min: 275, max: 299, code: "M", title: "Monarch" },
    { min: 300, max: 300, code: "AM", title: "Absolute Monarch" }
];

const LEVEL_ARCS = [
    { min: 1, max: 14, title: "Beginner's Arc" },
    { min: 15, max: 34, title: "Gate Training Arc" },
    { min: 35, max: 59, title: "Dungeon Raider Arc" },
    { min: 60, max: 89, title: "Shadow Trial Arc" },
    { min: 90, max: 129, title: "Elite Hunter Arc" },
    { min: 130, max: 179, title: "S-Rank Awakening Arc" },
    { min: 180, max: 229, title: "National Hunter Arc" },
    { min: 230, max: 274, title: "Shadow Monarch Arc" },
    { min: 275, max: 299, title: "Monarch War Arc" },
    { min: 300, max: 300, title: "Absolute Monarch Arc" }
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
            points: Math.max(0, Math.floor(this.loadNumber(STORAGE_KEYS.points, 0))),
            rewards: sanitizeRewards(this.loadJSON(STORAGE_KEYS.rewards, getDefaultRewards())),
            redemptions: sanitizeRedemptions(this.loadJSON(STORAGE_KEYS.redemptions, [])),
            level,
            streak: Math.max(0, Math.floor(this.loadNumber(STORAGE_KEYS.streak, 0))),
            history: sanitizeHistory(this.loadJSON(STORAGE_KEYS.history, [])),
            learningItems: this.loadJSON(STORAGE_KEYS.learningItems, []),
            revisions: this.loadJSON(STORAGE_KEYS.revisions, []),
            sessions: this.loadJSON(STORAGE_KEYS.sessions, []),
            updatedAt: sanitizeTimestamp(this.loadNumber(STORAGE_KEYS.updatedAt, 0))
        };
    },

    saveState(currentState) {
        localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(currentState.tasks));
        localStorage.setItem(STORAGE_KEYS.xp, String(currentState.xp));
        localStorage.setItem(STORAGE_KEYS.points, String(currentState.points));
        localStorage.setItem(STORAGE_KEYS.rewards, JSON.stringify(currentState.rewards));
        localStorage.setItem(STORAGE_KEYS.redemptions, JSON.stringify(currentState.redemptions));
        localStorage.setItem(STORAGE_KEYS.level, String(currentState.level));
        localStorage.setItem(STORAGE_KEYS.streak, String(currentState.streak));
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(currentState.history));
        localStorage.setItem(STORAGE_KEYS.learningItems, JSON.stringify(currentState.learningItems || []));
        localStorage.setItem(STORAGE_KEYS.revisions, JSON.stringify(currentState.revisions || []));
        localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(currentState.sessions || []));
        localStorage.setItem(STORAGE_KEYS.updatedAt, String(sanitizeTimestamp(currentState.updatedAt)));
    },

    reset() {
        Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    }
};

/* ==============================================================================
   SUPABASE SERVICE (EMBEDDED PERMANENT POSTGRESQL PERSISTENCE)
   ============================================================================== */
const SupabaseService = {
    client: null,
    isConnected: false,

    init() {
        if (window.supabase && typeof window.supabase.createClient === "function") {
            try {
                this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                this.isConnected = true;
                this.updateSyncUI("synced", "Cloud Synced");
                this.pullAndMerge();
            } catch (err) {
                console.error("Supabase init error:", err);
                this.isConnected = false;
                this.updateSyncUI("error", "Sync Error");
            }
        } else {
            this.isConnected = false;
            this.updateSyncUI("local", "Local Storage");
        }
    },

    updateSyncUI(status, label) {
        const syncDot = document.getElementById("syncDot");
        const syncLabel = document.getElementById("syncLabel");
        const modalSyncDot = document.getElementById("modalSyncDot");
        const modalSyncStatusText = document.getElementById("modalSyncStatusText");

        if (syncDot) syncDot.className = `sync-dot ${status}`;
        if (syncLabel) syncLabel.textContent = label;
        if (modalSyncDot) modalSyncDot.className = `sync-dot ${status}`;
        if (modalSyncStatusText) modalSyncStatusText.textContent = `Storage Mode: ${label}`;
    },

    async forceSync() {
        if (!this.client) {
            this.init();
        }
        if (this.client) {
            await this.pushState(state);
            await this.pullAndMerge();
            showToast("Cloud sync completed successfully!");
        } else {
            showToast("Supabase client unavailable. Operating in local mode.");
        }
    },

    async deleteTask(taskId) {
        if (!this.client || !taskId) return;
        try {
            await this.client.from("tasks").delete().eq("id", taskId);
        } catch (err) {
            console.warn("Supabase deleteTask warning:", err);
        }
    },

    async deleteReward(rewardId) {
        if (!this.client || !rewardId) return;
        try {
            await this.client.from("rewards").delete().eq("id", rewardId);
        } catch (err) {
            console.warn("Supabase deleteReward warning:", err);
        }
    },

    async resetCloudData() {
        if (!this.client) return;
        try {
            this.updateSyncUI("syncing", "Resetting Cloud...");
            // Delete child tables first, then parent tables to respect foreign keys
            await this.client.from("revisions").delete().neq("id", "_dummy_");
            await this.client.from("practice_records").delete().neq("id", "_dummy_");
            await this.client.from("learning_items").delete().neq("id", "_dummy_");
            await this.client.from("sessions").delete().neq("id", "_dummy_");
            await this.client.from("topics").delete().neq("id", "_dummy_");
            await this.client.from("subjects").delete().neq("id", "_dummy_");
            await this.client.from("redemptions").delete().neq("id", "_dummy_");
            await this.client.from("tasks").delete().neq("id", "_dummy_");
            await this.client.from("rewards").delete().neq("id", "_dummy_");
            await this.client.from("history").delete().neq("date", "_dummy_");
            await this.client.from("app_meta").delete().neq("key", "_dummy_");
            this.updateSyncUI("synced", "Cloud Reset");
        } catch (err) {
            console.warn("Supabase resetCloudData warning:", err);
        }
    },

    async pullAndMerge() {
        if (!this.client) return;
        try {
            this.updateSyncUI("syncing", "Syncing...");
            const [
                { data: tasksData, error: tasksError },
                { data: rewardsData, error: rewardsError },
                { data: redemptionsData, error: redemptionsError },
                { data: historyData, error: historyError },
                { data: learningItemsData, error: learningItemsError },
                { data: revisionsData, error: revisionsError },
                { data: sessionsData, error: sessionsError },
                { data: metaData, error: metaError }
            ] = await Promise.all([
                this.client.from("tasks").select("*"),
                this.client.from("rewards").select("*"),
                this.client.from("redemptions").select("*"),
                this.client.from("history").select("*"),
                this.client.from("learning_items").select("*"),
                this.client.from("revisions").select("*"),
                this.client.from("sessions").select("*"),
                this.client.from("app_meta").select("*")
            ]);

            if (Array.isArray(tasksData) && !tasksError) {
                state.tasks = tasksData.map(t => ({
                    id: t.id,
                    name: t.name,
                    category: t.category,
                    repeatType: t.repeat_type || t.repeatType || "daily",
                    targetPerWeek: t.target_per_week || t.targetPerWeek || 3,
                    rewardPoints: t.reward_points || t.rewardPoints || 10,
                    streakBoostPercent: t.streak_boost_percent ?? t.streakBoostPercent ?? 10,
                    scheduledDays: t.scheduled_days || t.scheduledDays || [DateUtils.getDayName()],
                    completedDates: t.completed_dates || t.completedDates || []
                }));
            }

            if (Array.isArray(rewardsData) && !rewardsError) {
                if (rewardsData.length > 0) {
                    state.rewards = rewardsData.map(r => ({
                        id: r.id,
                        name: r.name,
                        cost: r.cost,
                        createdAt: r.created_at || r.createdAt
                    }));
                } else {
                    state.rewards = getDefaultRewards();
                }
            }

            if (Array.isArray(redemptionsData) && !redemptionsError) {
                state.redemptions = redemptionsData.map(r => ({
                    id: r.id,
                    rewardId: r.reward_id || r.rewardId,
                    rewardName: r.reward_name || r.rewardName,
                    cost: r.cost,
                    redeemedAt: r.redeemed_at || r.redeemedAt
                }));
            }

            if (Array.isArray(historyData) && !historyError) {
                state.history = sanitizeHistory(historyData.map(h => ({
                    date: h.date,
                    tasksCompleted: h.tasks_completed ?? h.tasksCompleted ?? 0,
                    xpEarned: h.xp_earned ?? h.xpEarned ?? 0,
                    xpPenalty: h.xp_penalty ?? h.xpPenalty ?? 0,
                    penaltyApplied: h.penalty_applied ?? h.penaltyApplied ?? false,
                    completedTasks: h.completed_tasks || h.completedTasks || []
                })));
                state.history = HistoryService.ensureUpToToday(state.history);
            }

            if (Array.isArray(learningItemsData) && !learningItemsError) {
                state.learningItems = learningItemsData.map(item => ({
                    id: item.id,
                    sessionId: item.session_id || item.sessionId,
                    subjectId: item.subject_id || item.subjectId,
                    topicId: item.topic_id || item.topicId,
                    subjectName: item.subject_name || item.subjectName || "General",
                    topicName: item.topic_name || item.topicName || "General",
                    subtopic: item.subtopic || "",
                    title: item.title,
                    learningDate: item.learning_date || item.learningDate,
                    whatLearned: item.what_learned || item.whatLearned || "",
                    keyConcepts: item.key_concepts || item.keyConcepts || "",
                    importantPoints: item.important_points || item.importantPoints || "",
                    formulasFacts: item.formulas_facts || item.formulasFacts || "",
                    notes: item.notes || "",
                    confidence: item.confidence || 3,
                    questionsAttempted: item.questions_attempted || item.questionsAttempted || 0,
                    questionsCorrect: item.questions_correct || item.questionsCorrect || 0,
                    createdAt: item.created_at || item.createdAt
                }));
            }

            if (Array.isArray(revisionsData) && !revisionsError) {
                state.revisions = revisionsData.map(r => ({
                    id: r.id,
                    learningItemId: r.learning_item_id || r.learningItemId,
                    revisionNumber: r.revision_number ?? r.revisionNumber ?? 0,
                    scheduledDate: r.scheduled_date || r.scheduledDate,
                    completedAt: r.completed_at || r.completedAt,
                    status: r.status,
                    recallScore: r.recall_score ?? r.recallScore ?? null,
                    confidence: r.confidence,
                    recallNotes: r.recall_notes || r.recallNotes || "",
                    whatForgot: r.what_forgot || r.whatForgot || "",
                    nextRevisionDate: r.next_revision_date || r.nextRevisionDate || null,
                    createdAt: r.created_at || r.createdAt
                }));
            }

            if (Array.isArray(sessionsData) && !sessionsError) {
                state.sessions = sessionsData.map(s => ({
                    id: s.id,
                    subjectId: s.subject_id || s.subjectId,
                    topicId: s.topic_id || s.topicId,
                    sessionType: s.session_type || s.sessionType || "normal",
                    title: s.title,
                    startTime: s.start_time || s.startTime,
                    endTime: s.end_time || s.endTime,
                    duration: s.duration || 0,
                    notes: s.notes || "",
                    createdAt: s.created_at || s.createdAt
                }));
            }

            if (Array.isArray(metaData) && !metaError && metaData.length > 0) {
                metaData.forEach(m => {
                    if (m.key === "level" && m.value?.level !== undefined) state.level = Number(m.value.level);
                    if (m.key === "xp" && m.value?.xp !== undefined) state.xp = Number(m.value.xp);
                    if (m.key === "points" && m.value?.points !== undefined) state.points = Number(m.value.points);
                    if (m.key === "streak" && m.value?.streak !== undefined) state.streak = Number(m.value.streak);
                });
            }

            RevisionService.pruneFutureUnreachedRevisions(state);
            RevisionService.evaluateStatuses(state.revisions);
            Storage.saveState(state);
            renderApp();
            this.updateSyncUI("synced", "Cloud Synced");
        } catch (err) {
            console.warn("Supabase pullAndMerge warning:", err);
            this.updateSyncUI("local", "Local Cache");
        }
    },

    async pushState(currentState) {
        if (!this.client) return;
        try {
            this.updateSyncUI("syncing", "Saving...");

            const metaRecords = [
                { key: "level", value: { level: currentState.level }, updated_at: new Date().toISOString() },
                { key: "xp", value: { xp: currentState.xp }, updated_at: new Date().toISOString() },
                { key: "points", value: { points: currentState.points }, updated_at: new Date().toISOString() },
                { key: "streak", value: { streak: currentState.streak }, updated_at: new Date().toISOString() },
                { key: "updatedAt", value: { updatedAt: currentState.updatedAt }, updated_at: new Date().toISOString() }
            ];

            const tasksPayload = (currentState.tasks || []).map(t => ({
                id: t.id,
                name: t.name,
                category: t.category,
                repeat_type: t.repeatType,
                target_per_week: t.targetPerWeek,
                reward_points: t.rewardPoints,
                streak_boost_percent: t.streakBoostPercent,
                scheduled_days: t.scheduledDays,
                completed_dates: t.completedDates,
                updated_at: new Date().toISOString()
            }));

            const rewardsPayload = (currentState.rewards || []).map(r => ({
                id: r.id,
                name: r.name,
                cost: r.cost,
                created_at: r.createdAt || new Date().toISOString()
            }));

            const redemptionsPayload = (currentState.redemptions || []).map(r => ({
                id: r.id,
                reward_id: r.rewardId,
                reward_name: r.rewardName,
                cost: r.cost,
                redeemed_at: r.redeemedAt || new Date().toISOString()
            }));

            const historyPayload = (currentState.history || []).map(h => ({
                date: h.date,
                tasks_completed: h.tasksCompleted,
                xp_earned: h.xpEarned,
                xp_penalty: h.xpPenalty,
                penalty_applied: h.penaltyApplied,
                completed_tasks: h.completedTasks,
                updated_at: new Date().toISOString()
            }));

            const learningItemsPayload = (currentState.learningItems || []).map(item => ({
                id: item.id,
                session_id: item.sessionId || null,
                subject_id: item.subjectId || null,
                topic_id: item.topicId || null,
                subject_name: item.subjectName || "",
                topic_name: item.topicName || "",
                subtopic: item.subtopic || "",
                title: item.title,
                learning_date: item.learningDate,
                what_learned: item.whatLearned || "",
                key_concepts: item.keyConcepts || "",
                important_points: item.importantPoints || "",
                formulas_facts: item.formulasFacts || "",
                notes: item.notes || "",
                confidence: item.confidence || 3,
                questions_attempted: item.questionsAttempted || 0,
                questions_correct: item.questionsCorrect || 0,
                created_at: item.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const revisionsPayload = (currentState.revisions || []).map(rev => ({
                id: rev.id,
                learning_item_id: rev.learningItemId,
                revision_number: rev.revisionNumber,
                scheduled_date: rev.scheduledDate,
                completed_at: rev.completedAt || null,
                status: rev.status,
                recall_score: rev.recallScore || null,
                confidence: rev.confidence || null,
                recall_notes: rev.recallNotes || "",
                what_forgot: rev.whatForgot || "",
                next_revision_date: rev.nextRevisionDate || null,
                created_at: rev.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const sessionsPayload = (currentState.sessions || []).map(s => ({
                id: s.id,
                subject_id: s.subjectId || null,
                topic_id: s.topicId || null,
                session_type: s.sessionType || "normal",
                title: s.title,
                start_time: s.startTime || new Date().toISOString(),
                end_time: s.endTime || new Date().toISOString(),
                duration: s.duration || 0,
                notes: s.notes || "",
                created_at: s.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            await Promise.all([
                metaRecords.length ? this.client.from("app_meta").upsert(metaRecords) : Promise.resolve(),
                tasksPayload.length ? this.client.from("tasks").upsert(tasksPayload) : Promise.resolve(),
                rewardsPayload.length ? this.client.from("rewards").upsert(rewardsPayload) : Promise.resolve(),
                redemptionsPayload.length ? this.client.from("redemptions").upsert(redemptionsPayload) : Promise.resolve(),
                historyPayload.length ? this.client.from("history").upsert(historyPayload) : Promise.resolve(),
                learningItemsPayload.length ? this.client.from("learning_items").upsert(learningItemsPayload) : Promise.resolve(),
                revisionsPayload.length ? this.client.from("revisions").upsert(revisionsPayload) : Promise.resolve(),
                sessionsPayload.length ? this.client.from("sessions").upsert(sessionsPayload) : Promise.resolve()
            ]);

            this.updateSyncUI("synced", "Cloud Synced");
        } catch (err) {
            console.warn("Supabase pushState fallback:", err);
            this.updateSyncUI("local", "Local Cache");
        }
    },

    async migrateLocalData(currentState) {
        if (!this.client) {
            throw new Error("Supabase client is not initialized.");
        }
        await this.pushState(currentState);
        localStorage.setItem(STORAGE_KEYS.migrationCompleted, "true");
        return true;
    }
};

/* ==============================================================================
   SPACED REVISION SYSTEM (LEARNING ITEMS, ACTIVE RECALL, ADAPTIVE SPACING)
   ============================================================================== */
const RevisionService = {
    createInitialRevisions(learningItemId, learningDateKey, initialNote = "") {
        const baseDate = DateUtils.parseKey(learningDateKey);
        const todayKey = DateUtils.toKey();

        // Milestone 0 (Day 0) - Learned today (recorded as completed)
        const day0Rev = {
            id: createId(),
            learningItemId,
            revisionNumber: 0,
            scheduledDate: learningDateKey,
            completedAt: new Date().toISOString(),
            status: "completed",
            recallScore: 5,
            confidence: "High",
            recallNotes: initialNote || "Initial learning session completed",
            whatForgot: "",
            nextRevisionDate: DateUtils.toKey(DateUtils.addDays(baseDate, 3)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Milestone 1 (Day 3) - ONLY the immediate next revision is scheduled
        const day3Date = DateUtils.toKey(DateUtils.addDays(baseDate, 3));
        const day3Rev = {
            id: createId(),
            learningItemId,
            revisionNumber: 1,
            scheduledDate: day3Date,
            completedAt: null,
            status: day3Date === todayKey ? "due_today" : (day3Date < todayKey ? "overdue" : "upcoming"),
            recallScore: null,
            confidence: null,
            recallNotes: "",
            whatForgot: "",
            nextRevisionDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return [day0Rev, day3Rev];
    },

    createLearningItem(currentState, itemData) {
        const itemId = createId();
        const learningDate = itemData.learningDate || DateUtils.toKey();
        const subjectName = normalizeTaskName(itemData.subjectName || "General");
        const topicName = normalizeTaskName(itemData.topicName || itemData.lesson || "General");
        const title = normalizeTaskName(itemData.title || (topicName !== "General" && topicName.toLowerCase() !== subjectName.toLowerCase() ? `${subjectName} - ${topicName}` : subjectName));

        const learningItem = {
            id: itemId,
            sessionId: itemData.sessionId || null,
            subjectId: null,
            topicId: null,
            subjectName,
            topicName,
            subtopic: normalizeTaskName(itemData.subtopic || ""),
            title,
            learningDate,
            whatLearned: normalizeRemark(itemData.whatLearned),
            keyConcepts: normalizeRemark(itemData.keyConcepts),
            importantPoints: normalizeRemark(itemData.importantPoints),
            formulasFacts: normalizeRemark(itemData.formulasFacts || ""),
            notes: normalizeRemark(itemData.notes),
            confidence: clampNumber(itemData.confidence || 3, 1, 5),
            questionsAttempted: clampNumber(itemData.questionsAttempted || 0, 0, 9999),
            questionsCorrect: clampNumber(itemData.questionsCorrect || 0, 0, 9999),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const generatedRevisions = this.createInitialRevisions(itemId, learningDate, itemData.whatLearned || itemData.notes || "");

        currentState.learningItems = [learningItem, ...(currentState.learningItems || [])];
        currentState.revisions = [...generatedRevisions, ...(currentState.revisions || [])];

        return { learningItem, revisions: generatedRevisions };
    },

    createSession(currentState, sessionData) {
        const sessionId = createId();
        const session = {
            id: sessionId,
            subjectId: null,
            topicId: null,
            sessionType: sessionData.sessionType || "normal",
            title: normalizeTaskName(sessionData.title),
            startTime: sessionData.startTime || new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: clampNumber(sessionData.duration || 30, 1, 1440),
            notes: normalizeRemark(sessionData.notes),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        currentState.sessions = [session, ...(currentState.sessions || [])];
        return session;
    },

    pruneFutureUnreachedRevisions(currentState) {
        if (!currentState || !currentState.learningItems || !currentState.revisions) return;

        // Clean up legacy item naming (e.g. subjectName="Intelligence", topicName="Maths")
        currentState.learningItems.forEach(item => {
            if (item.subjectName === "Intelligence" && item.topicName && item.topicName !== "General") {
                item.subjectName = item.topicName;
                item.topicName = "";
                item.title = item.subjectName;
            }
        });

        const validRevisions = [];
        const handledItemIds = new Set();

        currentState.learningItems.forEach(item => {
            handledItemIds.add(item.id);
            const baseDate = DateUtils.parseKey(item.learningDate);
            const itemRevs = currentState.revisions.filter(r => r.learningItemId === item.id);
            const completedRevs = itemRevs.filter(r => r.completedAt);
            const maxCompleted = completedRevs.reduce((max, r) => Math.max(max, r.revisionNumber ?? 0), -1);

            // Keep all completed milestone records
            completedRevs.forEach(r => validRevisions.push(r));

            // Keep ONLY the immediate next uncompleted milestone and align to the exact fixed spaced cycle
            const pendingRevs = itemRevs.filter(r => !r.completedAt).sort((a, b) => (a.revisionNumber ?? 0) - (b.revisionNumber ?? 0));
            if (pendingRevs.length > 0) {
                const nextRev = pendingRevs[0];
                const milestoneNum = nextRev.revisionNumber ?? (maxCompleted + 1);
                nextRev.revisionNumber = milestoneNum;
                if (milestoneNum < SPACING_INTERVALS.length) {
                    const targetDays = SPACING_INTERVALS[milestoneNum];
                    nextRev.scheduledDate = DateUtils.toKey(DateUtils.addDays(baseDate, targetDays));
                }
                validRevisions.push(nextRev);
            }
        });

        // Retain any revisions without learningItem mapping if any
        currentState.revisions.forEach(r => {
            if (!handledItemIds.has(r.learningItemId)) {
                validRevisions.push(r);
            }
        });

        currentState.revisions = validRevisions;
    },

    evaluateStatuses(revisions) {
        const todayKey = DateUtils.toKey();
        (revisions || []).forEach((rev) => {
            if (rev.completedAt) {
                rev.status = "completed";
            } else if (rev.scheduledDate < todayKey) {
                rev.status = "overdue";
            } else if (rev.scheduledDate === todayKey) {
                rev.status = "due_today";
            } else {
                rev.status = "upcoming";
            }
        });
    },

    completeRevision(currentState, revisionId, completionData) {
        const revision = (currentState.revisions || []).find((r) => r.id === revisionId);
        if (!revision) {
            return { success: false, message: "Revision not found." };
        }

        const learningItem = (currentState.learningItems || []).find(i => i.id === revision.learningItemId);
        const score = clampNumber(completionData.recallScore || 3, 1, 5);
        const todayKey = DateUtils.toKey();
        const todayDate = DateUtils.parseKey(todayKey);

        revision.completedAt = new Date().toISOString();
        revision.status = "completed";
        revision.recallScore = score;
        revision.confidence = completionData.confidence || "Medium";
        revision.recallNotes = normalizeRemark(completionData.recallNotes);
        revision.whatForgot = normalizeRemark(completionData.whatForgot);
        revision.updatedAt = new Date().toISOString();

        const currStep = revision.revisionNumber ?? 0;
        const nextStep = currStep + 1;
        let nextDate = null;
        let nextRev = null;

        // Follow the exact 8-step Spaced Revision schedule: [0, 3, 7, 14, 30, 60, 120, 240]
        if (nextStep < SPACING_INTERVALS.length) {
            const baseDate = DateUtils.parseKey(learningItem ? learningItem.learningDate : revision.scheduledDate);
            const targetDays = SPACING_INTERVALS[nextStep]; // e.g. 7 for Milestone 2, 14 for Milestone 3, 30 for Milestone 4...
            let calculatedDate = DateUtils.toKey(DateUtils.addDays(baseDate, targetDays));

            // If calculated milestone date is already past or today, push to future interval
            if (calculatedDate <= todayKey) {
                const intervalFromToday = Math.max(1, SPACING_INTERVALS[nextStep] - SPACING_INTERVALS[currStep]);
                calculatedDate = DateUtils.toKey(DateUtils.addDays(todayDate, intervalFromToday));
            }

            nextDate = calculatedDate;
            revision.nextRevisionDate = nextDate;

            // Check if future uncompleted revision exists for this item
            const existingUpcoming = (currentState.revisions || []).find(
                r => r.learningItemId === revision.learningItemId && !r.completedAt && r.id !== revision.id
            );

            if (existingUpcoming) {
                existingUpcoming.revisionNumber = nextStep;
                existingUpcoming.scheduledDate = nextDate;
                existingUpcoming.status = nextDate === todayKey ? "due_today" : (nextDate < todayKey ? "overdue" : "upcoming");
                existingUpcoming.updatedAt = new Date().toISOString();
                nextRev = existingUpcoming;
            } else {
                nextRev = {
                    id: createId(),
                    learningItemId: revision.learningItemId,
                    revisionNumber: nextStep,
                    scheduledDate: nextDate,
                    completedAt: null,
                    status: nextDate === todayKey ? "due_today" : (nextDate < todayKey ? "overdue" : "upcoming"),
                    recallScore: null,
                    confidence: null,
                    recallNotes: "",
                    whatForgot: "",
                    nextRevisionDate: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                currentState.revisions.push(nextRev);
            }
        }

        const xpEarned = 15;
        const pointsEarned = 10;
        const levelInfo = LevelService.addXp(currentState, xpEarned);
        currentState.points += pointsEarned;

        HistoryService.recordCompletion(currentState.history, todayKey, {
            taskId: `rev-${revision.id}`,
            taskName: `Revision: ${completionData.itemTitle || (learningItem ? learningItem.title : "Learning Item")} (Score: ${score}/5)`,
            category: "intelligence",
            remark: completionData.recallNotes || `Active recall completed with score ${score}/5.`,
            xpEarned,
            pointsEarned,
            streakCount: currentState.streak,
            streakBoostPercent: 0,
            completedAt: new Date().toISOString()
        });

        return {
            success: true,
            score,
            xpEarned,
            pointsEarned,
            nextDate,
            nextMilestoneNumber: nextStep < SPACING_INTERVALS.length ? nextStep : null,
            levelInfo
        };
    },

    getMetrics(revisions) {
        this.evaluateStatuses(revisions);
        const dueToday = (revisions || []).filter((r) => r.status === "due_today").length;
        const overdue = (revisions || []).filter((r) => r.status === "overdue").length;
        const completed = (revisions || []).filter((r) => r.status === "completed").length;
        const completedWithScore = (revisions || []).filter((r) => r.status === "completed" && r.recallScore > 0);
        const avgScore = completedWithScore.length
            ? (completedWithScore.reduce((sum, r) => sum + r.recallScore, 0) / completedWithScore.length).toFixed(1)
            : "--";

        return { dueToday, overdue, completed, avgScore };
    }
};

/* ==============================================================================
   INTERACTIVE CALENDAR SERVICE
   ============================================================================== */
const CalendarService = {
    currentDate: new Date(),
    selectedDateKey: DateUtils.toKey(),
    activeView: "month",
    activeFilter: "all",

    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        const prevBtn = document.getElementById("calPrevBtn");
        const nextBtn = document.getElementById("calNextBtn");
        const todayBtn = document.getElementById("calTodayBtn");
        const jumpInput = document.getElementById("calJumpDate");
        const viewSelector = document.querySelector(".cal-view-selector");
        const filterPills = document.getElementById("calendarFilterPills");

        if (prevBtn) prevBtn.addEventListener("click", () => this.navigate(-1));
        if (nextBtn) nextBtn.addEventListener("click", () => this.navigate(1));
        if (todayBtn) todayBtn.addEventListener("click", () => {
            this.currentDate = new Date();
            this.selectedDateKey = DateUtils.toKey();
            this.render();
        });
        if (jumpInput) jumpInput.addEventListener("change", (e) => {
            if (e.target.value) {
                this.currentDate = DateUtils.parseKey(e.target.value);
                this.selectedDateKey = e.target.value;
                this.render();
            }
        });
        if (viewSelector) viewSelector.addEventListener("click", (e) => {
            const btn = e.target.closest(".cal-view-btn");
            if (btn && btn.dataset.calView) {
                this.activeView = btn.dataset.calView;
                document.querySelectorAll(".cal-view-btn").forEach(b => b.classList.toggle("is-active", b === btn));
                this.render();
            }
        });
        if (filterPills) filterPills.addEventListener("click", (e) => {
            const pill = e.target.closest(".cal-filter-pill");
            if (pill && pill.dataset.filter) {
                this.activeFilter = pill.dataset.filter;
                document.querySelectorAll(".cal-filter-pill").forEach(p => p.classList.toggle("is-active", p === pill));
                this.render();
            }
        });
    },

    navigate(direction) {
        if (this.activeView === "month") {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + direction, 1);
        } else if (this.activeView === "week") {
            this.currentDate = DateUtils.addDays(this.currentDate, direction * 7);
        } else {
            this.currentDate = DateUtils.addDays(this.currentDate, direction);
        }
        this.render();
    },

    getEventsForDate(dateKey, currentState) {
        const events = [];
        const dateObj = DateUtils.parseKey(dateKey);
        const dayName = DateUtils.getDayName(dateObj);

        if (this.activeFilter === "all" || this.activeFilter === "revisions") {
            (currentState.revisions || []).forEach(rev => {
                if (rev.scheduledDate === dateKey) {
                    const item = (currentState.learningItems || []).find(i => i.id === rev.learningItemId);
                    let revDisplayTitle = `Revision #${rev.revisionNumber}`;
                    if (item) {
                        if (item.topicName && item.topicName !== "General" && item.topicName.toLowerCase() !== item.subjectName.toLowerCase()) {
                            revDisplayTitle = `Rev: ${item.subjectName} (${item.topicName})`;
                        } else {
                            revDisplayTitle = `Rev: ${item.title}`;
                        }
                    }

                    events.push({
                        type: "revision",
                        id: rev.id,
                        revisionId: rev.id,
                        learningItemId: rev.learningItemId,
                        title: revDisplayTitle,
                        itemTitle: item ? item.title : "Learning Item",
                        subject: item ? item.subjectName : "",
                        topic: item ? item.topicName : "",
                        status: rev.status,
                        isCompleted: Boolean(rev.completedAt),
                        isOverdue: rev.status === "overdue",
                        isDueToday: rev.status === "due_today",
                        dateKey
                    });
                }
            });
        }

        if (this.activeFilter === "all" || this.activeFilter === "tasks") {
            (currentState.tasks || []).forEach(task => {
                if (task.scheduledDays.includes(dayName)) {
                    const isCompleted = task.completedDates.includes(dateKey);
                    events.push({
                        type: "task",
                        id: task.id,
                        taskId: task.id,
                        title: task.name,
                        category: task.category,
                        isCompleted,
                        dateKey
                    });
                }
            });
        }

        if (this.activeFilter === "all" || this.activeFilter === "sessions") {
            (currentState.sessions || []).forEach(session => {
                const sessionDateKey = DateUtils.toKey(new Date(session.startTime));
                if (sessionDateKey === dateKey) {
                    events.push({
                        type: "session",
                        id: session.id,
                        sessionId: session.id,
                        title: session.title,
                        sessionType: session.sessionType,
                        duration: session.duration,
                        dateKey
                    });
                }
            });
        }

        return events;
    },

    render() {
        const monthLabel = document.getElementById("calendarMonthLabel");
        const container = document.getElementById("calendarViewContainer");
        if (!container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(this.currentDate);

        if (monthLabel) {
            if (this.activeView === "month") {
                monthLabel.textContent = monthName;
            } else if (this.activeView === "week") {
                const weekStart = DateUtils.getWeekStart(this.currentDate);
                monthLabel.textContent = `Week of ${DateUtils.formatLongDate(weekStart)}`;
            } else if (this.activeView === "day") {
                monthLabel.textContent = `${DateUtils.getDayName(this.currentDate)}, ${DateUtils.formatLongDate(this.currentDate)}`;
            } else {
                monthLabel.textContent = `Agenda: ${monthName}`;
            }
        }

        if (this.activeView === "month") {
            this.renderMonthView(container, year, month);
        } else if (this.activeView === "week") {
            this.renderWeekView(container);
        } else if (this.activeView === "day") {
            this.renderDayView(container);
        } else {
            this.renderAgendaView(container);
        }
    },

    renderMonthView(container, year, month) {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        const totalDays = lastDayOfMonth.getDate();
        const todayKey = DateUtils.toKey();

        if (!this.selectedDateKey) {
            this.selectedDateKey = todayKey;
        }

        const weekdayHeaders = [
            { full: "Monday", short: "Mon", initial: "M" },
            { full: "Tuesday", short: "Tue", initial: "T" },
            { full: "Wednesday", short: "Wed", initial: "W" },
            { full: "Thursday", short: "Thu", initial: "T" },
            { full: "Friday", short: "Fri", initial: "F" },
            { full: "Saturday", short: "Sat", initial: "S" },
            { full: "Sunday", short: "Sun", initial: "S" }
        ];

        let cellsHtml = weekdayHeaders.map(d => `
            <div class="calendar-weekday-head" title="${d.full}">
                <span class="desktop-name">${d.short}</span>
                <span class="mobile-name">${d.initial}</span>
            </div>
        `).join("");

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            const padDate = new Date(year, month - 1, dayNum);
            const padDateKey = DateUtils.toKey(padDate);
            const isPast = padDateKey < todayKey;
            const events = this.getEventsForDate(padDateKey, state);
            cellsHtml += this.renderDayCell(dayNum, padDateKey, true, false, isPast, events);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, month, day);
            const dateKey = DateUtils.toKey(dateObj);
            const isToday = dateKey === todayKey;
            const isPast = dateKey < todayKey;
            const events = this.getEventsForDate(dateKey, state);
            cellsHtml += this.renderDayCell(day, dateKey, false, isToday, isPast, events);
        }

        const totalCellsSoFar = startDayIndex + totalDays;
        const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
        for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
            const nextDate = new Date(year, month + 1, nextDay);
            const nextDateKey = DateUtils.toKey(nextDate);
            const isPast = nextDateKey < todayKey;
            const events = this.getEventsForDate(nextDateKey, state);
            cellsHtml += this.renderDayCell(nextDay, nextDateKey, true, false, isPast, events);
        }

        const selectedPanelHtml = this.renderSelectedDayPanel(this.selectedDateKey);

        container.innerHTML = `
            <div class="calendar-month-grid">${cellsHtml}</div>
            ${selectedPanelHtml}
        `;
        this.attachCalendarClickHandlers(container);
    },

    renderDayCell(dayNum, dateKey, isOtherMonth, isToday, isPast, events) {
        const isSelected = dateKey === this.selectedDateKey;
        const classes = [
            "calendar-day-cell",
            isOtherMonth ? "is-other-month" : "",
            isToday ? "is-today" : "",
            isSelected ? "is-selected" : "",
            isPast ? "is-past" : ""
        ].filter(Boolean).join(" ");

        const maxChips = 3;
        const visibleEvents = events.slice(0, maxChips);
        const overflowCount = events.length - maxChips;

        const chipsHtml = visibleEvents.map(evt => {
            let typeClass = `type-${evt.type}`;
            let statusClass = evt.type === "revision" ? `status-${evt.status}` : "";
            let completedClass = evt.isCompleted ? "is-completed" : "";
            let pastClass = isPast && !evt.isCompleted ? "is-past" : "";
            let checkmark = evt.isCompleted ? "✓ " : "";
            let dotColor = evt.isCompleted ? "#89d36b" : (evt.type === "revision" ? (evt.isOverdue ? "#ff6b6b" : "#ff8e63") : (isPast ? "#8a9aa8" : "#7ec8ff"));

            return `
                <div class="cal-event-chip ${typeClass} ${statusClass} ${completedClass} ${pastClass}" data-event-type="${evt.type}" data-event-id="${evt.id}" title="${escapeHTML(evt.title)}">
                    <span class="chip-dot" style="background:${dotColor}"></span>
                    <span class="chip-text ${completedClass}">${checkmark}${escapeHTML(evt.title)}</span>
                </div>
            `;
        }).join("");

        const overflowHtml = overflowCount > 0 ? `<div class="cal-day-dot-count">+${overflowCount} more</div>` : "";

        // Mobile dots row (clean colored dot indicators for phone screens)
        const mobileDots = events.slice(0, 3).map(evt => {
            let dotColor = evt.isCompleted ? "#89d36b" : (evt.type === "revision" ? (evt.isOverdue ? "#ff6b6b" : "#ff8e63") : (evt.type === "session" ? "#ffd263" : (isPast ? "#8a9aa8" : "#7ec8ff")));
            return `<span class="cal-mobile-dot" style="background:${dotColor};"></span>`;
        }).join("");

        const mobileMore = events.length > 3 ? `<span class="cal-mobile-more">+</span>` : "";

        return `
            <div class="${classes}" data-date-key="${dateKey}">
                <div class="cal-day-top">
                    <span class="cal-day-number">${dayNum}</span>
                    ${events.length > 0 ? `<span class="cal-day-dot-count">${events.length}</span>` : ""}
                </div>
                <div class="cal-mobile-dots-row">
                    ${mobileDots}
                    ${mobileMore}
                </div>
                <div class="cal-day-events-stack">
                    ${chipsHtml}
                    ${overflowHtml}
                </div>
            </div>
        `;
    },

    renderSelectedDayPanel(dateKey) {
        const selectedDate = DateUtils.parseKey(dateKey);
        const dayName = DateUtils.getDayName(selectedDate);
        const formattedDate = DateUtils.formatLongDate(selectedDate);
        const todayKey = DateUtils.toKey();
        const isToday = dateKey === todayKey;
        const isPast = dateKey < todayKey;
        const events = this.getEventsForDate(dateKey, state);

        let badgeLabel = isToday ? "Today" : (isPast ? "Past Date" : "Upcoming");
        let badgeClass = isToday ? "today" : (isPast ? "past" : "upcoming");

        let eventsHtml = "";
        if (events.length > 0) {
            eventsHtml = events.map(evt => {
                const isCompleted = evt.isCompleted;
                const pastUndone = isPast && !isCompleted;
                let typeColor = evt.type === "revision" ? (evt.isOverdue ? "#ff6b6b" : "#ff8e63") : (evt.type === "task" ? "#7ec8ff" : "#ffd263");
                let typeLabel = evt.type === "revision" ? (evt.isOverdue ? "Overdue Revision" : "Revision") : (evt.type === "task" ? (evt.category ? `${evt.category.toUpperCase()} TASK` : "TASK") : "STUDY SESSION");
                let subtitle = "";
                if (evt.type === "revision") {
                    subtitle = `${evt.subject ? `Subject: ${evt.subject}` : ''} ${evt.topic ? `• Topic: ${evt.topic}` : ''}`;
                } else if (evt.type === "task") {
                    const catLabel = evt.category ? (evt.category.charAt(0).toUpperCase() + evt.category.slice(1)) : 'General';
                    subtitle = `Scheduled Task • ${catLabel}`;
                } else if (evt.type === "session") {
                    subtitle = `Study Session • ${evt.duration} minutes`;
                }

                return `
                    <article class="cal-selected-event-card ${isCompleted ? 'is-completed' : ''} ${pastUndone ? 'is-past-undone' : ''}" data-event-type="${evt.type}" data-event-id="${evt.id}">
                        <div class="cal-selected-event-indicator" style="background:${typeColor};"></div>
                        <div class="cal-selected-event-content">
                            <div class="cal-selected-event-header">
                                <span class="cal-event-pill" style="color:${typeColor}; border-color:${typeColor}44; background:${typeColor}18;">${typeLabel}</span>
                                ${isCompleted ? '<span class="status-badge completed">✓ Completed</span>' : (evt.status ? `<span class="status-badge ${evt.status.replace('_', '-')}">${evt.status.replace('_', ' ')}</span>` : '')}
                            </div>
                            <h4 class="cal-selected-event-title ${isCompleted ? 'is-completed' : ''}">${isCompleted ? '✓ ' : ''}${escapeHTML(evt.title)}</h4>
                            ${subtitle ? `<p class="cal-selected-event-sub">${escapeHTML(subtitle)}</p>` : ''}
                        </div>
                        <div class="cal-selected-event-actions">
                            ${evt.type === 'revision' && !isCompleted ? `<button type="button" class="primary-button cal-action-btn" data-action="open-recall" data-revision-id="${evt.id}">Active Recall</button>` : ''}
                            ${evt.type === 'task' ? `<button type="button" class="ghost-button cal-action-btn" data-action="go-task" data-task-id="${evt.id}">View Task</button>` : ''}
                        </div>
                    </article>
                `;
            }).join("");
        } else {
            eventsHtml = `
                <div class="cal-selected-empty">
                    <p>No tasks, revisions, or sessions scheduled for ${isToday ? 'today' : formattedDate}.</p>
                    <div class="cal-empty-actions">
                        <a href="#/tasks" class="ghost-button" style="min-height:36px; padding:0 14px; font-size:0.8rem;">+ Go to Tasks</a>
                        <button type="button" class="primary-button" style="min-height:36px; padding:0 14px; font-size:0.8rem;" id="calQuickAddLearningBtn">+ New Learning Item</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="cal-selected-day-panel" id="calSelectedDayPanel">
                <div class="cal-selected-panel-header">
                    <div class="cal-selected-date-info">
                        <span class="cal-selected-badge ${badgeClass}">${badgeLabel}</span>
                        <h3 class="cal-selected-heading">${dayName}, ${formattedDate}</h3>
                    </div>
                    <div class="cal-selected-count-tag">${events.length} event${events.length === 1 ? '' : 's'}</div>
                </div>
                <div class="cal-selected-cards-stack">
                    ${eventsHtml}
                </div>
            </div>
        `;
    },

    renderWeekView(container) {
        const weekStart = DateUtils.getWeekStart(this.currentDate);
        const todayKey = DateUtils.toKey();
        let colsHtml = "";

        for (let i = 0; i < 7; i++) {
            const dateObj = DateUtils.addDays(weekStart, i);
            const dateKey = DateUtils.toKey(dateObj);
            const isPast = dateKey < todayKey;
            const isToday = dateKey === todayKey;
            const events = this.getEventsForDate(dateKey, state);

            const eventsMarkup = events.length ? events.map(evt => `
                <div class="cal-day-event-card ${evt.isCompleted ? 'is-completed' : ''} ${isPast && !evt.isCompleted ? 'is-past' : ''}" style="padding:10px 12px; ${evt.isCompleted ? 'opacity:0.55;' : (isPast ? 'opacity:0.4;' : '')}" data-event-type="${evt.type}" data-event-id="${evt.id}">
                    <div>
                        <strong style="font-size:0.88rem; display:block; ${evt.isCompleted ? 'text-decoration:line-through; color:#a8d59b;' : ''}">${evt.isCompleted ? '✓ ' : ''}${escapeHTML(evt.title)}</strong>
                        <span class="section-note" style="font-size:0.75rem;">${evt.type.toUpperCase()} • ${evt.isCompleted ? 'Completed' : (evt.status || 'Scheduled')}</span>
                    </div>
                </div>
            `).join("") : `<div class="task-category-empty" style="padding:12px; font-size:0.8rem;">No events</div>`;

            colsHtml += `
                <div class="calendar-week-col ${isToday ? 'is-today' : ''} ${isPast ? 'is-past' : ''}" data-date-key="${dateKey}">
                    <div class="calendar-week-head">
                        <span class="week-day-name">${DateUtils.getShortDay(DateUtils.getDayName(dateObj))}</span>
                        <span class="week-day-num">${dateObj.getDate()}</span>
                    </div>
                    <div class="cal-day-events-stack">
                        ${eventsMarkup}
                    </div>
                </div>
            `;
        }

        container.innerHTML = `<div class="calendar-week-grid">${colsHtml}</div>`;
        this.attachCalendarClickHandlers(container);
    },

    renderDayView(container) {
        const dateKey = DateUtils.toKey(this.currentDate);
        const events = this.getEventsForDate(dateKey, state);
        const dayName = DateUtils.getDayName(this.currentDate);

        const isPast = dateKey < DateUtils.toKey();
        const eventsHtml = events.length ? events.map(evt => `
            <article class="cal-day-event-card ${evt.isCompleted ? 'is-completed' : ''} ${isPast && !evt.isCompleted ? 'is-past' : ''}" style="${evt.isCompleted ? 'opacity:0.55;' : (isPast ? 'opacity:0.45;' : '')}" data-event-type="${evt.type}" data-event-id="${evt.id}">
                <div class="cal-day-event-main">
                    <div class="cal-day-event-title-row">
                        <h4 class="cal-day-event-title" style="${evt.isCompleted ? 'text-decoration:line-through; color:#a8d59b;' : ''}">${evt.isCompleted ? '✓ ' : ''}${escapeHTML(evt.title)}</h4>
                        <span class="task-tag">${evt.type.toUpperCase()}</span>
                        ${evt.isCompleted ? '<span class="status-badge completed">Completed</span>' : (evt.status ? `<span class="status-badge ${evt.status.replace('_', '-')}">${evt.status.replace('_', ' ')}</span>` : "")}
                    </div>
                    <p class="section-note">${evt.subject ? `Subject: ${evt.subject}` : ''} ${evt.topic ? `• Topic: ${evt.topic}` : ''}</p>
                </div>
                <div>
                    ${evt.type === 'revision' && !evt.isCompleted ? `<button type="button" class="primary-button" style="min-height:36px; padding:0 14px; font-size:0.82rem;" data-action="open-recall" data-revision-id="${evt.id}">Active Recall</button>` : ''}
                </div>
            </article>
        `).join("") : `<div class="empty-state"><h3>No events on this day</h3><p>Select another day or add tasks and learning items.</p></div>`;

        container.innerHTML = `
            <div class="calendar-day-view">
                <div class="cal-day-detail-head">
                    <div>
                        <strong style="font-size:1.2rem;">${dayName}, ${DateUtils.formatLongDate(this.currentDate)}</strong>
                        <p class="section-note" style="margin:4px 0 0;">${events.length} event${events.length === 1 ? '' : 's'} scheduled</p>
                    </div>
                </div>
                <div class="cal-day-cards-list">
                    ${eventsHtml}
                </div>
            </div>
        `;
        this.attachCalendarClickHandlers(container);
    },

    renderAgendaView(container) {
        const today = new Date();
        const todayKey = DateUtils.toKey(today);
        const overdueRevisions = (state.revisions || []).filter(r => r.status === "overdue" && !r.completedAt);

        let agendaHtml = "";

        if (overdueRevisions.length > 0) {
            agendaHtml += `
                <div class="agenda-overdue-box">
                    <p class="eyebrow" style="color:#ff6b6b; margin-bottom:8px;">Overdue Revisions (${overdueRevisions.length})</p>
                    <div class="cal-day-cards-list">
                        ${overdueRevisions.map(rev => {
                            const item = (state.learningItems || []).find(i => i.id === rev.learningItemId);
                            return `
                                <div class="cal-day-event-card" style="border-color:rgba(255,107,107,0.3);" data-event-type="revision" data-event-id="${rev.id}">
                                    <div>
                                        <strong>${item ? escapeHTML(item.title) : 'Learning Item'}</strong>
                                        <p class="section-note" style="color:#ff9d9d; margin:4px 0 0;">Due since ${rev.scheduledDate} • Revision #${rev.revisionNumber}</p>
                                    </div>
                                    <button type="button" class="primary-button" style="min-height:36px; padding:0 14px; font-size:0.82rem;" data-action="open-recall" data-revision-id="${rev.id}">Review Now</button>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        }

        for (let i = 0; i < 14; i++) {
            const dateObj = DateUtils.addDays(today, i);
            const dateKey = DateUtils.toKey(dateObj);
            const events = this.getEventsForDate(dateKey, state);

            if (events.length > 0) {
                agendaHtml += `
                    <div class="agenda-section">
                        <h4 class="agenda-section-title">${dateKey === todayKey ? 'Today • ' : ''}${DateUtils.getDayName(dateObj)}, ${DateUtils.formatLongDate(dateObj)} (${events.length})</h4>
                        <div class="cal-day-cards-list">
                            ${events.map(evt => `
                                <div class="cal-day-event-card ${evt.isCompleted ? 'is-completed' : ''}" style="${evt.isCompleted ? 'opacity:0.55;' : ''}" data-event-type="${evt.type}" data-event-id="${evt.id}">
                                    <div class="cal-day-event-main">
                                        <div class="cal-day-event-title-row">
                                            <strong style="${evt.isCompleted ? 'text-decoration:line-through; color:#a8d59b;' : ''}">${evt.isCompleted ? '✓ ' : ''}${escapeHTML(evt.title)}</strong>
                                            <span class="task-tag">${evt.type.toUpperCase()}</span>
                                            ${evt.isCompleted ? '<span class="status-badge completed">Completed</span>' : ''}
                                        </div>
                                    </div>
                                    ${evt.type === 'revision' && !evt.isCompleted ? `<button type="button" class="primary-button" style="min-height:34px; padding:0 12px; font-size:0.8rem;" data-action="open-recall" data-revision-id="${evt.id}">Recall</button>` : ''}
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `;
            }
        }

        if (!agendaHtml) {
            agendaHtml = `<div class="empty-state"><h3>No upcoming agenda items</h3><p>Create tasks or learning items to see them here.</p></div>`;
        }

        container.innerHTML = `<div class="calendar-agenda-view">${agendaHtml}</div>`;
        this.attachCalendarClickHandlers(container);
    },

    attachCalendarClickHandlers(container) {
        container.querySelectorAll("[data-action='open-recall']").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                openActiveRecallModal(btn.dataset.revisionId);
            });
        });

        container.querySelectorAll("[data-action='go-task']").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.taskId;
                const task = state.tasks.find(t => t.id === taskId);
                if (task) {
                    highlightedTaskId = task.id;
                    selectedDay = task.scheduledDays[0] || DateUtils.getDayName();
                    window.location.hash = "#/tasks";
                    renderApp();
                }
            });
        });

        const quickAddBtn = container.querySelector("#calQuickAddLearningBtn");
        if (quickAddBtn) {
            quickAddBtn.addEventListener("click", () => {
                openLearningItemModal();
            });
        }

        container.querySelectorAll(".cal-event-chip, .cal-day-event-card, .cal-selected-event-card").forEach(el => {
            el.addEventListener("click", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                const eventType = el.dataset.eventType;
                const eventId = el.dataset.eventId;
                if (eventType === "revision") {
                    openActiveRecallModal(eventId);
                } else if (eventType === "task") {
                    const task = state.tasks.find(t => t.id === eventId);
                    if (task) {
                        highlightedTaskId = task.id;
                        selectedDay = task.scheduledDays[0] || DateUtils.getDayName();
                        window.location.hash = "#/tasks";
                        renderApp();
                    }
                }
            });
        });

        container.querySelectorAll(".calendar-day-cell").forEach(cell => {
            cell.addEventListener("click", (e) => {
                if (e.target.closest(".cal-event-chip")) return;
                const dateKey = cell.dataset.dateKey;
                if (dateKey) {
                    this.selectedDateKey = dateKey;
                    container.querySelectorAll(".calendar-day-cell").forEach(c => {
                        c.classList.toggle("is-selected", c.dataset.dateKey === dateKey);
                    });
                    const panel = container.querySelector("#calSelectedDayPanel");
                    if (panel) {
                        panel.outerHTML = this.renderSelectedDayPanel(dateKey);
                        this.attachCalendarClickHandlers(container);
                    }
                }
            });
        });
    }
};

/* ==============================================================================
   EXISTING CORE SERVICES (HISTORY, LEVEL, TASK)
   ============================================================================== */
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
            pointsEarned: completionData.pointsEarned,
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
        const safeLevel = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL);
        const rank = this.getRank(safeLevel);

        if (safeLevel >= MAX_LEVEL) {
            return `${rank.code} ${rank.title}`;
        }

        const levelSpan = Math.max(1, rank.max - rank.min + 1);
        const offset = safeLevel - rank.min;
        const subRank = Math.min(10, Math.max(1, 1 + Math.floor((offset / levelSpan) * 10)));
        const formattedSubRank = String(subRank).padStart(2, "0");

        return `${rank.code}${formattedSubRank} ${rank.title}`;
    },

    getArc(level) {
        const safeLevel = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL);
        return LEVEL_ARCS.find((arc) => safeLevel >= arc.min && safeLevel <= arc.max) || LEVEL_ARCS[0];
    },

    getArcTitle(level) {
        return this.getArc(level).title;
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

    subtractXp(currentState, amount) {
        let remainingPenalty = Math.max(0, Math.floor(Number(amount) || 0));
        let nextLevel = Math.min(Math.max(Math.floor(currentState.level || 1), 1), MAX_LEVEL);
        let nextXp = Math.max(0, Math.floor(currentState.xp || 0));

        while (remainingPenalty > 0 && (nextLevel > 1 || nextXp > 0)) {
            if (nextXp >= remainingPenalty) {
                nextXp -= remainingPenalty;
                remainingPenalty = 0;
            } else {
                remainingPenalty -= nextXp;
                if (nextLevel === 1) {
                    nextXp = 0;
                    remainingPenalty = 0;
                } else {
                    nextLevel -= 1;
                    nextXp = this.getThreshold(nextLevel);
                }
            }
        }

        currentState.level = nextLevel;
        currentState.xp = nextXp;

        return {
            xpLost: Math.max(0, Math.floor(Number(amount) || 0)) - remainingPenalty,
            newLevel: nextLevel,
            currentXp: nextXp
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

    getPreviousScheduledKey(task, dateKey) {
        let cursor = DateUtils.addDays(DateUtils.parseKey(dateKey), -1);

        for (let offset = 0; offset < 14; offset += 1) {
            const cursorDay = DateUtils.getDayName(cursor);
            if (task.scheduledDays.includes(cursorDay)) {
                return DateUtils.toKey(cursor);
            }
            cursor = DateUtils.addDays(cursor, -1);
        }

        return "";
    },

    getStreakBefore(task, referenceKey = DateUtils.toKey()) {
        let streak = 0;
        let cursorKey = this.getPreviousScheduledKey(task, referenceKey);

        while (cursorKey && task.completedDates.includes(cursorKey)) {
            streak += 1;
            cursorKey = this.getPreviousScheduledKey(task, cursorKey);
        }

        return streak;
    },

    getStreakThrough(task, referenceKey = DateUtils.toKey()) {
        if (!task.completedDates.includes(referenceKey)) {
            return this.getStreakBefore(task, referenceKey);
        }

        return this.getStreakBefore(task, referenceKey) + 1;
    },

    completeTask(currentState, taskId, remark = "", lesson = "") {
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
        const streakBefore = this.getStreakBefore(task, todayKey);
        const streakBoostPercent = Math.max(0, Math.floor(Number(task.streakBoostPercent) || 0));
        const streakBoostTotalPercent = streakBefore * streakBoostPercent;
        const rewardPoints = Math.max(1, Math.floor(Number(task.rewardPoints) || DEFAULT_TASK_REWARD_POINTS));
        const streakMultiplier = 1 + (streakBoostTotalPercent / 100);
        const baseXpAwarded = Math.max(BASE_TASK_XP, Math.floor(BASE_TASK_XP * streakMultiplier));
        const basePointsAwarded = Math.max(rewardPoints, Math.floor(rewardPoints * streakMultiplier));

        task.completedDates = uniqueValues([...task.completedDates, todayKey]).sort();

        let xpAwarded = baseXpAwarded;
        let pointsAwarded = basePointsAwarded;
        let bonusAwarded = false;

        if (task.repeatType === "weekly" && weeklyCountBefore < task.targetPerWeek) {
            const weeklyCountAfter = this.getRollingWeeklyCount(task, todayKey);
            if (weeklyCountAfter >= task.targetPerWeek) {
                xpAwarded += WEEKLY_TARGET_BONUS_XP;
                pointsAwarded += WEEKLY_TARGET_BONUS_POINTS;
                bonusAwarded = true;
            }
        }

        const levelInfo = LevelService.addXp(currentState, xpAwarded);
        currentState.points += pointsAwarded;

        const loggedTaskName = lesson ? `${task.name} (${lesson})` : task.name;
        HistoryService.recordCompletion(currentState.history, todayKey, {
            taskId: task.id,
            taskName: loggedTaskName,
            category: task.category,
            remark,
            xpEarned: xpAwarded,
            pointsEarned: pointsAwarded,
            streakCount: streakBefore + 1,
            streakBoostPercent: streakBoostTotalPercent,
            completedAt: new Date().toISOString()
        });
        currentState.history = HistoryService.ensureUpToToday(currentState.history);
        currentState.streak = HistoryService.computeCurrentStreak(currentState.history);

        let revisionInfo = null;
        if (task.category === "intelligence") {
            const subjectName = task.name;
            const topicName = lesson || task.name;
            const itemTitle = lesson && lesson.toLowerCase() !== task.name.toLowerCase() ? `${task.name} - ${lesson}` : task.name;

            // Search for existing learning item matching this subject and lesson
            const existingItem = (currentState.learningItems || []).find(
                (i) => (i.subjectName.toLowerCase() === subjectName.toLowerCase() && i.topicName.toLowerCase() === topicName.toLowerCase()) ||
                       i.title.toLowerCase() === itemTitle.toLowerCase()
            );

            if (!existingItem) {
                const { learningItem, revisions } = RevisionService.createLearningItem(currentState, {
                    title: itemTitle,
                    subjectName,
                    topicName,
                    learningDate: todayKey,
                    whatLearned: remark || `${itemTitle} completed on Task Board.`,
                    keyConcepts: `Concepts and problems practiced in ${itemTitle}`,
                    importantPoints: remark || "Completed from Task Board",
                    notes: remark || "Enrolled into Spaced Revision schedule",
                    confidence: 3
                });

                const nextRev = revisions.find(r => !r.completedAt);
                revisionInfo = {
                    enrolled: true,
                    lessonName: topicName,
                    nextDate: nextRev ? nextRev.scheduledDate : null
                };
            } else {
                const dueRev = (currentState.revisions || []).find(
                    (r) => r.learningItemId === existingItem.id && !r.completedAt && r.scheduledDate <= todayKey
                );
                if (dueRev) {
                    const revResult = RevisionService.completeRevision(currentState, dueRev.id, {
                        recallScore: 4,
                        confidence: "High",
                        recallNotes: remark || "Completed via task board",
                        whatForgot: "",
                        itemTitle: existingItem.title
                    });
                    revisionInfo = {
                        completedRevNumber: dueRev.revisionNumber,
                        nextMilestoneName: revResult.nextMilestoneNumber !== null ? `Day ${SPACING_INTERVALS[revResult.nextMilestoneNumber]}` : "Mastered",
                        nextDate: revResult.nextDate
                    };
                }
            }
        }

        return {
            success: true,
            taskName: loggedTaskName,
            category: task.category,
            xpAwarded,
            pointsAwarded,
            bonusAwarded,
            streakCount: streakBefore + 1,
            streakBoostPercent: streakBoostTotalPercent,
            levelInfo,
            revisionInfo
        };
    }
};

/* ==============================================================================
   SPA ROUTER & VIEW NAVIGATION SERVICE
   ============================================================================== */
const RouterService = {
    validRoutes: ["dashboard", "tasks", "calendar", "revision", "stats", "rewards", "settings"],
    currentRoute: "dashboard",

    init() {
        window.addEventListener("hashchange", () => this.handleHashChange());
        document.addEventListener("click", (e) => this.handleLinkClick(e));
        this.handleHashChange();
    },

    getRouteFromHash() {
        const hash = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
        return this.validRoutes.includes(hash) ? hash : "dashboard";
    },

    handleHashChange() {
        const route = this.getRouteFromHash();
        this.navigateTo(route, false);
    },

    handleLinkClick(e) {
        const anchor = e.target.closest("a[href^='#/'], a[href^='#']");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (href && (href.startsWith("#/") || href.startsWith("#"))) {
            const raw = href.replace(/^#\/?/, "").trim().toLowerCase();
            if (this.validRoutes.includes(raw)) {
                e.preventDefault();
                this.navigateTo(raw, true);
            }
        }
    },

    navigateTo(route, updateHash = true) {
        if (!this.validRoutes.includes(route)) route = "dashboard";
        this.currentRoute = route;

        if (updateHash && window.location.hash !== `#/${route}`) {
            window.location.hash = `#/${route}`;
        }

        // Update Nav Tabs
        document.querySelectorAll(".nav-item").forEach(item => {
            const isActive = item.dataset.view === route;
            item.classList.toggle("is-active", isActive);
            item.setAttribute("aria-current", isActive ? "page" : "false");
        });

        // Switch View Pages
        document.querySelectorAll(".view-page").forEach(page => {
            const isActive = page.dataset.view === route;
            page.classList.toggle("is-active", isActive);
        });

        // Scroll smoothly to top of view
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Trigger view-specific re-renders
        if (route === "calendar" && CalendarService) {
            CalendarService.render();
        } else if (route === "stats") {
            renderDashboard();
        } else if (route === "revision") {
            renderRevisionPanel();
        } else if (route === "tasks") {
            renderTaskBoard();
        } else if (route === "rewards") {
            renderRewards();
        } else if (route === "dashboard") {
            renderHero();
            renderInsights();
        }
    }
};

/* ==============================================================================
   APPLICATION STATE & ELEMENTS
   ============================================================================== */
const state = Storage.loadState();
let selectedDay = DateUtils.getDayName();
let highlightedTaskId = "";
let toastTimer = 0;
let levelUpTimer = 0;
let autoLockTimer = 0;
let pendingCompletionTaskId = "";
let editingTaskId = "";
let activeRevTab = "due";
let activeRecallRevisionId = "";
let selectedRecallScore = 3;

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
    completionLessonField: document.getElementById("completionLessonField"),
    completionLesson: document.getElementById("completionLesson"),
    completionRemark: document.getElementById("completionRemark"),
    completionCancelBtn: document.getElementById("completionCancelBtn"),
    topbar: document.getElementById("topbar"),
    appNav: document.getElementById("appNav"),
    navRevBadge: document.getElementById("navRevBadge"),
    levelBadge: document.getElementById("levelBadge"),
    todayLabel: document.getElementById("todayLabel"),
    heroStreak: document.getElementById("heroStreak"),
    heroFocus: document.getElementById("heroFocus"),
    heroPoints: document.getElementById("heroPoints"),
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
    taskRewardPoints: document.getElementById("taskRewardPoints"),
    taskStreakBoost: document.getElementById("taskStreakBoost"),
    taskSubmitButton: document.getElementById("taskSubmitButton"),
    taskCancelEditBtn: document.getElementById("taskCancelEditBtn"),
    daySelector: document.getElementById("daySelector"),
    motivationMessage: document.getElementById("motivationMessage"),
    dailyLineDate: document.getElementById("dailyLineDate"),
    dailyLineText: document.getElementById("dailyLineText"),
    todayCompletedCount: document.getElementById("todayCompletedCount"),
    todayXpCount: document.getElementById("todayXpCount"),
    weeklyGoalsHit: document.getElementById("weeklyGoalsHit"),
    rewardForm: document.getElementById("rewardForm"),
    rewardName: document.getElementById("rewardName"),
    rewardCost: document.getElementById("rewardCost"),
    rewardPointsBalance: document.getElementById("rewardPointsBalance"),
    rewardList: document.getElementById("rewardList"),
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
    levelUpText: document.getElementById("levelUpText"),

    // Supabase
    supabaseStatusBtn: document.getElementById("supabaseStatusBtn"),
    supabaseModal: document.getElementById("supabaseModal"),
    supabaseCloseBtn: document.getElementById("supabaseCloseBtn"),
    forceSyncBtn: document.getElementById("forceSyncBtn"),
    startMigrationBtn: document.getElementById("startMigrationBtn"),

    // Settings page buttons
    settingsSyncBtn: document.getElementById("settingsSyncBtn"),
    lockNowBtn: document.getElementById("lockNowBtn"),

    // Revision Panel & Modals
    revMetricDueToday: document.getElementById("revMetricDueToday"),
    revMetricOverdue: document.getElementById("revMetricOverdue"),
    revMetricCompleted: document.getElementById("revMetricCompleted"),
    revMetricAvgScore: document.getElementById("revMetricAvgScore"),
    revisionNavTabs: document.getElementById("revisionNavTabs"),
    badgeDueCount: document.getElementById("badgeDueCount"),
    badgeOverdueCount: document.getElementById("badgeOverdueCount"),
    badgeUpcomingCount: document.getElementById("badgeUpcomingCount"),
    badgeCompletedCount: document.getElementById("badgeCompletedCount"),
    badgeLibraryCount: document.getElementById("badgeLibraryCount"),
    revisionQueueList: document.getElementById("revisionQueueList"),
    openStudySessionModalBtn: document.getElementById("openStudySessionModalBtn"),
    openLearningItemModalBtn: document.getElementById("openLearningItemModalBtn"),

    // Active Recall Modal
    activeRecallModal: document.getElementById("activeRecallModal"),
    recallRevisionBadge: document.getElementById("recallRevisionBadge"),
    recallSubjectTag: document.getElementById("recallSubjectTag"),
    recallTopicTag: document.getElementById("recallTopicTag"),
    recallItemTitle: document.getElementById("recallItemTitle"),
    recallLearningDate: document.getElementById("recallLearningDate"),
    recallStep1: document.getElementById("recallStep1"),
    recallStep2: document.getElementById("recallStep2"),
    recallMemoryInput: document.getElementById("recallMemoryInput"),
    recallCancelBtn: document.getElementById("recallCancelBtn"),
    recallRevealBtn: document.getElementById("recallRevealBtn"),
    revealWhatLearnedText: document.getElementById("revealWhatLearnedText"),
    revealKeyConceptsText: document.getElementById("revealKeyConceptsText"),
    revealImportantPointsText: document.getElementById("revealImportantPointsText"),
    revealNotesText: document.getElementById("revealNotesText"),
    recallScoreGrid: document.getElementById("recallScoreGrid"),
    recallConfidence: document.getElementById("recallConfidence"),
    recallWhatForgot: document.getElementById("recallWhatForgot"),
    recallSessionNotes: document.getElementById("recallSessionNotes"),
    recallBackToPromptBtn: document.getElementById("recallBackToPromptBtn"),
    recallSaveBtn: document.getElementById("recallSaveBtn"),

    // Learning Item / Session Modal
    learningItemModal: document.getElementById("learningItemModal"),
    learningItemForm: document.getElementById("learningItemForm"),
    sessionTypeSelect: document.getElementById("sessionTypeSelect"),
    itemLearningDate: document.getElementById("itemLearningDate"),
    itemTitle: document.getElementById("itemTitle"),
    itemSubject: document.getElementById("itemSubject"),
    itemTopic: document.getElementById("itemTopic"),
    itemSubtopic: document.getElementById("itemSubtopic"),
    itemWhatLearned: document.getElementById("itemWhatLearned"),
    itemKeyConcepts: document.getElementById("itemKeyConcepts"),
    itemImportantPoints: document.getElementById("itemImportantPoints"),
    itemQuestionsAttempted: document.getElementById("itemQuestionsAttempted"),
    itemQuestionsCorrect: document.getElementById("itemQuestionsCorrect"),
    itemConfidence: document.getElementById("itemConfidence"),
    itemNotes: document.getElementById("itemNotes"),
    learningFieldsContainer: document.getElementById("learningFieldsContainer"),
    learningItemCancelBtn: document.getElementById("learningItemCancelBtn"),

    // Bulk Import Modal
    openBulkImportBtn: document.getElementById("openBulkImportBtn"),
    bulkImportModal: document.getElementById("bulkImportModal"),
    bulkImportForm: document.getElementById("bulkImportForm"),
    bulkImportInput: document.getElementById("bulkImportInput"),
    bulkParsedCountText: document.getElementById("bulkParsedCountText"),
    bulkDuplicateNote: document.getElementById("bulkDuplicateNote"),
    bulkCancelBtn: document.getElementById("bulkCancelBtn"),
    bulkSubmitBtn: document.getElementById("bulkSubmitBtn"),

    // Reset Data PIN Modal
    resetConfirmModal: document.getElementById("resetConfirmModal"),
    resetConfirmForm: document.getElementById("resetConfirmForm"),
    resetPinInput: document.getElementById("resetPinInput"),
    resetPinFeedback: document.getElementById("resetPinFeedback"),
    resetCancelBtn: document.getElementById("resetCancelBtn")
};

function init() {
    LevelService.normalizeState(state);
    state.history = HistoryService.ensureUpToToday(state.history);
    const penaltyInfo = applyMissedDayPenalties(state);
    state.streak = HistoryService.computeCurrentStreak(state.history);
    RevisionService.pruneFutureUnreachedRevisions(state);
    RevisionService.evaluateStatuses(state.revisions);
    Storage.saveState(state);

    bindEvents();
    initializeRevealObserver();
    updateFormDayButtons([DateUtils.getDayName()]);
    toggleWeeklyTargetField();
    handleScrollState();

    SupabaseService.init();
    CalendarService.init();
    RouterService.init();
    renderApp();
    updateAccessGate({ focusInput: true });

    if (penaltyInfo.totalPenalty > 0) {
        showToast(`Missed-day penalty applied: -${penaltyInfo.totalPenalty} XP.`);
    }
}

function bindEvents() {
    elements.passcodeForm.addEventListener("submit", handlePasscodeSubmit);
    elements.passcodeInput.addEventListener("input", clearPasscodeFeedback);
    elements.completionForm.addEventListener("submit", handleCompletionSubmit);
    elements.completionCancelBtn.addEventListener("click", closeCompletionModal);
    elements.completionModal.addEventListener("click", handleCompletionModalClick);
    elements.taskForm.addEventListener("submit", handleTaskSubmit);
    elements.taskCancelEditBtn.addEventListener("click", resetTaskForm);
    elements.rewardForm.addEventListener("submit", handleRewardSubmit);
    elements.rewardList.addEventListener("click", handleRewardActions);
    elements.repeatType.addEventListener("change", toggleWeeklyTargetField);
    elements.daySelector.addEventListener("click", handleDaySelectorClick);
    elements.dayTabs.addEventListener("click", handleDayTabClick);
    elements.taskList.addEventListener("change", handleTaskCompletion);
    elements.taskList.addEventListener("click", handleTaskActions);
    elements.statsFilter.addEventListener("change", renderDashboard);
    window.addEventListener("scroll", handleScrollState, { passive: true });
    document.addEventListener("keydown", handleGlobalKeydown);

    // Supabase
    if (elements.supabaseStatusBtn) elements.supabaseStatusBtn.addEventListener("click", openSupabaseModal);
    if (elements.supabaseCloseBtn) elements.supabaseCloseBtn.addEventListener("click", closeSupabaseModal);
    if (elements.forceSyncBtn) elements.forceSyncBtn.addEventListener("click", () => SupabaseService.forceSync());
    if (elements.startMigrationBtn) elements.startMigrationBtn.addEventListener("click", handleStartMigration);

    // Settings Page Actions
    if (elements.settingsSyncBtn) elements.settingsSyncBtn.addEventListener("click", openSupabaseModal);
    if (elements.lockNowBtn) elements.lockNowBtn.addEventListener("click", () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        updateAccessGate({ focusInput: true });
        showToast("Rankion locked.");
    });

    // Revision
    if (elements.openStudySessionModalBtn) elements.openStudySessionModalBtn.addEventListener("click", () => openLearningItemModal({ sessionType: "normal" }));
    if (elements.openLearningItemModalBtn) elements.openLearningItemModalBtn.addEventListener("click", () => openLearningItemModal({ sessionType: "learning" }));
    if (elements.sessionTypeSelect) elements.sessionTypeSelect.addEventListener("change", handleSessionTypeToggle);
    if (elements.learningItemForm) elements.learningItemForm.addEventListener("submit", handleLearningItemSubmit);
    if (elements.learningItemCancelBtn) elements.learningItemCancelBtn.addEventListener("click", closeLearningItemModal);
    if (elements.revisionNavTabs) elements.revisionNavTabs.addEventListener("click", handleRevisionTabClick);

    // Active Recall
    if (elements.recallCancelBtn) elements.recallCancelBtn.addEventListener("click", closeActiveRecallModal);
    if (elements.recallRevealBtn) elements.recallRevealBtn.addEventListener("click", handleRecallRevealNotes);
    if (elements.recallBackToPromptBtn) elements.recallBackToPromptBtn.addEventListener("click", handleRecallBackToPrompt);
    if (elements.recallSaveBtn) elements.recallSaveBtn.addEventListener("click", handleRecallSave);
    if (elements.recallScoreGrid) elements.recallScoreGrid.addEventListener("click", handleRecallScoreSelect);

    // Bulk Import
    if (elements.openBulkImportBtn) elements.openBulkImportBtn.addEventListener("click", openBulkImportModal);
    if (elements.bulkCancelBtn) elements.bulkCancelBtn.addEventListener("click", closeBulkImportModal);
    if (elements.bulkImportForm) elements.bulkImportForm.addEventListener("submit", handleBulkImportSubmit);
    if (elements.bulkImportInput) elements.bulkImportInput.addEventListener("input", updateBulkPreview);

    // Reset Data PIN Modal
    if (elements.resetDataBtn) elements.resetDataBtn.addEventListener("click", openResetModal);
    if (elements.resetCancelBtn) elements.resetCancelBtn.addEventListener("click", closeResetModal);
    if (elements.resetConfirmForm) elements.resetConfirmForm.addEventListener("submit", handleResetConfirmSubmit);
    if (elements.resetPinInput) elements.resetPinInput.addEventListener("input", () => {
        if (elements.resetPinFeedback) elements.resetPinFeedback.textContent = "";
    });
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
    updateAccessGate();
    showToast("Rankion unlocked for 24 hours on this device.");
}

function handleCompletionModalClick(event) {
    if (event.target === elements.completionModal) {
        closeCompletionModal();
    }
}

function handleGlobalKeydown(event) {
    if (event.key === "Escape") {
        if (elements.completionModal && elements.completionModal.classList.contains("is-visible")) closeCompletionModal();
        if (elements.activeRecallModal && elements.activeRecallModal.classList.contains("is-visible")) closeActiveRecallModal();
        if (elements.learningItemModal && elements.learningItemModal.classList.contains("is-visible")) closeLearningItemModal();
        if (elements.bulkImportModal && elements.bulkImportModal.classList.contains("is-visible")) closeBulkImportModal();
        if (elements.resetConfirmModal && elements.resetConfirmModal.classList.contains("is-visible")) closeResetModal();
        if (elements.supabaseModal && elements.supabaseModal.classList.contains("is-visible")) closeSupabaseModal();
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
    if (elements.completionLesson) elements.completionLesson.value = "";
    if (elements.completionLessonField) {
        // Show lesson field for intelligence/study tasks or allow for all
        elements.completionLessonField.style.display = "block";
    }
    elements.completionRemark.value = "";
    elements.completionModal.classList.add("is-visible");
    elements.completionModal.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
        if (elements.completionLesson && task.category === "intelligence") {
            elements.completionLesson.focus();
        } else if (elements.completionRemark) {
            elements.completionRemark.focus();
        }
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
    const lesson = normalizeTaskName(elements.completionLesson ? elements.completionLesson.value : "");
    const result = TaskService.completeTask(state, taskId, remark, lesson);
    closeCompletionModal();

    if (!result.success) {
        renderTaskBoard();
        showToast(result.message);
        return;
    }

    highlightedTaskId = taskId;
    persistAndRender();

    let completionMessage = `${result.taskName} completed in ${getCategoryLabel(result.category)}. +${result.xpAwarded} XP and +${result.pointsAwarded} points earned.`;
    if (result.streakBoostPercent > 0) {
        completionMessage += ` Task streak x${result.streakCount} added +${result.streakBoostPercent}%.`;
    }
    if (result.bonusAwarded) {
        completionMessage += " Weekly target bonus unlocked.";
    }
    if (result.revisionInfo && result.revisionInfo.enrolled) {
        completionMessage += ` 🧠 Lesson "${result.revisionInfo.lessonName}" enrolled into Spaced Revision. Next review (Day 3) scheduled for ${result.revisionInfo.nextDate}.`;
    } else if (result.revisionInfo && result.revisionInfo.completedRevNumber !== undefined) {
        completionMessage += ` 🧠 Revision #${result.revisionInfo.completedRevNumber} completed. Next milestone (${result.revisionInfo.nextMilestoneName}) on ${result.revisionInfo.nextDate}.`;
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
    const rewardPoints = clampNumber(elements.taskRewardPoints.value, 1, 999);
    const streakBoostPercent = clampNumber(elements.taskStreakBoost.value, 0, 100);

    if (!taskName) {
        showToast("Add a task name before saving.");
        return;
    }

    if (!scheduledDays.length) {
        showToast("Choose at least one weekday for this task.");
        return;
    }

    const duplicateExists = state.tasks.some(
        (task) => task.id !== editingTaskId && normalizeTaskName(task.name).toLowerCase() === normalizedTaskName
    );

    if (duplicateExists) {
        showToast("Task names should stay unique so progress is easier to track.");
        return;
    }

    const targetPerWeek = repeatType === "weekly"
        ? clampNumber(elements.targetPerWeek.value, 1, 7)
        : null;

    if (editingTaskId) {
        const task = state.tasks.find((item) => item.id === editingTaskId);
        if (!task) {
            resetTaskForm();
            showToast("Task not found.");
            return;
        }

        task.name = taskName;
        task.category = category;
        task.repeatType = repeatType;
        task.targetPerWeek = targetPerWeek;
        task.rewardPoints = rewardPoints;
        task.streakBoostPercent = streakBoostPercent;
        task.scheduledDays = orderDays(scheduledDays);

        highlightedTaskId = task.id;
        selectedDay = task.scheduledDays.includes(selectedDay) ? selectedDay : task.scheduledDays[0];
        resetTaskForm();
        persistAndRender();
        showToast(`Task updated: ${taskName}.`);
        return;
    }

    state.tasks.unshift({
        id: createId(),
        name: taskName,
        category,
        repeatType,
        targetPerWeek,
        rewardPoints,
        streakBoostPercent,
        scheduledDays: orderDays(scheduledDays),
        completedDates: []
    });

    selectedDay = DateUtils.getDayName();
    resetTaskForm();
    persistAndRender();

    showToast(`${getCategoryLabel(category)} task added for ${formatDayList(scheduledDays)}.`);
}

function handleRewardSubmit(event) {
    event.preventDefault();

    const name = normalizeTaskName(elements.rewardName.value).slice(0, 80);
    const cost = clampNumber(elements.rewardCost.value, 1, 9999);

    if (!name) {
        showToast("Add a reward name before saving.");
        return;
    }

    state.rewards.unshift({
        id: createId(),
        name,
        cost,
        createdAt: new Date().toISOString()
    });

    elements.rewardForm.reset();
    elements.rewardCost.value = "50";
    persistAndRender();
    showToast(`Reward added: ${name}.`);
}

function handleRewardActions(event) {
    const rewardButton = event.target.closest("button[data-reward-action]");
    if (!rewardButton) return;

    const reward = state.rewards.find((item) => item.id === rewardButton.dataset.id);
    if (!reward) {
        showToast("Reward not found.");
        return;
    }

    if (rewardButton.dataset.rewardAction === "delete") {
        const userConfirmed = window.confirm(`Delete "${reward.name}" from rewards?`);
        if (!userConfirmed) return;

        state.rewards = state.rewards.filter((item) => item.id !== reward.id);
        SupabaseService.deleteReward(reward.id);
        persistAndRender();
        showToast("Reward removed.");
        return;
    }

    if (state.points < reward.cost) {
        showToast(`You need ${reward.cost - state.points} more points for "${reward.name}".`);
        return;
    }

    const userConfirmed = window.confirm(`Redeem "${reward.name}" for ${reward.cost} points?`);
    if (!userConfirmed) return;

    state.points -= reward.cost;
    state.redemptions.unshift({
        id: createId(),
        rewardId: reward.id,
        rewardName: reward.name,
        cost: reward.cost,
        redeemedAt: new Date().toISOString()
    });

    persistAndRender();
    showToast(`Reward redeemed: ${reward.name}. -${reward.cost} points.`);
}

function handleDaySelectorClick(event) {
    const button = event.target.closest(".day-toggle");
    if (!button) return;

    const isSelected = button.classList.toggle("is-selected");
    button.setAttribute("aria-pressed", String(isSelected));
}

function handleDayTabClick(event) {
    const button = event.target.closest(".day-tab");
    if (!button) return;

    selectedDay = button.dataset.day;
    renderDayTabs();
    renderTaskBoard();
}

function handleTaskCompletion(event) {
    const checkbox = event.target.closest('input[data-action="complete"]');
    if (!checkbox) return;

    if (!checkbox.checked) {
        checkbox.checked = true;
        return;
    }

    checkbox.checked = false;
    openCompletionModal(checkbox.dataset.id);
}

function handleTaskActions(event) {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton || actionButton.dataset.action === "complete") return;

    const task = state.tasks.find((item) => item.id === actionButton.dataset.id);
    if (!task) return;

    if (actionButton.dataset.action === "edit") {
        startTaskEdit(task);
        return;
    }

    if (actionButton.dataset.action !== "delete") return;

    const userConfirmed = window.confirm(`Delete "${task.name}" from Rankion?`);
    if (!userConfirmed) return;

    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    SupabaseService.deleteTask(task.id);
    if (editingTaskId === task.id) {
        resetTaskForm();
    }
    persistAndRender();
    showToast("Task removed.");
}

function openResetModal() {
    if (!elements.resetConfirmModal) return;
    if (elements.resetPinInput) elements.resetPinInput.value = "";
    if (elements.resetPinFeedback) elements.resetPinFeedback.textContent = "";
    elements.resetConfirmModal.classList.add("is-visible");
    elements.resetConfirmModal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
        if (elements.resetPinInput) elements.resetPinInput.focus();
    }, 80);
}

function closeResetModal() {
    if (!elements.resetConfirmModal) return;
    elements.resetConfirmModal.classList.remove("is-visible");
    elements.resetConfirmModal.setAttribute("aria-hidden", "true");
}

async function handleResetConfirmSubmit(event) {
    event.preventDefault();
    const pin = String(elements.resetPinInput ? elements.resetPinInput.value : "").trim();
    if (pin !== APP_PASSCODE) {
        if (elements.resetPinFeedback) {
            elements.resetPinFeedback.textContent = "Incorrect PIN passcode. Try again.";
        }
        if (elements.resetPinInput) {
            elements.resetPinInput.value = "";
            elements.resetPinInput.focus();
        }
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Resetting...";
    }

    // PIN matched, execute full reset across Cloud and Local
    try {
        await SupabaseService.resetCloudData();
    } catch (err) {
        console.warn("Supabase cloud reset warning:", err);
    }

    Storage.reset();
    state.tasks = [];
    state.xp = 0;
    state.points = 0;
    state.rewards = getDefaultRewards();
    state.redemptions = [];
    state.level = 1;
    state.streak = 0;
    state.history = HistoryService.ensureUpToToday([]);
    state.learningItems = [];
    state.revisions = [];
    state.sessions = [];
    selectedDay = DateUtils.getDayName();
    closeCompletionModal();
    closeResetModal();
    if (elements.statsFilter) elements.statsFilter.value = "weekly";
    resetTaskForm();
    if (elements.rewardForm) elements.rewardForm.reset();
    if (elements.rewardCost) elements.rewardCost.value = "50";
    persistAndRender();

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Reset";
    }

    showToast("All Rankion data has been reset.");
}

function toggleWeeklyTargetField() {
    const isWeekly = elements.repeatType.value === "weekly";
    elements.weeklyTargetField.classList.toggle("is-hidden", !isWeekly);
}

function startTaskEdit(task) {
    editingTaskId = task.id;
    if (typeof RouterService !== "undefined") RouterService.navigateTo("tasks", true);
    elements.taskName.value = task.name;
    elements.taskCategory.value = task.category;
    elements.repeatType.value = task.repeatType;
    elements.targetPerWeek.value = task.targetPerWeek || "3";
    elements.taskRewardPoints.value = String(task.rewardPoints || DEFAULT_TASK_REWARD_POINTS);
    elements.taskStreakBoost.value = String(task.streakBoostPercent ?? DEFAULT_STREAK_BOOST_PERCENT);
    updateFormDayButtons(task.scheduledDays);
    toggleWeeklyTargetField();
    elements.taskSubmitButton.textContent = "Save Changes";
    elements.taskCancelEditBtn.hidden = false;
    const planner = document.getElementById("planner");
    if (planner) planner.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elements.taskName.focus(), 250);
}

function resetTaskForm() {
    editingTaskId = "";
    elements.taskForm.reset();
    elements.targetPerWeek.value = "3";
    elements.taskRewardPoints.value = String(DEFAULT_TASK_REWARD_POINTS);
    elements.taskStreakBoost.value = String(DEFAULT_STREAK_BOOST_PERCENT);
    elements.taskSubmitButton.textContent = "Add Task";
    elements.taskCancelEditBtn.hidden = true;
    updateFormDayButtons([DateUtils.getDayName()]);
    toggleWeeklyTargetField();
}

function persistAndRender() {
    state.history = HistoryService.ensureUpToToday(state.history);
    state.streak = HistoryService.computeCurrentStreak(state.history);
    state.updatedAt = Date.now();
    Storage.saveState(state);
    SupabaseService.pushState(state);
    renderApp();
}

function renderApp() {
    renderHero();
    renderInsights();
    renderRewards();
    renderDayTabs();
    renderTaskBoard();
    renderRevisionPanel();
    if (CalendarService) CalendarService.render();
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
    const currentArcTitle = LevelService.getArcTitle(state.level);
    const nextRank = LevelService.getNextRank(state.level);

    elements.levelBadge.textContent = `${currentArcTitle} | ${currentRankTitle}`;
    elements.todayLabel.textContent = `${todayDay}, ${DateUtils.formatLongDate(today)}`;
    elements.heroStreak.textContent = formatDayCount(state.streak);
    elements.heroPoints.textContent = formatPoints(state.points);
    elements.xpSummary.textContent = progress.isMax
        ? "Final arc completed"
        : `${progress.current} / ${progress.threshold} XP`;
    elements.xpRemaining.textContent = progress.isMax
        ? "Final rank unlocked: Absolute Monarch"
        : `${progress.remaining} XP to next arc step`;
    elements.xpProgressBar.style.width = `${progress.percent}%`;
    elements.currentRank.textContent = `Arc: ${currentArcTitle} | Rank: ${currentRankTitle}`;
    elements.nextRank.textContent = nextRank
        ? `Next rank: ${LevelService.getRankTitle(nextRank.min)} at arc step ${nextRank.min}`
        : `Final rank: Absolute Monarch at arc step ${MAX_LEVEL}`;

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

function renderRewards() {
    elements.rewardPointsBalance.textContent = formatPoints(state.points);

    if (!state.rewards.length) {
        elements.rewardList.innerHTML = `
            <article class="empty-state">
                <h3>No rewards yet</h3>
                <p>Add a reward you genuinely want, then spend points when you earn it.</p>
            </article>
        `;
        return;
    }

    const recentRedemptions = state.redemptions.slice(0, 3);

    elements.rewardList.innerHTML = `
        <div class="reward-card-grid">
            ${state.rewards.map((reward) => renderRewardCard(reward)).join("")}
        </div>
        ${recentRedemptions.length
            ? `
                <div class="redemption-strip">
                    <span class="meta-label">Recent redemptions</span>
                    ${recentRedemptions.map((redemption) => `
                        <div class="redemption-item">
                            <strong>${escapeHTML(redemption.rewardName)}</strong>
                            <span>${formatPoints(redemption.cost)} spent</span>
                        </div>
                    `).join("")}
                </div>
            `
            : ""}
    `;
}

function renderRewardCard(reward) {
    const canRedeem = state.points >= reward.cost;

    return `
        <article class="reward-card">
            <div>
                <h3>${escapeHTML(reward.name)}</h3>
                <p>${formatPoints(reward.cost)} required</p>
            </div>
            <div class="reward-actions">
                <button
                    type="button"
                    class="primary-button reward-redeem-button"
                    data-reward-action="redeem"
                    data-id="${reward.id}"
                    ${canRedeem ? "" : "disabled"}
                >Redeem</button>
                <button type="button" class="delete-button" data-reward-action="delete" data-id="${reward.id}">Delete</button>
            </div>
        </article>
    `;
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
        ? "Tasks are grouped by category. Complete today's scheduled tasks to earn XP, custom reward points, and logbook entries."
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
    const rewardPoints = Math.max(1, Math.floor(Number(task.rewardPoints) || DEFAULT_TASK_REWARD_POINTS));
    const streakBoostPercent = Math.max(0, Math.floor(Number(task.streakBoostPercent) || 0));
    const displayStreak = TaskService.getStreakThrough(task, todayKey);
    const nextBoostPercent = completedToday
        ? displayStreak * streakBoostPercent
        : TaskService.getStreakBefore(task, todayKey) * streakBoostPercent;
    const streakCopy = streakBoostPercent > 0
        ? `Task streak ${displayStreak}. Next boost +${nextBoostPercent}% XP and points.`
        : "Task streak boost is off.";

    let statusTitle = "Scheduled";
    let statusCopy = "Preview this task from its weekday tab.";

    if (isCurrentDaySelected && completedToday) {
        statusTitle = "Completed today";
        statusCopy = "Ready again on the next scheduled day.";
    } else if (isCurrentDaySelected) {
        statusTitle = "Ready";
        statusCopy = task.repeatType === "weekly"
            ? `Base ${BASE_TASK_XP} XP and ${formatPoints(rewardPoints)}. Streak boost ${streakBoostPercent}% per chain, plus weekly target bonus.`
            : `Base ${BASE_TASK_XP} XP and ${formatPoints(rewardPoints)}. Streak boost ${streakBoostPercent}% per chain.`;
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
                            <span class="task-tag task-tag-accent">${formatPoints(rewardPoints)}</span>
                            <span class="task-tag task-tag-accent">+${streakBoostPercent}% streak</span>
                            <span class="task-tag">${displayStreak} streak</span>
                            ${task.repeatType === "weekly"
                                ? `<span class="task-tag task-tag-accent">${rollingCount}/${task.targetPerWeek} in 7 days</span>`
                                : ""}
                        </div>
                    </div>

                    <p class="task-meta">${scheduleLine}</p>
                    <p class="task-meta">${streakCopy}</p>

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
                <div class="task-actions">
                    <button type="button" class="edit-button" data-action="edit" data-id="${task.id}">Edit</button>
                    <button type="button" class="delete-button" data-action="delete" data-id="${task.id}">Delete</button>
                </div>
            </div>
        </article>
    `;
}

/* ==============================================================================
   REVISION PANEL RENDERING
   ============================================================================== */
function renderRevisionPanel() {
    const metrics = RevisionService.getMetrics(state.revisions);

    if (elements.revMetricDueToday) elements.revMetricDueToday.textContent = String(metrics.dueToday);
    if (elements.revMetricOverdue) elements.revMetricOverdue.textContent = String(metrics.overdue);
    if (elements.revMetricCompleted) elements.revMetricCompleted.textContent = String(metrics.completed);
    if (elements.revMetricAvgScore) elements.revMetricAvgScore.textContent = metrics.avgScore === "--" ? "--" : `${metrics.avgScore} / 5`;

    const upcomingCount = (state.revisions || []).filter(r => r.status === "upcoming").length;
    const libraryCount = (state.learningItems || []).length;

    if (elements.badgeDueCount) elements.badgeDueCount.textContent = String(metrics.dueToday);
    if (elements.badgeOverdueCount) elements.badgeOverdueCount.textContent = String(metrics.overdue);
    if (elements.badgeUpcomingCount) elements.badgeUpcomingCount.textContent = String(upcomingCount);
    if (elements.badgeCompletedCount) elements.badgeCompletedCount.textContent = String(metrics.completed);
    if (elements.badgeLibraryCount) elements.badgeLibraryCount.textContent = String(libraryCount);

    const activeDueTotal = metrics.dueToday + metrics.overdue;
    if (elements.navRevBadge) {
        if (activeDueTotal > 0) {
            elements.navRevBadge.textContent = String(activeDueTotal);
            elements.navRevBadge.style.display = "inline-flex";
        } else {
            elements.navRevBadge.style.display = "none";
        }
    }

    renderRevisionQueue();
}

function handleRevisionTabClick(event) {
    const tabBtn = event.target.closest(".rev-tab");
    if (!tabBtn || !tabBtn.dataset.revTab) return;

    activeRevTab = tabBtn.dataset.revTab;
    document.querySelectorAll(".rev-tab").forEach(t => t.classList.toggle("is-active", t === tabBtn));
    renderRevisionQueue();
}

function renderRevisionQueue() {
    const list = elements.revisionQueueList;
    if (!list) return;

    if (activeRevTab === "library") {
        renderLearningLibrary(list);
        return;
    }

    let filtered = [];
    if (activeRevTab === "due") {
        filtered = (state.revisions || []).filter(r => r.status === "due_today");
    } else if (activeRevTab === "overdue") {
        filtered = (state.revisions || []).filter(r => r.status === "overdue");
    } else if (activeRevTab === "upcoming") {
        filtered = (state.revisions || []).filter(r => r.status === "upcoming")
            .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    } else if (activeRevTab === "completed") {
        filtered = (state.revisions || []).filter(r => r.status === "completed")
            .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
    }

    if (!filtered.length) {
        let emptyCopy = "No revisions in this queue.";
        if (activeRevTab === "due") emptyCopy = "You have no revisions due today. Great job keeping your memory fresh!";
        if (activeRevTab === "overdue") emptyCopy = "No overdue revisions. Your retention schedule is fully on track.";
        if (activeRevTab === "upcoming") emptyCopy = "No upcoming revisions scheduled. Create a Learning Item to generate a spaced repetition schedule.";
        if (activeRevTab === "completed") emptyCopy = "No completed revisions yet. Complete active recall reviews to log your progress.";

        list.innerHTML = `
            <article class="empty-state">
                <h3>All clear</h3>
                <p>${emptyCopy}</p>
            </article>
        `;
        return;
    }

    list.innerHTML = filtered.map(rev => {
        const item = (state.learningItems || []).find(i => i.id === rev.learningItemId);
        const itemTitle = item ? item.title : "Learning Item";
        const subject = item ? item.subjectName : "General";
        const topic = item ? item.topicName : "";
        const isCompleted = Boolean(rev.completedAt);
        const statusClass = rev.status === "overdue" ? "is-overdue" : (rev.status === "due_today" ? "is-due" : "");

        return `
            <article class="revision-item-card ${statusClass}">
                <div class="revision-card-main">
                    <div class="revision-card-title-row">
                        <h4 class="revision-card-title">${escapeHTML(itemTitle)}</h4>
                        <span class="task-tag task-tag-intelligence">${escapeHTML(subject)}</span>
                        ${topic ? `<span class="task-tag">${escapeHTML(topic)}</span>` : ""}
                        <span class="status-badge ${rev.status.replace('_', '-')}">${rev.status.replace('_', ' ')}</span>
                    </div>
                    <div class="revision-card-meta">
                        <span>Milestone #${rev.revisionNumber} (Day ${SPACING_INTERVALS[rev.revisionNumber] ?? '?'})</span>
                        <span>Scheduled: ${rev.scheduledDate}</span>
                        ${isCompleted ? `<span>Score: ${rev.recallScore}/5 • Completed: ${DateUtils.formatLongDate(new Date(rev.completedAt))}</span>` : ""}
                    </div>
                </div>
                <div>
                    ${!isCompleted ? `
                        <button type="button" class="primary-button" data-action="start-recall" data-revision-id="${rev.id}">
                            Start Active Recall
                        </button>
                    ` : `
                        <button type="button" class="ghost-button" data-action="view-item" data-item-id="${item ? item.id : ''}">
                            View Notes
                        </button>
                    `}
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll("[data-action='start-recall']").forEach(btn => {
        btn.addEventListener("click", () => openActiveRecallModal(btn.dataset.revisionId));
    });

    list.querySelectorAll("[data-action='view-item']").forEach(btn => {
        btn.addEventListener("click", () => {
            const item = (state.learningItems || []).find(i => i.id === btn.dataset.itemId);
            if (item) {
                showToast(`Viewing: ${item.title} (Learned on ${item.learningDate})`);
            }
        });
    });
}

function renderLearningLibrary(list) {
    const items = state.learningItems || [];

    if (!items.length) {
        list.innerHTML = `
            <article class="empty-state">
                <h3>No Learning Items Yet</h3>
                <p>Click "+ New Learning Item" above or complete an Intelligence task with a Lesson name to start spaced repetition.</p>
            </article>
        `;
        return;
    }

    list.innerHTML = `
        <div class="table-wrap">
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Concept / Title</th>
                        <th>Subject • Lesson</th>
                        <th>Learned Date</th>
                        <th>Confidence</th>
                        <th>Spaced Milestones (8 Steps)</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => {
                        const itemRevs = (state.revisions || [])
                            .filter(r => r.learningItemId === item.id)
                            .sort((a, b) => (a.revisionNumber ?? 0) - (b.revisionNumber ?? 0));

                        const dotsHtml = SPACING_INTERVALS.map((int, idx) => {
                            const rev = itemRevs.find(r => r.revisionNumber === idx);
                            let dotClass = "schedule-dot-step";
                            let title = `Day ${int}`;
                            if (rev) {
                                if (rev.completedAt) {
                                    dotClass += " completed";
                                    title += ` - Completed (${rev.recallScore ? `Score ${rev.recallScore}/5` : 'Learned'})`;
                                } else if (rev.status === "overdue") {
                                    dotClass += " overdue";
                                    title += ` - Overdue (Scheduled: ${rev.scheduledDate})`;
                                } else if (rev.status === "due_today") {
                                    dotClass += " due";
                                    title += " - Due Today";
                                } else {
                                    dotClass += " active-next";
                                    title += ` - Scheduled for ${rev.scheduledDate}`;
                                }
                            } else {
                                dotClass += " pending-locked";
                                title += " (Locked until previous review completed)";
                            }
                            return `<span class="${dotClass}" title="${title}"></span>`;
                        }).join("");

                        const nextDueRev = itemRevs.find(r => !r.completedAt);

                        return `
                            <tr>
                                <td><strong>${escapeHTML(item.title)}</strong></td>
                                <td>${escapeHTML(item.subjectName)}${item.topicName ? ` • <span style="color:var(--text); font-weight:600;">${escapeHTML(item.topicName)}</span>` : ''}</td>
                                <td>${item.learningDate}</td>
                                <td>${"★".repeat(item.confidence || 3)}${"☆".repeat(5 - (item.confidence || 3))}</td>
                                <td><div class="schedule-dots-row">${dotsHtml}</div></td>
                                <td>
                                    ${nextDueRev ? `
                                        <button type="button" class="primary-button" style="min-height:34px; padding:0 12px; font-size:0.8rem;" data-action="start-recall" data-revision-id="${nextDueRev.id}">
                                            Review
                                        </button>
                                    ` : `<span class="task-tag task-tag-accent">Mastered</span>`}
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    list.querySelectorAll("[data-action='start-recall']").forEach(btn => {
        btn.addEventListener("click", () => openActiveRecallModal(btn.dataset.revisionId));
    });
}

/* ==============================================================================
   ACTIVE RECALL MODAL WORKFLOW
   ============================================================================== */
function openActiveRecallModal(revisionId) {
    const revision = (state.revisions || []).find(r => r.id === revisionId);
    if (!revision) {
        showToast("Revision not found.");
        return;
    }

    const item = (state.learningItems || []).find(i => i.id === revision.learningItemId) || {
        title: "Learning Item",
        subjectName: "General",
        topicName: "",
        learningDate: revision.scheduledDate,
        whatLearned: "No detailed notes saved for this item.",
        keyConcepts: "",
        importantPoints: "",
        notes: ""
    };

    activeRecallRevisionId = revision.id;
    selectedRecallScore = 3;

    elements.recallRevisionBadge.textContent = `Milestone #${revision.revisionNumber} (Day ${SPACING_INTERVALS[revision.revisionNumber] ?? '?'})`;
    elements.recallSubjectTag.textContent = item.subjectName || "General";
    elements.recallTopicTag.textContent = item.topicName || "Topic";
    elements.recallTopicTag.hidden = !item.topicName;
    elements.recallItemTitle.textContent = item.title;
    elements.recallLearningDate.textContent = `Learned on ${item.learningDate} • Scheduled for ${revision.scheduledDate}`;

    elements.recallMemoryInput.value = "";
    elements.recallStep1.style.display = "grid";
    elements.recallStep2.classList.remove("is-revealed");

    elements.revealWhatLearnedText.textContent = item.whatLearned || "None recorded.";
    elements.revealKeyConceptsText.textContent = item.keyConcepts || item.formulasFacts || "None recorded.";
    elements.revealImportantPointsText.textContent = item.importantPoints || "None recorded.";
    elements.revealNotesText.textContent = item.notes || "None recorded.";

    elements.recallConfidence.value = "Medium";
    elements.recallWhatForgot.value = "";
    elements.recallSessionNotes.value = "";

    elements.recallScoreGrid.querySelectorAll(".score-btn").forEach(btn => {
        btn.classList.toggle("is-selected", btn.dataset.score === "3");
    });

    elements.activeRecallModal.classList.add("is-visible");
    elements.activeRecallModal.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
        elements.recallMemoryInput.focus();
    }, 40);
}

function closeActiveRecallModal() {
    activeRecallRevisionId = "";
    elements.activeRecallModal.classList.remove("is-visible");
    elements.activeRecallModal.setAttribute("aria-hidden", "true");
}

function handleRecallRevealNotes() {
    elements.recallStep1.style.display = "none";
    elements.recallStep2.classList.add("is-revealed");
}

function handleRecallBackToPrompt() {
    elements.recallStep2.classList.remove("is-revealed");
    elements.recallStep1.style.display = "grid";
}

function handleRecallScoreSelect(event) {
    const btn = event.target.closest(".score-btn");
    if (!btn || !btn.dataset.score) return;

    selectedRecallScore = Number(btn.dataset.score);
    elements.recallScoreGrid.querySelectorAll(".score-btn").forEach(b => b.classList.toggle("is-selected", b === btn));
}

function handleRecallSave() {
    if (!activeRecallRevisionId) {
        closeActiveRecallModal();
        return;
    }

    const revision = (state.revisions || []).find(r => r.id === activeRecallRevisionId);
    const item = (state.learningItems || []).find(i => i.id === revision?.learningItemId);

    const result = RevisionService.completeRevision(state, activeRecallRevisionId, {
        recallScore: selectedRecallScore,
        confidence: elements.recallConfidence.value,
        whatForgot: elements.recallWhatForgot.value,
        recallNotes: elements.recallSessionNotes.value,
        itemTitle: item ? item.title : "Learning Item"
    });

    closeActiveRecallModal();

    if (result.success) {
        persistAndRender();
        showToast(`Revision completed (Score ${result.score}/5). +${result.xpEarned} XP and +${result.pointsEarned} pts. Next scheduled: ${result.nextDate}.`);
        if (result.levelInfo && result.levelInfo.leveledUp) {
            showLevelUp(result.levelInfo.newLevel);
        }
    } else {
        showToast(result.message || "Could not complete revision.");
    }
}

/* ==============================================================================
   LEARNING ITEM & STUDY SESSION MODAL
   ============================================================================== */
function openLearningItemModal(options = {}) {
    const type = options.sessionType || "learning";
    elements.sessionTypeSelect.value = type;
    elements.itemLearningDate.value = DateUtils.toKey();
    elements.itemTitle.value = "";
    elements.itemSubject.value = "";
    elements.itemTopic.value = "";
    elements.itemSubtopic.value = "";
    elements.itemWhatLearned.value = "";
    elements.itemKeyConcepts.value = "";
    elements.itemImportantPoints.value = "";
    elements.itemQuestionsAttempted.value = "0";
    elements.itemQuestionsCorrect.value = "0";
    elements.itemConfidence.value = "3";
    elements.itemNotes.value = "";

    handleSessionTypeToggle();

    elements.learningItemModal.classList.add("is-visible");
    elements.learningItemModal.setAttribute("aria-hidden", "false");

    window.setTimeout(() => elements.itemTitle.focus(), 30);
}

function closeLearningItemModal() {
    elements.learningItemForm.reset();
    elements.learningItemModal.classList.remove("is-visible");
    elements.learningItemModal.setAttribute("aria-hidden", "true");
}

function handleSessionTypeToggle() {
    const isLearning = elements.sessionTypeSelect.value === "learning";
    elements.learningFieldsContainer.style.display = isLearning ? "block" : "none";
    elements.learningItemModalTitle.textContent = isLearning ? "Create Learning Item" : "Log Normal Study Session";
    elements.learningItemSubmitBtn.textContent = isLearning ? "Save & Generate Schedule" : "Save Study Session";
}

function handleLearningItemSubmit(event) {
    event.preventDefault();

    const sessionType = elements.sessionTypeSelect.value;
    const title = normalizeTaskName(elements.itemTitle.value);
    const learningDate = elements.itemLearningDate.value || DateUtils.toKey();
    const subjectName = normalizeTaskName(elements.itemSubject.value);
    const topicName = normalizeTaskName(elements.itemTopic.value);
    const subtopic = normalizeTaskName(elements.itemSubtopic.value);
    const notes = normalizeRemark(elements.itemNotes.value);

    if (!title || !subjectName) {
        showToast("Please provide at least a Title and Subject.");
        return;
    }

    if (sessionType === "learning") {
        const itemData = {
            title,
            subjectName,
            topicName,
            subtopic,
            learningDate,
            whatLearned: elements.itemWhatLearned.value,
            keyConcepts: elements.itemKeyConcepts.value,
            importantPoints: elements.itemImportantPoints.value,
            notes,
            confidence: Number(elements.itemConfidence.value) || 3,
            questionsAttempted: Number(elements.itemQuestionsAttempted.value) || 0,
            questionsCorrect: Number(elements.itemQuestionsCorrect.value) || 0
        };

        const result = RevisionService.createLearningItem(state, itemData);

        const levelInfo = LevelService.addXp(state, 10);
        state.points += 5;
        HistoryService.recordCompletion(state.history, learningDate, {
            taskId: `item-${result.learningItem.id}`,
            taskName: `Learning Session: ${result.learningItem.title}`,
            category: "intelligence",
            remark: `New learning item registered. Spaced schedule generated.`,
            xpEarned: 10,
            pointsEarned: 5,
            streakCount: state.streak,
            streakBoostPercent: 0,
            completedAt: new Date().toISOString()
        });

        closeLearningItemModal();
        persistAndRender();
        showToast(`Learning Item "${title}" created. 8 spaced repetition milestones generated!`);
        if (levelInfo.leveledUp) showLevelUp(levelInfo.newLevel);
    } else {
        const session = RevisionService.createSession(state, {
            sessionType: "normal",
            title,
            duration: 45,
            notes
        });

        const levelInfo = LevelService.addXp(state, 10);
        state.points += 5;
        HistoryService.recordCompletion(state.history, learningDate, {
            taskId: `session-${session.id}`,
            taskName: `Study Session: ${session.title}`,
            category: "intelligence",
            remark: notes || "Normal study session completed.",
            xpEarned: 10,
            pointsEarned: 5,
            streakCount: state.streak,
            streakBoostPercent: 0,
            completedAt: new Date().toISOString()
        });

        closeLearningItemModal();
        persistAndRender();
        showToast(`Study Session "${title}" recorded.`);
        if (levelInfo.leveledUp) showLevelUp(levelInfo.newLevel);
    }
}

/* ==============================================================================
   SUPABASE MODAL & MIGRATION HANDLERS
   ============================================================================== */
function openSupabaseModal() {
    const localTasksCount = (state.tasks || []).length;
    const localRevsCount = (state.revisions || []).length;
    const localItemsCount = (state.learningItems || []).length;

    const migrationSummary = document.getElementById("migrationSummaryText");
    if (migrationSummary) {
        migrationSummary.textContent = `Connected to cloud project (kyebdjjlfmahlcblcgmg). Found ${localTasksCount} task(s), ${localItemsCount} learning item(s), and ${localRevsCount} revision(s) synchronized with PostgreSQL.`;
    }

    elements.supabaseModal.classList.add("is-visible");
    elements.supabaseModal.setAttribute("aria-hidden", "false");
}

function closeSupabaseModal() {
    elements.supabaseModal.classList.remove("is-visible");
    elements.supabaseModal.setAttribute("aria-hidden", "true");
}

async function handleStartMigration() {
    try {
        if (!SupabaseService.client) {
            SupabaseService.init();
        }

        elements.startMigrationBtn.disabled = true;
        elements.startMigrationBtn.textContent = "Uploading to Cloud...";

        await SupabaseService.migrateLocalData(state);
        elements.startMigrationBtn.disabled = false;
        elements.startMigrationBtn.textContent = "Migrate Local Cache";

        showToast("All tasks, history, rewards, and revisions uploaded to Supabase!");
        closeSupabaseModal();
    } catch (err) {
        elements.startMigrationBtn.disabled = false;
        elements.startMigrationBtn.textContent = "Migrate Local Cache";
        showToast(`Sync notice: ${err.message}`);
    }
}

/* ==============================================================================
   BULK IMPORT TASKS HANDLERS
   ============================================================================== */
function openBulkImportModal() {
    if (!elements.bulkImportModal) return;
    if (elements.bulkImportForm) elements.bulkImportForm.reset();
    updateBulkPreview();
    elements.bulkImportModal.classList.add("is-visible");
    elements.bulkImportModal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
        if (elements.bulkImportInput) elements.bulkImportInput.focus();
    }, 80);
}

function closeBulkImportModal() {
    if (!elements.bulkImportModal) return;
    elements.bulkImportModal.classList.remove("is-visible");
    elements.bulkImportModal.setAttribute("aria-hidden", "true");
}

function parseBulkTasks(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const text = rawText.trim();
    const defaultCategory = "intelligence";
    const defaultDays = [...DAYS];
    const defaultPoints = 10;
    const defaultBoost = 10;

    // Check if input is JSON array
    if (text.startsWith("[") && text.endsWith("]")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => {
                    if (typeof item === "string") {
                        const name = normalizeTaskName(item);
                        return name ? {
                            name,
                            category: defaultCategory,
                            repeatType: "daily",
                            targetPerWeek: null,
                            rewardPoints: defaultPoints,
                            streakBoostPercent: defaultBoost,
                            scheduledDays: defaultDays
                        } : null;
                    }
                    const name = normalizeTaskName(item.name || item.title || "");
                    if (!name) return null;
                    return {
                        name,
                        category: sanitizeCategory(item.category || defaultCategory),
                        repeatType: item.repeatType === "weekly" ? "weekly" : "daily",
                        targetPerWeek: item.targetPerWeek || (item.repeatType === "weekly" ? 3 : null),
                        rewardPoints: clampNumber(item.rewardPoints || item.points || defaultPoints, 1, 999),
                        streakBoostPercent: clampNumber(item.streakBoostPercent || item.boost || defaultBoost, 0, 100),
                        scheduledDays: Array.isArray(item.scheduledDays) && item.scheduledDays.length > 0
                            ? orderDays(item.scheduledDays)
                            : defaultDays
                    };
                }).filter(Boolean);
            }
        } catch (e) {
            // Continue line-by-line parsing
        }
    }

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const results = [];

    lines.forEach((line) => {
        // Strip markdown list bullet points like "- ", "* ", "1. ", "[ ] "
        let cleanLine = line.replace(/^(\*|-|\+|\d+\.|\[[ xX]?\])\s+/, "").trim();
        if (!cleanLine) return;

        // Check if line uses pipe delimiter: Name | Category | Days | Points | Boost
        if (cleanLine.includes("|")) {
            const parts = cleanLine.split("|").map((p) => p.trim());
            const taskName = normalizeTaskName(parts[0]);
            if (!taskName) return;

            let category = defaultCategory;
            if (parts[1]) {
                const p1 = parts[1].toLowerCase();
                if (p1.includes("phys")) category = "physique";
                else if (p1.includes("earn") || p1.includes("mon") || p1.includes("fin")) category = "earnings";
                else if (p1.includes("intel") || p1.includes("mind") || p1.includes("stud") || p1.includes("read")) category = "intelligence";
            }

            let scheduledDays = defaultDays;
            if (parts[2]) {
                const dStr = parts[2].toLowerCase();
                if (dStr.includes("daily") || dStr.includes("every day") || dStr.includes("all")) {
                    scheduledDays = [...DAYS];
                } else if (dStr.includes("weekday")) {
                    scheduledDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                } else if (dStr.includes("weekend")) {
                    scheduledDays = ["Saturday", "Sunday"];
                } else {
                    const matchedDays = [];
                    DAYS.forEach((day) => {
                        const short = day.slice(0, 3).toLowerCase();
                        if (dStr.includes(short) || dStr.includes(day.toLowerCase())) {
                            matchedDays.push(day);
                        }
                    });
                    if (matchedDays.length > 0) scheduledDays = orderDays(matchedDays);
                }
            }

            let rewardPoints = defaultPoints;
            if (parts[3]) {
                const num = parseInt(parts[3].replace(/[^\d]/g, ""), 10);
                if (!isNaN(num) && num > 0) rewardPoints = clampNumber(num, 1, 999);
            }

            let streakBoostPercent = defaultBoost;
            if (parts[4]) {
                const num = parseInt(parts[4].replace(/[^\d]/g, ""), 10);
                if (!isNaN(num) && num >= 0) streakBoostPercent = clampNumber(num, 0, 100);
            }

            results.push({
                name: taskName,
                category,
                repeatType: "daily",
                targetPerWeek: null,
                rewardPoints,
                streakBoostPercent,
                scheduledDays
            });
        } else {
            // Simple line: Task Name only
            const taskName = normalizeTaskName(cleanLine);
            if (taskName) {
                results.push({
                    name: taskName,
                    category: defaultCategory,
                    repeatType: "daily",
                    targetPerWeek: null,
                    rewardPoints: defaultPoints,
                    streakBoostPercent: defaultBoost,
                    scheduledDays: defaultDays
                });
            }
        }
    });

    return results;
}

function updateBulkPreview() {
    if (!elements.bulkImportInput || !elements.bulkParsedCountText) return;
    const parsed = parseBulkTasks(elements.bulkImportInput.value);
    const existingNames = new Set(state.tasks.map((t) => normalizeTaskName(t.name).toLowerCase()));
    const uniqueParsed = [];
    let duplicateCount = 0;

    parsed.forEach((item) => {
        const norm = item.name.toLowerCase();
        if (existingNames.has(norm)) {
            duplicateCount++;
        } else {
            existingNames.add(norm);
            uniqueParsed.push(item);
        }
    });

    elements.bulkParsedCountText.textContent = `${uniqueParsed.length} new task${uniqueParsed.length === 1 ? "" : "s"} ready to import`;
    if (elements.bulkDuplicateNote) {
        elements.bulkDuplicateNote.textContent = duplicateCount > 0
            ? `(${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} will be skipped)`
            : "All tasks unique";
    }
}

function handleBulkImportSubmit(event) {
    event.preventDefault();
    const parsed = parseBulkTasks(elements.bulkImportInput.value);
    if (!parsed.length) {
        showToast("No valid tasks found. Enter at least one task.");
        return;
    }

    const existingNames = new Set(state.tasks.map((t) => normalizeTaskName(t.name).toLowerCase()));
    const newTasks = [];
    let skippedCount = 0;

    parsed.forEach((item) => {
        const norm = item.name.toLowerCase();
        if (existingNames.has(norm)) {
            skippedCount++;
        } else {
            existingNames.add(norm);
            newTasks.push({
                id: createId(),
                name: item.name,
                category: item.category,
                repeatType: item.repeatType,
                targetPerWeek: item.targetPerWeek,
                rewardPoints: item.rewardPoints,
                streakBoostPercent: item.streakBoostPercent,
                scheduledDays: item.scheduledDays,
                completedDates: []
            });
        }
    });

    if (!newTasks.length) {
        showToast("All tasks in the list already exist as duplicates.");
        return;
    }

    state.tasks.unshift(...newTasks);
    selectedDay = DateUtils.getDayName();
    closeBulkImportModal();
    persistAndRender();

    const toastMsg = skippedCount > 0
        ? `Imported ${newTasks.length} tasks (${skippedCount} duplicates skipped).`
        : `Successfully imported ${newTasks.length} tasks.`;
    showToast(toastMsg);
}

/* ==============================================================================
   DASHBOARD & STATS RENDERING
   ============================================================================== */
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
    elements.statCurrentLevel.textContent = `${LevelService.getArcTitle(state.level)} - ${LevelService.getRankTitle(state.level)}`;
    elements.statCurrentStreak.textContent = formatDayCount(state.streak);

    if (filter === "monthly") {
        elements.chartTitle.textContent = "Last 30 days";
        elements.chartSummary.textContent = `${totals.tasksCompleted} completions and ${totals.xpEarned} XP earned in the last 30 days.`;
    } else if (filter === "all") {
        const activeDays = filteredHistory.filter((entry) => entry.tasksCompleted > 0).length;
        elements.chartTitle.textContent = "All-time summary";
        elements.chartSummary.textContent = `${totals.tasksCompleted} total tasks, ${totals.xpEarned} total XP, and ${activeDays} active day${activeDays === 1 ? "" : "s"} recorded.`;
    } else {
        elements.chartTitle.textContent = "Last 7 days";
        elements.chartSummary.textContent = `${totals.tasksCompleted} completions and ${totals.xpEarned} XP earned in the last 7 days.`;
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
                    <span class="task-tag">+${formatPoints(taskLog.pointsEarned)}</span>
                    ${taskLog.streakCount
                        ? `<span class="task-tag">${taskLog.streakCount} streak</span>`
                        : ""}
                    ${taskLog.streakBoostPercent
                        ? `<span class="task-tag">+${taskLog.streakBoostPercent}% boost</span>`
                        : ""}
                    <span class="task-tag">${escapeHTML(formatCompletedAt(taskLog.completedAt))}</span>
                </div>
            </div>
            <p class="logbook-task-copy">Logged in the ${categoryDefinition.label.toLowerCase()} category.</p>
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
    }, 2800);
}

function showLevelUp(level) {
    window.clearTimeout(levelUpTimer);
    elements.levelUpText.textContent = `${LevelService.getArcTitle(level)} - ${LevelService.getRankTitle(level)}`;
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

    if (remaining <= 0) return;

    autoLockTimer = window.setTimeout(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        updateAccessGate({ expired: true, focusInput: true });
    }, remaining + 100);
}

function updateAccessGate(options = {}) {
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
    if (!highlightedTaskId) return;

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
        xpPenalty: 0,
        penaltyApplied: false,
        completedTasks: []
    };
}

function cloneHistoryEntry(entry) {
    return {
        date: entry.date,
        tasksCompleted: entry.tasksCompleted,
        xpEarned: entry.xpEarned,
        xpPenalty: Math.max(0, Math.floor(Number(entry.xpPenalty) || 0)),
        penaltyApplied: Boolean(entry.penaltyApplied),
        completedTasks: Array.isArray(entry.completedTasks)
            ? entry.completedTasks.map((taskLog) => ({ ...taskLog }))
            : []
    };
}

function applyMissedDayPenalties(currentState) {
    const todayKey = DateUtils.toKey();
    const history = HistoryService.ensureUpToToday(currentState.history);
    let totalPenalty = 0;

    for (let index = 1; index < history.length; index += 1) {
        const entry = history[index];
        const previousEntry = history[index - 1];

        if (entry.date >= todayKey) continue;

        if (entry.tasksCompleted === 0 && previousEntry.tasksCompleted > 0 && !entry.penaltyApplied) {
            const penaltyInfo = LevelService.subtractXp(currentState, MISSED_DAY_XP_PENALTY);
            entry.xpPenalty += penaltyInfo.xpLost;
            entry.penaltyApplied = true;
            totalPenalty += penaltyInfo.xpLost;
        }
    }

    currentState.history = history;
    return { totalPenalty };
}

function sanitizeTimestamp(value) {
    const parsedValue = Math.floor(Number(value) || 0);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
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
        .slice(0, 500);
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

    if (highestValue === 0) return [];

    return CATEGORY_DEFINITIONS
        .filter((category) => Math.max(0, Number(categoryTotals?.[category.key] || 0)) === highestValue)
        .map((category) => category.key);
}

function getFocusCategoryLabel(categoryTotals) {
    const topCategoryKeys = getTopCategoryKeys(categoryTotals);

    if (!topCategoryKeys.length) return "No data yet";
    if (topCategoryKeys.length === 1) return getCategoryLabel(topCategoryKeys[0]);

    return `Tie: ${topCategoryKeys.map((categoryKey) => getCategoryLabel(categoryKey)).join(" / ")}`;
}

function getTopWeekBucket(weeklyCategoryBuckets) {
    return weeklyCategoryBuckets
        .filter((bucket) => bucket.total > 0)
        .sort((left, right) => right.total - left.total || right.weekKey.localeCompare(left.weekKey))[0] || null;
}

function getDefaultRewards() {
    return [
        {
            id: "reward-movie-hour",
            name: "Free movie hour",
            cost: 80,
            createdAt: new Date().toISOString()
        },
        {
            id: "reward-game-break",
            name: "30 minute game break",
            cost: 50,
            createdAt: new Date().toISOString()
        },
        {
            id: "reward-favorite-snack",
            name: "Favorite snack",
            cost: 35,
            createdAt: new Date().toISOString()
        }
    ];
}

function sanitizeRewards(rewards) {
    if (!Array.isArray(rewards)) return [];

    return rewards.reduce((result, rawReward) => {
        if (!rawReward || typeof rawReward !== "object") return result;

        const name = normalizeTaskName(rawReward.name).slice(0, 80);
        const cost = clampNumber(rawReward.cost, 1, 9999);
        if (!name) return result;

        result.push({
            id: rawReward.id ? String(rawReward.id) : createId(),
            name,
            cost,
            createdAt: normalizeCompletedAt(rawReward.createdAt || new Date().toISOString())
        });

        return result;
    }, []);
}

function sanitizeRedemptions(redemptions) {
    if (!Array.isArray(redemptions)) return [];

    return redemptions.reduce((result, rawRedemption) => {
        if (!rawRedemption || typeof rawRedemption !== "object") return result;

        const rewardName = normalizeTaskName(rawRedemption.rewardName || rawRedemption.name).slice(0, 80);
        if (!rewardName) return result;

        result.push({
            id: rawRedemption.id ? String(rawRedemption.id) : createId(),
            rewardId: rawRedemption.rewardId ? String(rawRedemption.rewardId) : "",
            rewardName,
            cost: clampNumber(rawRedemption.cost, 1, 9999),
            redeemedAt: normalizeCompletedAt(rawRedemption.redeemedAt || new Date().toISOString())
        });

        return result;
    }, []).sort((left, right) => String(right.redeemedAt).localeCompare(String(left.redeemedAt)));
}

function sanitizeTasks(tasks) {
    if (!Array.isArray(tasks)) return [];

    return tasks.reduce((result, rawTask) => {
        if (!rawTask || typeof rawTask !== "object") return result;

        const name = normalizeTaskName(rawTask.name);
        if (!name) return result;

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
            rewardPoints: clampNumber(rawTask.rewardPoints ?? DEFAULT_TASK_REWARD_POINTS, 1, 999),
            streakBoostPercent: clampNumber(rawTask.streakBoostPercent ?? DEFAULT_STREAK_BOOST_PERCENT, 0, 100),
            scheduledDays: scheduledDays.length ? scheduledDays : [DateUtils.getDayName()],
            completedDates
        });

        return result;
    }, []);
}

function sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];

    const historyMap = new Map();

    history.forEach((rawEntry) => {
        if (!rawEntry || typeof rawEntry !== "object" || !isValidDateKey(rawEntry.date)) return;

        const completedTaskLogs = sanitizeCompletedTaskLogs(rawEntry.completedTasks, rawEntry.date);
        const safeEntry = historyMap.get(rawEntry.date) || createEmptyHistoryEntry(rawEntry.date);
        const derivedTasksCompleted = completedTaskLogs.length;
        const derivedXpEarned = completedTaskLogs.reduce((sum, taskLog) => sum + taskLog.xpEarned, 0);

        safeEntry.tasksCompleted += Math.max(0, Math.floor(Number(rawEntry.tasksCompleted) || 0), derivedTasksCompleted);
        safeEntry.xpEarned += Math.max(0, Math.floor(Number(rawEntry.xpEarned) || 0), derivedXpEarned);
        safeEntry.xpPenalty += Math.max(0, Math.floor(Number(rawEntry.xpPenalty) || 0));
        safeEntry.penaltyApplied = Boolean(safeEntry.penaltyApplied || rawEntry.penaltyApplied);
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const parsedDate = DateUtils.parseKey(value);
    return !Number.isNaN(parsedDate.getTime());
}

function normalizeTaskName(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function clampNumber(value, min, max) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return min;
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

function formatPoints(points) {
    const safePoints = Math.max(0, Math.floor(Number(points) || 0));
    return `${safePoints} pt${safePoints === 1 ? "" : "s"}`;
}

function sanitizeCompletedTaskLogs(logs, fallbackDateKey) {
    if (!Array.isArray(logs)) return [];

    return logs.reduce((result, rawLog) => {
        if (!rawLog || typeof rawLog !== "object") return result;

        const taskName = normalizeTaskName(rawLog.taskName || rawLog.name);
        if (!taskName) return result;

        result.push({
            taskId: rawLog.taskId ? String(rawLog.taskId) : createId(),
            taskName,
            category: sanitizeCategory(rawLog.category),
            remark: normalizeRemark(rawLog.remark),
            xpEarned: Math.max(0, Math.floor(Number(rawLog.xpEarned) || 0)),
            pointsEarned: Math.max(0, Math.floor(Number(rawLog.pointsEarned ?? rawLog.xpEarned) || 0)),
            streakCount: Math.max(0, Math.floor(Number(rawLog.streakCount) || 0)),
            streakBoostPercent: Math.max(0, Math.floor(Number(rawLog.streakBoostPercent) || 0)),
            completedAt: normalizeCompletedAt(rawLog.completedAt, fallbackDateKey)
        });

        return result;
    }, []);
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

init();
