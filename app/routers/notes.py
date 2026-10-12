import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.database import db_session
from app.config import UPLOAD_DIR
from app.doc_processor import extract_from_pdf, extract_from_txt, clean_extracted_text
from app.models import NoteCreatePasted, NoteUpdate

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.get("")
def list_notes(chapter_id: Optional[int] = None, subject_id: Optional[int] = None):
    with db_session() as conn:
        query = """
        SELECT n.*, s.name as subject_name, c.name as chapter_name, t.name as topic_name,
               (SELECT COUNT(*) FROM flashcards f WHERE f.note_id = n.id) as generated_cards_count,
               (SELECT COUNT(*) FROM practice_questions pq WHERE pq.note_id = n.id) as generated_questions_count
        FROM notes n
        JOIN subjects s ON s.id = n.subject_id
        JOIN chapters c ON c.id = n.chapter_id
        LEFT JOIN topics t ON t.id = n.topic_id
        WHERE 1=1
        """
        params = []
        if chapter_id:
            query += " AND n.chapter_id = ?"
            params.append(chapter_id)
        if subject_id:
            query += " AND n.subject_id = ?"
            params.append(subject_id)
        query += " ORDER BY n.id DESC;"
        
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

@router.get("/{note_id}")
def get_note(note_id: int):
    with db_session() as conn:
        row = conn.execute("""
            SELECT n.*, s.name as subject_name, c.name as chapter_name, t.name as topic_name
            FROM notes n
            JOIN subjects s ON s.id = n.subject_id
            JOIN chapters c ON c.id = n.chapter_id
            LEFT JOIN topics t ON t.id = n.topic_id
            WHERE n.id = ?;
        """, (note_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Note not found.")
        return dict(row)

@router.post("/paste")
def create_pasted_note(req: NoteCreatePasted):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cleaned_content = clean_extracted_text(req.content)
    
    with db_session() as conn:
        # Check chapter exists
        ch = conn.execute("SELECT id FROM chapters WHERE id = ?;", (req.chapter_id,)).fetchone()
        if not ch:
            raise HTTPException(status_code=404, detail="Chapter not found.")

        cursor = conn.execute("""
            INSERT INTO notes (
                subject_id, chapter_id, topic_id, title, source_type,
                raw_content, extracted_content, extraction_status, extraction_notes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'pasted', ?, ?, 'processed', 'Pasted study note', ?, ?);
        """, (req.subject_id, req.chapter_id, req.topic_id, req.title.strip(), req.content, cleaned_content, now, now))
        
        new_id = cursor.lastrowid
        note = conn.execute("SELECT * FROM notes WHERE id = ?;", (new_id,)).fetchone()
        return dict(note)

@router.post("/upload")
async def upload_document_note(
    subject_id: int = Form(...),
    chapter_id: int = Form(...),
    topic_id: Optional[int] = Form(None),
    title: str = Form(...),
    file: UploadFile = File(...)
):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail="Supported file formats: PDF (.pdf) and Text files (.txt, .md).")

    # Save to disk
    timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp_prefix}_{file.filename}"
    save_path = UPLOAD_DIR / safe_filename

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    if file_ext == ".pdf":
        extraction = extract_from_pdf(save_path)
        source_type = "pdf"
    else:
        extraction = extract_from_txt(save_path)
        source_type = "txt"

    with db_session() as conn:
        cursor = conn.execute("""
            INSERT INTO notes (
                subject_id, chapter_id, topic_id, title, source_type,
                file_path, original_filename, raw_content, extracted_content,
                extraction_status, extraction_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            subject_id, chapter_id, topic_id, title.strip(), source_type,
            str(save_path), file.filename, extraction["content"], extraction["content"],
            extraction["status"], extraction["notes"], now, now
        ))
        new_id = cursor.lastrowid
        note = conn.execute("SELECT * FROM notes WHERE id = ?;", (new_id,)).fetchone()
        return dict(note)

@router.put("/{note_id}")
def update_note(note_id: int, req: NoteUpdate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        row = conn.execute("SELECT * FROM notes WHERE id = ?;", (note_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Note not found.")

        updates = []
        params = []
        if req.title is not None:
            updates.append("title = ?")
            params.append(req.title.strip())
        if req.extracted_content is not None:
            updates.append("extracted_content = ?")
            params.append(req.extracted_content)
            updates.append("extraction_status = 'processed'") # marked reviewed
        if req.topic_id is not None:
            updates.append("topic_id = ?")
            params.append(req.topic_id if req.topic_id > 0 else None)

        if updates:
            updates.append("updated_at = ?")
            params.append(now)
            params.append(note_id)
            conn.execute(f"UPDATE notes SET {', '.join(updates)} WHERE id = ?;", params)

        updated_row = conn.execute("SELECT * FROM notes WHERE id = ?;", (note_id,)).fetchone()
        return dict(updated_row)

@router.delete("/{note_id}")
def delete_note(note_id: int):
    with db_session() as conn:
        row = conn.execute("SELECT title, file_path FROM notes WHERE id = ?;", (note_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Note not found.")

        # If file on disk, remove it
        if row["file_path"]:
            try:
                p = Path(row["file_path"])
                if p.exists():
                    p.unlink()
            except Exception:
                pass

        conn.execute("DELETE FROM notes WHERE id = ?;", (note_id,))
        return {"success": True, "message": f"Note '{row['title']}' deleted successfully."}
