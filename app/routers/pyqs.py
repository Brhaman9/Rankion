import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from app.database import db_session
from app.models import PYQCreate

router = APIRouter(prefix="/api/pyqs", tags=["pyqs"])

@router.get("")
def list_pyqs(
    subject_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    exam_year: Optional[str] = None
):
    with db_session() as conn:
        query = """
        SELECT pq.*, s.name as subject_name, c.name as chapter_name
        FROM practice_questions pq
        JOIN subjects s ON s.id = pq.subject_id
        JOIN chapters c ON c.id = pq.chapter_id
        WHERE pq.is_pyq = 1
        """
        params = []
        if subject_id:
            query += " AND pq.subject_id = ?"
            params.append(subject_id)
        if chapter_id:
            query += " AND pq.chapter_id = ?"
            params.append(chapter_id)
        if exam_year:
            query += " AND pq.pyq_year = ?"
            params.append(exam_year)

        query += " ORDER BY pq.pyq_year DESC, pq.id DESC;"
        rows = conn.execute(query, params).fetchall()
        
        result = []
        for r in rows:
            item = dict(r)
            item["options"] = json.loads(r["options_json"]) if r["options_json"] else []
            result.append(item)
        return result

@router.post("")
def create_pyq(req: PYQCreate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        # Check chapter
        ch = conn.execute("SELECT id FROM chapters WHERE id = ?;", (req.chapter_id,)).fetchone()
        if not ch:
            raise HTTPException(status_code=404, detail="Chapter not found.")

        cursor = conn.execute("""
            INSERT INTO practice_questions (
                subject_id, chapter_id, topic_id, question_text, question_type,
                options_json, correct_answer, explanation, source_reference,
                difficulty, is_pyq, pyq_exam, pyq_year, verification_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Medium', 1, ?, ?, ?, ?);
        """, (
            req.subject_id, req.chapter_id, req.topic_id, req.question_text.strip(),
            req.question_type, json.dumps(req.options), req.correct_answer.strip(),
            req.explanation.strip(), req.source_reference or f"{req.pyq_exam} ({req.pyq_year})",
            req.pyq_exam.strip(), req.pyq_year.strip(), req.verification_status, now
        ))
        new_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM practice_questions WHERE id = ?;", (new_id,)).fetchone()
        item = dict(row)
        item["options"] = json.loads(item["options_json"])
        return item

@router.delete("/{pyq_id}")
def delete_pyq(pyq_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM practice_questions WHERE id = ? AND is_pyq = 1;", (pyq_id,))
        return {"success": True, "message": "PYQ deleted."}
