import {
    BlobPreconditionFailedError,
    get,
    head,
    put
} from "@vercel/blob";

const STATE_PATHNAME = "rankion/shared-state.json";
const MAX_LEVEL = 300;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORY_KEYS = new Set(["physique", "earnings", "intelligence"]);

export default async function handler(request) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return json(
            {
                error: "Vercel Blob is not connected. Add a private Blob store to this project."
            },
            503
        );
    }

    if (request.method === "GET") {
        const currentState = await readStateFromBlob();
        return json({ state: currentState.state }, 200);
    }

    if (request.method === "PUT") {
        let payload;

        try {
            payload = await request.json();
        } catch (error) {
            return json({ error: "Invalid JSON body." }, 400);
        }

        const nextState = sanitizeStateSnapshot(payload?.state || payload);
        const savedState = await saveStateToBlob(nextState);
        return json({ state: savedState }, 200);
    }

    return json({ error: "Method Not Allowed" }, 405);
}

async function readStateFromBlob() {
    const result = await get(STATE_PATHNAME, {
        access: "private"
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
        return {
            state: createEmptyState(),
            etag: ""
        };
    }

    const rawText = await new Response(result.stream).text();

    return {
        state: sanitizeStateSnapshot(parseJSON(rawText)),
        etag: result.blob?.etag || ""
    };
}

async function saveStateToBlob(incomingState, attempt = 0) {
    const current = await readStateFromBlob();

    if (current.state.updatedAt > incomingState.updatedAt) {
        return current.state;
    }

    try {
        const writeResult = await put(STATE_PATHNAME, JSON.stringify(incomingState), {
            access: "private",
            allowOverwrite: true,
            contentType: "application/json; charset=utf-8",
            cacheControlMaxAge: 60,
            ifMatch: current.etag || undefined
        });

        return {
            ...incomingState,
            updatedAt: Math.max(incomingState.updatedAt, Date.now()),
            etag: writeResult.etag
        };
    } catch (error) {
        if (error instanceof BlobPreconditionFailedError && attempt < 3) {
            return saveStateToBlob(incomingState, attempt + 1);
        }

        throw error;
    }
}

function json(payload, status) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8"
        }
    });
}

function parseJSON(value) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function createEmptyState() {
    return {
        tasks: [],
        xp: 0,
        level: 1,
        streak: 0,
        history: [],
        updatedAt: 0
    };
}

function sanitizeText(value, maxLength = 240) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function sanitizeTimestamp(value) {
    const parsedValue = Math.floor(Number(value) || 0);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function isValidDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function clampNumber(value, min, max) {
    const parsedValue = Math.floor(Number(value) || 0);
    if (!Number.isFinite(parsedValue)) {
        return min;
    }
    return Math.min(Math.max(parsedValue, min), max);
}

function sanitizeTask(task) {
    if (!task || typeof task !== "object") {
        return null;
    }

    const name = sanitizeText(task.name, 80);
    if (!name) {
        return null;
    }

    const repeatType = task.repeatType === "weekly" ? "weekly" : "daily";
    const category = CATEGORY_KEYS.has(task.category) ? task.category : "intelligence";
    const scheduledDays = Array.isArray(task.scheduledDays)
        ? [...new Set(task.scheduledDays.filter((day) => DAYS.includes(day)))]
        : [];
    const completedDates = Array.isArray(task.completedDates)
        ? [...new Set(task.completedDates.filter(isValidDateKey))].sort()
        : [];

    return {
        id: sanitizeText(task.id || `task-${Date.now()}`, 120),
        name,
        category,
        repeatType,
        targetPerWeek: repeatType === "weekly" ? clampNumber(task.targetPerWeek, 1, 7) : null,
        scheduledDays: scheduledDays.length ? scheduledDays : ["Monday"],
        completedDates
    };
}

function sanitizeTaskLog(taskLog, fallbackDateKey) {
    if (!taskLog || typeof taskLog !== "object") {
        return null;
    }

    const taskName = sanitizeText(taskLog.taskName || taskLog.name, 80);
    if (!taskName) {
        return null;
    }

    const completedAt = new Date(taskLog.completedAt);

    return {
        taskId: sanitizeText(taskLog.taskId || "", 120),
        taskName,
        category: CATEGORY_KEYS.has(taskLog.category) ? taskLog.category : "intelligence",
        remark: sanitizeText(taskLog.remark, 220),
        xpEarned: Math.max(0, Math.floor(Number(taskLog.xpEarned) || 0)),
        completedAt: Number.isNaN(completedAt.getTime())
            ? new Date(`${fallbackDateKey}T00:00:00.000Z`).toISOString()
            : completedAt.toISOString()
    };
}

function sanitizeHistoryEntry(entry) {
    if (!entry || typeof entry !== "object" || !isValidDateKey(entry.date)) {
        return null;
    }

    const completedTasks = Array.isArray(entry.completedTasks)
        ? entry.completedTasks
            .map((taskLog) => sanitizeTaskLog(taskLog, entry.date))
            .filter(Boolean)
            .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
        : [];

    return {
        date: entry.date,
        tasksCompleted: Math.max(0, Math.floor(Number(entry.tasksCompleted) || 0), completedTasks.length),
        xpEarned: Math.max(
            0,
            Math.floor(Number(entry.xpEarned) || 0),
            completedTasks.reduce((sum, taskLog) => sum + taskLog.xpEarned, 0)
        ),
        completedTasks
    };
}

function sanitizeStateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
        return createEmptyState();
    }

    const level = clampNumber(snapshot.level, 1, MAX_LEVEL);

    return {
        tasks: Array.isArray(snapshot.tasks) ? snapshot.tasks.map(sanitizeTask).filter(Boolean) : [],
        xp: level >= MAX_LEVEL ? 0 : Math.max(0, Math.floor(Number(snapshot.xp) || 0)),
        level,
        streak: Math.max(0, Math.floor(Number(snapshot.streak) || 0)),
        history: Array.isArray(snapshot.history)
            ? snapshot.history
                .map(sanitizeHistoryEntry)
                .filter(Boolean)
                .sort((left, right) => left.date.localeCompare(right.date))
            : [],
        updatedAt: sanitizeTimestamp(snapshot.updatedAt || Date.now())
    };
}
