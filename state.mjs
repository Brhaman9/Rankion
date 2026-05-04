import { google } from "googleapis";

const MAX_LEVEL = 300;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORY_KEYS = new Set(["physique", "earnings", "intelligence"]);
const SHEET_NAMES = {
    state: "State",
    tasks: "Tasks",
    history: "History",
    activity: "Activity"
};
const HEADERS = {
    [SHEET_NAMES.state]: [["field", "value"]],
    [SHEET_NAMES.tasks]: [[
        "id",
        "name",
        "category",
        "repeatType",
        "targetPerWeek",
        "scheduledDaysJson",
        "completedDatesJson"
    ]],
    [SHEET_NAMES.history]: [[
        "date",
        "tasksCompleted",
        "xpEarned",
        "completedTasksJson"
    ]],
    [SHEET_NAMES.activity]: [[
        "timestamp",
        "eventType",
        "taskName",
        "category",
        "remark",
        "xpDelta",
        "currentLevel",
        "currentXp",
        "currentStreak",
        "detailsJson"
    ]]
};

export default async function handler(request) {
    const missingEnv = getMissingEnvVars();
    if (missingEnv.length) {
        return json(
            {
                error: `Google Sheets setup missing: ${missingEnv.join(", ")}`
            },
            503
        );
    }

    try {
        const sheets = createSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        await ensureSheetsExist(sheets, spreadsheetId);

        if (request.method === "GET") {
            const state = await readStateFromSpreadsheet(sheets, spreadsheetId);
            return json({ state }, 200);
        }

        if (request.method === "PUT") {
            let payload;

            try {
                payload = await request.json();
            } catch (error) {
                return json({ error: "Invalid JSON body." }, 400);
            }

            const state = sanitizeStateSnapshot(payload?.state || payload);
            const events = sanitizeSyncEvents(payload?.events);

            await writeStateToSpreadsheet(sheets, spreadsheetId, state);
            if (events.length) {
                await appendActivityEvents(sheets, spreadsheetId, events);
            }

            return json({ state }, 200);
        }

        return json({ error: "Method Not Allowed" }, 405);
    } catch (error) {
        const status = error?.code === 403 ? 403 : 500;
        return json(
            {
                error: error?.message || "Google Sheets request failed."
            },
            status
        );
    }
}

function getMissingEnvVars() {
    const requiredEnvVars = [
        "GOOGLE_SHEETS_SPREADSHEET_ID",
        "GOOGLE_SERVICE_ACCOUNT_EMAIL",
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
    ];

    return requiredEnvVars.filter((envName) => !process.env[envName]);
}

function createSheetsClient() {
    const privateKey = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    return google.sheets({
        version: "v4",
        auth
    });
}

async function ensureSheetsExist(sheets, spreadsheetId) {
    const existing = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties.title"
    });

    const existingTitles = new Set(
        (existing.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean)
    );
    const missingTitles = Object.values(SHEET_NAMES).filter((title) => !existingTitles.has(title));

    if (missingTitles.length) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: missingTitles.map((title) => ({
                    addSheet: {
                        properties: {
                            title
                        }
                    }
                }))
            }
        });
    }
}

async function readStateFromSpreadsheet(sheets, spreadsheetId) {
    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: [
            `${SHEET_NAMES.state}!A:B`,
            `${SHEET_NAMES.tasks}!A:G`,
            `${SHEET_NAMES.history}!A:D`
        ]
    });

    const valueRanges = response.data.valueRanges || [];
    const stateRows = valueRanges[0]?.values || [];
    const taskRows = valueRanges[1]?.values || [];
    const historyRows = valueRanges[2]?.values || [];
    const stateMap = rowsToMap(stateRows);

    return sanitizeStateSnapshot({
        updatedAt: stateMap.updatedAt,
        level: stateMap.level,
        xp: stateMap.xp,
        streak: stateMap.streak,
        tasks: parseTaskRows(taskRows),
        history: parseHistoryRows(historyRows)
    });
}

