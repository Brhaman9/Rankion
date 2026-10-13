import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.database import db_session
from app.models import SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_settings():
    with db_session() as conn:
        rows = conn.execute("SELECT key, value FROM settings;").fetchall()
        settings = {r["key"]: r["value"] for r in rows}
        return settings

@router.put("")
def update_settings(req: SettingsUpdate):
    with db_session() as conn:
        if req.passcode is not None:
            val = req.passcode.strip()
            if len(val) < 4:
                raise HTTPException(status_code=400, detail="Passcode must be at least 4 characters.")
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('passcode', ?);", (val,))

        if req.daily_revision_limit is not None:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_revision_limit', ?);", (str(req.daily_revision_limit),))

        if req.daily_new_cards is not None:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_new_cards', ?);", (str(req.daily_new_cards),))

        if req.daily_target_minutes is not None:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_target_minutes', ?);", (str(req.daily_target_minutes),))

        if req.theme is not None:
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', ?);", (req.theme,))

    return {"success": True, "message": "Settings updated successfully."}

@router.get("/backup")
def export_database_backup():
    """
    Exports complete database content as portable JSON backup.
    """
    with db_session() as conn:
        tables = [
            "subjects", "chapters", "topics", "notes", "flashcards",
            "flashcard_reviews", "practice_questions", "test_attempts",
            "test_responses", "mistakes", "study_sessions", "settings"
        ]
        backup_data = {
            "exported_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "version": "1.0",
            "tables": {}
        }
        for table in tables:
            rows = conn.execute(f"SELECT * FROM {table};").fetchall()
            backup_data["tables"][table] = [dict(r) for r in rows]

        return backup_data

@router.post("/restore")
async def restore_database_backup(file: UploadFile = File(...)):
    """
    Restores database from an uploaded JSON backup file.
    """
    content = await file.read()
    try:
        backup = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file: {str(e)}")

    if "tables" not in backup:
        raise HTTPException(status_code=400, detail="Invalid backup file format: 'tables' key missing.")

    with db_session() as conn:
        # Disable foreign keys temporarily during restore
        conn.execute("PRAGMA foreign_keys = OFF;")
        
        tables = [
            "subjects", "chapters", "topics", "notes", "flashcards",
            "flashcard_reviews", "practice_questions", "test_attempts",
            "test_responses", "mistakes", "study_sessions", "settings"
        ]
        for table in tables:
            conn.execute(f"DELETE FROM {table};")
            rows = backup["tables"].get(table, [])
            if rows:
                cols = list(rows[0].keys())
                placeholders = ",".join(["?"] * len(cols))
                insert_sql = f"INSERT INTO {table} ({','.join(cols)}) VALUES ({placeholders});"
                for r in rows:
                    conn.execute(insert_sql, [r[col] for col in cols])

        conn.execute("PRAGMA foreign_keys = ON;")

    return {"success": True, "message": "Database restored successfully."}
