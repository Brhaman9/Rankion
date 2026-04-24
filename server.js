const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, ".data");
const STATE_FILE = path.join(DATA_DIR, "rankion-state.json");
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORY_KEYS = new Set(["physique", "earnings", "intelligence"]);
const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
};

function sendJSON(response, statusCode, payload) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
    response.writeHead(statusCode, {
        "Content-Type": "text/plain; charset=utf-8"
    });
    response.end(message);
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

function clampNumber(value, min, max) {
    const parsedValue = Math.floor(Number(value) || 0);
    if (!Number.isFinite(parsedValue)) {
        return min;
    }
    return Math.min(Math.max(parsedValue, min), max);
}

function normalizeText(value, maxLength = 240) {
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

function sanitizeTask(task) {
    if (!task || typeof task !== "object") {
        return null;
    }

    const name = normalizeText(task.name, 80);
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
        id: normalizeText(task.id || `task-${Date.now()}`, 120),
        name,
        category,
        repeatType,
        targetPerWeek: repeatType === "weekly" ? clampNumber(task.targetPerWeek, 1, 7) : null,
        scheduledDays: scheduledDays.length ? scheduledDays : ["Monday"],
        completedDates
    };
}

function sanitizeCompletedTaskLog(taskLog, fallbackDateKey) {
    if (!taskLog || typeof taskLog !== "object") {
        return null;
    }

    const taskName = normalizeText(taskLog.taskName || taskLog.name, 80);
    if (!taskName) {
        return null;
    }

    const completedAt = new Date(taskLog.completedAt);

    return {
        taskId: normalizeText(taskLog.taskId || "", 120),
        taskName,
        category: CATEGORY_KEYS.has(taskLog.category) ? taskLog.category : "intelligence",
        remark: normalizeText(taskLog.remark, 220),
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
            .map((taskLog) => sanitizeCompletedTaskLog(taskLog, entry.date))
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

function sanitizeState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
        return createEmptyState();
    }

    const level = clampNumber(snapshot.level, 1, 300);

    return {
        tasks: Array.isArray(snapshot.tasks) ? snapshot.tasks.map(sanitizeTask).filter(Boolean) : [],
        xp: level >= 300 ? 0 : Math.max(0, Math.floor(Number(snapshot.xp) || 0)),
        level,
        streak: Math.max(0, Math.floor(Number(snapshot.streak) || 0)),
        history: Array.isArray(snapshot.history)
            ? snapshot.history
                .map(sanitizeHistoryEntry)
                .filter(Boolean)
                .sort((left, right) => left.date.localeCompare(right.date))
            : [],
        updatedAt: sanitizeTimestamp(snapshot.updatedAt)
    };
}

async function ensureDataFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readState() {
    try {
        const rawState = await fs.readFile(STATE_FILE, "utf8");
        return sanitizeState(JSON.parse(rawState));
    } catch (error) {
        if (error.code === "ENOENT") {
            return createEmptyState();
        }

        throw error;
    }
}

async function writeState(snapshot) {
    const safeState = sanitizeState(snapshot);
    await ensureDataFile();
    const tempFile = `${STATE_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(safeState, null, 2), "utf8");
    await fs.rename(tempFile, STATE_FILE);
    return safeState;
}

async function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", (chunk) => {
            body += chunk;
            if (body.length > 2 * 1024 * 1024) {
                reject(new Error("Request body too large."));
                request.destroy();
            }
        });

        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

async function handleApiRequest(request, response) {
    if (request.method === "GET") {
        const state = await readState();
        sendJSON(response, 200, { state });
        return;
    }

    if (request.method === "PUT") {
        const rawBody = await readRequestBody(request);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        const nextState = await writeState(payload.state || payload);
        sendJSON(response, 200, { state: nextState });
        return;
    }

    sendText(response, 405, "Method Not Allowed");
}

function resolveStaticPath(urlPathname) {
    const normalizedPath = urlPathname === "/" ? "/index.html" : urlPathname;
    const safePath = path.normalize(normalizedPath)
        .replace(/^(\.\.[/\\])+/, "")
        .replace(/^[/\\]+/, "");
    return path.join(ROOT_DIR, safePath);
}

async function handleStaticRequest(request, response, pathname) {
    const filePath = resolveStaticPath(pathname);

    if (!filePath.startsWith(ROOT_DIR)) {
        sendText(response, 403, "Forbidden");
        return;
    }

    try {
        const fileBuffer = await fs.readFile(filePath);
        const extension = path.extname(filePath).toLowerCase();
        response.writeHead(200, {
            "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
        });
        response.end(fileBuffer);
    } catch (error) {
        if (error.code === "ENOENT") {
            sendText(response, 404, "Not Found");
            return;
        }

        throw error;
    }
}

const server = http.createServer(async (request, response) => {
    try {
        const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

        if (requestUrl.pathname === "/api/state") {
            await handleApiRequest(request, response);
            return;
        }

        await handleStaticRequest(request, response, requestUrl.pathname);
    } catch (error) {
        console.error(error);
        sendJSON(response, 500, {
            error: "Internal Server Error"
        });
    }
});

server.listen(PORT, () => {
    console.log(`Rankion server running at http://localhost:${PORT}`);
});
