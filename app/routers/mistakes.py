from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from app.database import db_session
from app.models import MistakeUpdate

router = APIRouter(prefix="/api/mistakes", tags=["mistakes"])

@router.get("")
def list_mistakes(
    subject_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    status: Optional[str] = None, # 'unresolved', 'in_progress', 'mastered'
    error_type: Optional[str] = None
):
    with db_session() as conn:
        query = """
        SELECT m.*, s.name as subject_name, c.name as chapter_name, pq.question_text, pq.options_json
        FROM mistakes m
        JOIN subjects s ON s.id = m.subject_id
        JOIN chapters c ON c.id = m.chapter_id
        JOIN practice_questions pq ON pq.id = m.question_id
        WHERE 1=1
        """
        params = []
        if subject_id:
            query += " AND m.subject_id = ?"
            params.append(subject_id)
        if chapter_id:
            query += " AND m.chapter_id = ?"
            params.append(chapter_id)
        if status:
            query += " AND m.status = ?"
            params.append(status)
        if error_type:
            query += " AND m.error_type = ?"
            params.append(error_type)

        query += " ORDER BY m.repeated_count DESC, m.id DESC;"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

@router.put("/{mistake_id}")
def update_mistake(mistake_id: int, req: MistakeUpdate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        row = conn.execute("SELECT * FROM mistakes WHERE id = ?;", (mistake_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Mistake record not found.")

        updates = []
        params = []
        if req.error_type is not None:
            updates.append("error_type = ?")
            params.append(req.error_type)
        if req.user_reflection is not None:
            updates.append("user_reflection = ?")
            params.append(req.user_reflection.strip())
        if req.status is not None:
            updates.append("status = ?")
            params.append(req.status)

        if updates:
            updates.append("last_reviewed_at = ?")
            params.append(now)
            params.append(mistake_id)
            conn.execute(f"UPDATE mistakes SET {', '.join(updates)} WHERE id = ?;", params)

        updated_row = conn.execute("SELECT * FROM mistakes WHERE id = ?;", (mistake_id,)).fetchone()
        return dict(updated_row)

@router.delete("/{mistake_id}")
def delete_mistake(mistake_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM mistakes WHERE id = ?;", (mistake_id,))
        return {"success": True, "message": "Mistake deleted."}

@router.get("/stats")
def get_mistake_stats():
    with db_session() as conn:
        unresolved = conn.execute("SELECT COUNT(*) as count FROM mistakes WHERE status = 'unresolved';").fetchone()["count"]
        in_progress = conn.execute("SELECT COUNT(*) as count FROM mistakes WHERE status = 'in_progress';").fetchone()["count"]
        mastered = conn.execute("SELECT COUNT(*) as count FROM mistakes WHERE status = 'mastered';").fetchone()["count"]
        
        # Breakdown by error type
        types = conn.execute("""
            SELECT error_type, COUNT(*) as count 
            FROM mistakes 
            WHERE status != 'mastered' 
            GROUP BY error_type;
        """).fetchall()

        # Most error-prone chapters
        top_chapters = conn.execute("""
            SELECT c.name as chapter_name, s.name as subject_name, COUNT(m.id) as mistake_count
            FROM mistakes m
            JOIN chapters c ON c.id = m.chapter_id
            JOIN subjects s ON s.id = m.subject_id
            WHERE m.status != 'mastered'
            GROUP BY m.chapter_id
            ORDER BY mistake_count DESC
            LIMIT 5;
        """).fetchall()

        return {
            "unresolved_count": unresolved,
            "in_progress_count": in_progress,
            "mastered_count": mastered,
            "by_type": [dict(t) for t in types],
            "top_chapters": [dict(tc) for tc in top_chapters]
        }