async function writeStateToSpreadsheet(sheets, spreadsheetId, state) {
    await Promise.all([
        sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${SHEET_NAMES.state}!A:B`
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${SHEET_NAMES.tasks}!A:G`
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${SHEET_NAMES.history}!A:D`
        })
    ]);

    const stateRows = [
        ...HEADERS[SHEET_NAMES.state],
        ["updatedAt", String(state.updatedAt)],
        ["level", String(state.level)],
        ["xp", String(state.xp)],
        ["streak", String(state.streak)],
        ["taskCount", String(state.tasks.length)],
        ["historyCount", String(state.history.length)]
    ];
    const taskRows = [
        ...HEADERS[SHEET_NAMES.tasks],
        ...state.tasks.map((task) => [
            task.id,
            task.name,
            task.category,
            task.repeatType,
            task.targetPerWeek == null ? "" : String(task.targetPerWeek),
            JSON.stringify(task.scheduledDays || []),
            JSON.stringify(task.completedDates || [])
        ])
    ];
    const historyRows = [
        ...HEADERS[SHEET_NAMES.history],
        ...state.history.map((entry) => [
            entry.date,
            String(entry.tasksCompleted),
            String(entry.xpEarned),
            JSON.stringify(entry.completedTasks || [])
        ])
    ];

    await Promise.all([
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAMES.state}!A1:B${stateRows.length}`,
            valueInputOption: "RAW",
            requestBody: {
                values: stateRows
            }
        }),
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAMES.tasks}!A1:G${taskRows.length}`,
            valueInputOption: "RAW",
            requestBody: {
                values: taskRows
            }
        }),
        sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAMES.history}!A1:D${historyRows.length}`,
            valueInputOption: "RAW",
            requestBody: {
                values: historyRows
            }
        })
    ]);
}

async function appendActivityEvents(sheets, spreadsheetId, events) {
    await ensureActivityHeader(sheets, spreadsheetId);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAMES.activity}!A:J`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
            values: events.map((event) => [
                event.timestamp,
                event.eventType,
                event.taskName,
                event.category,
                event.remark,
                String(event.xpDelta),
                String(event.currentLevel),
                String(event.currentXp),
                String(event.currentStreak),
                JSON.stringify(event.details || {})
            ])
        }
    });
}

async function ensureActivityHeader(sheets, spreadsheetId) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAMES.activity}!A1:J1`
    });

    const firstRow = response.data.values || [];
    if (firstRow.length) {
        return;
    }

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAMES.activity}!A1:J1`,
        valueInputOption: "RAW",
        requestBody: {
            values: HEADERS[SHEET_NAMES.activity]
        }
    });
}

function rowsToMap(rows) {
    return rows.slice(1).reduce((result, row) => {
        const key = row?.[0];
        if (key) {
            result[key] = row?.[1] || "";
        }
        return result;
    }, {});
}

function parseTaskRows(rows) {
    return rows.slice(1).map((row) => ({
        id: row[0] || "",
        name: row[1] || "",
        category: row[2] || "",
        repeatType: row[3] || "",
        targetPerWeek: row[4] === "" ? null : row[4],
        scheduledDays: parseJSON(row[5], []),
        completedDates: parseJSON(row[6], [])
    }));
}

function parseHistoryRows(rows) {
    return rows.slice(1).map((row) => ({
        date: row[0] || "",
        tasksCompleted: row[1] || 0,
        xpEarned: row[2] || 0,
        completedTasks: parseJSON(row[3], [])
    }));
}

function parseJSON(value, fallbackValue) {
    try {
        return value ? JSON.parse(value) : fallbackValue;
    } catch (error) {
        return fallbackValue;
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

function normalizeTimestampToIso(value) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
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

function sanitizeSyncEvents(events) {
    if (!Array.isArray(events)) {
        return [];
    }

    return events.reduce((result, event) => {
        if (!event || typeof event !== "object") {
            return result;
        }

        const eventType = sanitizeText(event.eventType, 60);
        if (!eventType) {
            return result;
        }

        result.push({
            timestamp: normalizeTimestampToIso(event.timestamp),
            eventType,
            taskName: sanitizeText(event.taskName, 80),
            category: CATEGORY_KEYS.has(event.category) ? event.category : "",
            remark: sanitizeText(event.remark, 220),
            xpDelta: Math.max(0, Math.floor(Number(event.xpDelta) || 0)),
            currentLevel: clampNumber(event.currentLevel, 1, MAX_LEVEL),
            currentXp: Math.max(0, Math.floor(Number(event.currentXp) || 0)),
            currentStreak: Math.max(0, Math.floor(Number(event.currentStreak) || 0)),
            details: event.details && typeof event.details === "object" ? event.details : {}
        });
        return result;
    }, []);
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
