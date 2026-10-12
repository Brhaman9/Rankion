from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.database import db_session
from app.models import SubjectCreate, SubjectUpdate, ChapterCreate, ChapterUpdate, TopicCreate

router = APIRouter(prefix="/api/subjects", tags=["subjects"])

@router.get("")
def list_subjects(include_archived: bool = False):
    with db_session() as conn:
        query = """
        SELECT 
            s.*,
            COUNT(DISTINCT c.id) as chapter_count,
            COUNT(DISTINCT n.id) as note_count,
            COUNT(DISTINCT f.id) as flashcard_count,
            COUNT(DISTINCT m.id) as mistake_count
        FROM subjects s
        LEFT JOIN chapters c ON c.subject_id = s.id
        LEFT JOIN notes n ON n.subject_id = s.id
        LEFT JOIN flashcards f ON f.subject_id = s.id AND f.status = 'approved'
        LEFT JOIN mistakes m ON m.subject_id = s.id AND m.status != 'mastered'
        """
        if not include_archived:
            query += " WHERE s.is_archived = 0"
        query += " GROUP BY s.id ORDER BY s.name ASC;"
        
        rows = conn.execute(query).fetchall()
        return [dict(row) for row in rows]

@router.post("")
def create_subject(req: SubjectCreate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        existing = conn.execute("SELECT id FROM subjects WHERE LOWER(name) = LOWER(?);", (req.name.strip(),)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="A subject with this name already exists.")

        cursor = conn.execute(
            "INSERT INTO subjects (name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
            (req.name.strip(), req.description.strip(), req.color, now, now)
        )
        new_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM subjects WHERE id = ?;", (new_id,)).fetchone()
        return dict(row)

@router.put("/{subject_id}")
def update_subject(subject_id: int, req: SubjectUpdate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        row = conn.execute("SELECT * FROM subjects WHERE id = ?;", (subject_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Subject not found.")

        updates = []
        params = []
        if req.name is not None:
            updates.append("name = ?")
            params.append(req.name.strip())
        if req.description is not None:
            updates.append("description = ?")
            params.append(req.description.strip())
        if req.color is not None:
            updates.append("color = ?")
            params.append(req.color)
        if req.is_archived is not None:
            updates.append("is_archived = ?")
            params.append(1 if req.is_archived else 0)

        if updates:
            updates.append("updated_at = ?")
            params.append(now)
            params.append(subject_id)
            conn.execute(f"UPDATE subjects SET {', '.join(updates)} WHERE id = ?;", params)

        updated_row = conn.execute("SELECT * FROM subjects WHERE id = ?;", (subject_id,)).fetchone()
        return dict(updated_row)

@router.delete("/{subject_id}")
def delete_subject(subject_id: int):
    with db_session() as conn:
        row = conn.execute("SELECT name FROM subjects WHERE id = ?;", (subject_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Subject not found.")
        conn.execute("DELETE FROM subjects WHERE id = ?;", (subject_id,))
        return {"success": True, "message": f"Subject '{row['name']}' and its contents deleted successfully."}

# =============================================================================
# CHAPTERS & TOPICS
# =============================================================================

@router.get("/{subject_id}/chapters")
def list_subject_chapters(subject_id: int):
    today = datetime.now().strftime("%Y-%m-%d")
    with db_session() as conn:
        chapters = conn.execute("""
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM topics t WHERE t.chapter_id = c.id) as topic_count,
                (SELECT COUNT(*) FROM notes n WHERE n.chapter_id = c.id) as note_count,
                (SELECT COUNT(*) FROM flashcards f WHERE f.chapter_id = c.id AND f.status = 'approved') as flashcard_count,
                (SELECT COUNT(*) FROM flashcards f WHERE f.chapter_id = c.id AND f.status = 'approved' AND f.due_date <= ?) as due_cards_count,
                (SELECT COUNT(*) FROM practice_questions pq WHERE pq.chapter_id = c.id) as question_count,
                (SELECT COUNT(*) FROM mistakes m WHERE m.chapter_id = c.id AND m.status != 'mastered') as unresolved_mistakes,
                (SELECT ROUND(AVG(ta.accuracy), 1) FROM test_attempts ta WHERE ta.chapter_id = c.id AND ta.status = 'completed') as avg_accuracy
            FROM chapters c
            WHERE c.subject_id = ?
            ORDER BY c.order_index ASC, c.id ASC;
        """, (today, subject_id)).fetchall()

        result = []
        for ch in chapters:
            ch_dict = dict(ch)
            topics = conn.execute("SELECT * FROM topics WHERE chapter_id = ? ORDER BY name ASC;", (ch["id"],)).fetchall()
            ch_dict["topics"] = [dict(t) for t in topics]
            result.append(ch_dict)

        return result

chapter_router = APIRouter(prefix="/api/chapters", tags=["chapters"])

@chapter_router.post("")
def create_chapter(req: ChapterCreate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        # Check subject exists
        sub = conn.execute("SELECT id FROM subjects WHERE id = ?;", (req.subject_id,)).fetchone()
        if not sub:
            raise HTTPException(status_code=404, detail="Subject does not exist.")

        existing = conn.execute("SELECT id FROM chapters WHERE subject_id = ? AND LOWER(name) = LOWER(?);", 
                                (req.subject_id, req.name.strip())).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="A chapter with this name already exists in this subject.")

        cursor = conn.execute(
            "INSERT INTO chapters (subject_id, name, description, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);",
            (req.subject_id, req.name.strip(), req.description.strip(), req.order_index or 0, now, now)
        )
        new_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM chapters WHERE id = ?;", (new_id,)).fetchone()
        return dict(row)

@chapter_router.put("/{chapter_id}")
def update_chapter(chapter_id: int, req: ChapterUpdate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        row = conn.execute("SELECT * FROM chapters WHERE id = ?;", (chapter_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Chapter not found.")

        updates = []
        params = []
        if req.name is not None:
            updates.append("name = ?")
            params.append(req.name.strip())
        if req.description is not None:
            updates.append("description = ?")
            params.append(req.description.strip())
        if req.status is not None:
            updates.append("status = ?")
            params.append(req.status)
        if req.order_index is not None:
            updates.append("order_index = ?")
            params.append(req.order_index)

        if updates:
            updates.append("updated_at = ?")
            params.append(now)
            params.append(chapter_id)
            conn.execute(f"UPDATE chapters SET {', '.join(updates)} WHERE id = ?;", params)

        updated_row = conn.execute("SELECT * FROM chapters WHERE id = ?;", (chapter_id,)).fetchone()
        return dict(updated_row)

@chapter_router.delete("/{chapter_id}")
def delete_chapter(chapter_id: int):
    with db_session() as conn:
        row = conn.execute("SELECT name FROM chapters WHERE id = ?;", (chapter_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Chapter not found.")
        conn.execute("DELETE FROM chapters WHERE id = ?;", (chapter_id,))
        return {"success": True, "message": f"Chapter '{row['name']}' deleted successfully."}

topic_router = APIRouter(prefix="/api/topics", tags=["topics"])

@topic_router.post("")
def create_topic(req: TopicCreate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        cursor = conn.execute(
            "INSERT INTO topics (chapter_id, name, description, created_at) VALUES (?, ?, ?, ?);",
            (req.chapter_id, req.name.strip(), req.description.strip(), now)
        )
        new_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM topics WHERE id = ?;", (new_id,)).fetchone()
        return dict(row)

@topic_router.delete("/{topic_id}")
def delete_topic(topic_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM topics WHERE id = ?;", (topic_id,))
        return {"success": True, "message": "Topic deleted successfully."}
