from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.database import db_session
from app.srs import calculate_sm2
from app.parser import FLASHCARD_DEMO_TEMPLATE, parse_flashcards_text
from app.models import FlashcardCreate, FlashcardImportText, FlashcardBatchApprove, FlashcardReviewSubmit, FlashcardUpdate

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

@router.get("/demo-template")
def get_flashcard_demo_template():
    return {
        "template": FLASHCARD_DEMO_TEMPLATE,
        "instructions": "Paste your questions and answers using 'Q:' and 'A:'. Multiple cards can be separated by a blank line or '---'."
    }

@router.post("/parse-text")
def parse_flashcards_from_text(req: FlashcardImportText):
    cards = parse_flashcards_text(req.raw_text)
    if not cards:
        raise HTTPException(
            status_code=400,
            detail="Could not detect questions and answers. Please ensure questions start with 'Q:' and answers start with 'A:'."
        )

    formatted_cards = []
    for c in cards:
        formatted_cards.append({
            "subject_id": req.subject_id,
            "chapter_id": req.chapter_id,
            "topic_id": req.topic_id,
            "note_id": req.note_id,
            "card_type": c.get("card_type", "concept"),
            "question": c.get("question", ""),
            "answer": c.get("answer", ""),
            "source_reference": req.source_reference or "Pasted Q&A Notes",
            "context_snippet": ""
        })

    return {
        "success": True,
        "count": len(formatted_cards),
        "cards": formatted_cards
    }

@router.post("/import-text")
def import_flashcards_from_text(req: FlashcardImportText):
    cards = parse_flashcards_text(req.raw_text)
    if not cards:
        raise HTTPException(
            status_code=400,
            detail="Could not detect questions and answers. Format: Q: Question text\\nA: Answer text"
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today = datetime.now().strftime("%Y-%m-%d")
    inserted_ids = []

    with db_session() as conn:
        for c in cards:
            cursor = conn.execute("""
                INSERT INTO flashcards (
                    subject_id, chapter_id, topic_id, note_id, card_type,
                    question, answer, source_reference, context_snippet, status,
                    ease_factor, repetitions, interval_days, due_date,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 'approved', 2.5, 0, 0, ?, ?, ?);
            """, (
                req.subject_id, req.chapter_id, req.topic_id, req.note_id,
                c.get("card_type", "concept"), c["question"].strip(), c["answer"].strip(),
                req.source_reference or "User Q&A Notes", today, now, now
            ))
            inserted_ids.append(cursor.lastrowid)

    return {
        "success": True,
        "count": len(inserted_ids),
        "message": f"Successfully imported {len(inserted_ids)} flashcard(s) into SM-2 review queue.",
        "inserted_ids": inserted_ids
    }

@router.post("/generate")
def generate_draft_flashcards(
    note_id: Optional[int] = None,
    chapter_id: Optional[int] = None
):
    with db_session() as conn:
        if note_id:
            note = conn.execute("""
                SELECT n.*, s.name as subject_name, c.name as chapter_name
                FROM notes n
                JOIN subjects s ON s.id = n.subject_id
                JOIN chapters c ON c.id = n.chapter_id
                WHERE n.id = ?;
            """, (note_id,)).fetchone()
            if not note:
                raise HTTPException(status_code=404, detail="Note not found.")
            
            content = note["extracted_content"] or note["raw_content"]
            title = note["title"]
            subject_name = note["subject_name"]
            chapter_name = note["chapter_name"]
            subj_id = note["subject_id"]
            chap_id = note["chapter_id"]
            top_id = note["topic_id"]
        elif chapter_id:
            notes = conn.execute("""
                SELECT n.*, s.name as subject_name, c.name as chapter_name
                FROM notes n
                JOIN subjects s ON s.id = n.subject_id
                JOIN chapters c ON c.id = n.chapter_id
                WHERE n.chapter_id = ?;
            """, (chapter_id,)).fetchall()
            if not notes:
                raise HTTPException(status_code=400, detail="No notes found in this chapter. Please add notes first.")
            
            content = "\n\n".join([n["extracted_content"] or n["raw_content"] for n in notes])
            title = f"{notes[0]['chapter_name']} Consolidated Notes"
            subject_name = notes[0]["subject_name"]
            chapter_name = notes[0]["chapter_name"]
            subj_id = notes[0]["subject_id"]
            chap_id = chapter_id
            top_id = None
        else:
            raise HTTPException(status_code=400, detail="Must provide note_id or chapter_id.")

    # Parse directly from user notes
    parsed = parse_flashcards_text(content)
    
    draft_cards = []
    if parsed:
        for c in parsed:
            draft_cards.append({
                "subject_id": subj_id,
                "chapter_id": chap_id,
                "topic_id": top_id,
                "note_id": note_id,
                "card_type": c.get("card_type", "concept"),
                "question": c.get("question", ""),
                "answer": c.get("answer", ""),
                "source_reference": f"{title} | {chapter_name}",
                "context_snippet": ""
            })
    else:
        # Fallback to local rule extractor
        from app.ai_generator import AIGenerator
        local_cards = AIGenerator._generate_builtin_flashcards(content, title, subject_name, chapter_name)
        for c in local_cards:
            draft_cards.append({
                "subject_id": subj_id,
                "chapter_id": chap_id,
                "topic_id": top_id,
                "note_id": note_id,
                "card_type": c.get("card_type", "concept"),
                "question": c.get("question", ""),
                "answer": c.get("answer", ""),
                "source_reference": c.get("source_reference", f"{title} | {chapter_name}"),
                "context_snippet": c.get("context_snippet", "")
            })

    if not draft_cards:
        raise HTTPException(
            status_code=400,
            detail="No flashcards could be parsed from this note. Please use 'Q: ...' and 'A: ...' format or paste flashcards directly."
        )

    return {
        "success": True,
        "source": "Direct Note Q&A Extractor",
        "cards": draft_cards,
        "count": len(draft_cards)
    }

@router.post("/batch-approve")
def batch_approve_flashcards(req: FlashcardBatchApprove):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today = datetime.now().strftime("%Y-%m-%d")
    inserted_ids = []

    with db_session() as conn:
        for card in req.cards:
            cursor = conn.execute("""
                INSERT INTO flashcards (
                    subject_id, chapter_id, topic_id, note_id, card_type,
                    question, answer, source_reference, context_snippet, status,
                    ease_factor, repetitions, interval_days, due_date,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 2.5, 0, 0, ?, ?, ?);
            """, (
                card.subject_id, card.chapter_id, card.topic_id, card.note_id,
                card.card_type, card.question.strip(), card.answer.strip(),
                card.source_reference or "", card.context_snippet or "",
                today, now, now
            ))
            inserted_ids.append(cursor.lastrowid)

    return {"success": True, "count": len(inserted_ids), "inserted_ids": inserted_ids}

@router.get("")
def list_flashcards(
    chapter_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    due_only: bool = False,
    limit: int = 100
):
    today = datetime.now().strftime("%Y-%m-%d")
    with db_session() as conn:
        query = """
        SELECT f.*, s.name as subject_name, c.name as chapter_name, t.name as topic_name
        FROM flashcards f
        JOIN subjects s ON s.id = f.subject_id
        JOIN chapters c ON c.id = f.chapter_id
        LEFT JOIN topics t ON t.id = f.topic_id
        WHERE f.status = 'approved'
        """
        params = []
        if chapter_id:
            query += " AND f.chapter_id = ?"
            params.append(chapter_id)
        if subject_id:
            query += " AND f.subject_id = ?"
            params.append(subject_id)
        if due_only:
            query += " AND f.due_date <= ?"
            params.append(today)

        # Order by: overdue first, then lapses desc, then ease factor asc (hardest first)
        query += " ORDER BY f.due_date ASC, f.lapses DESC, f.ease_factor ASC LIMIT ?;"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

@router.get("/due-summary")
def get_due_summary():
    today = datetime.now().strftime("%Y-%m-%d")
    with db_session() as conn:
        overdue = conn.execute("SELECT COUNT(*) as count FROM flashcards WHERE status = 'approved' AND due_date < ?;", (today,)).fetchone()["count"]
        due_today = conn.execute("SELECT COUNT(*) as count FROM flashcards WHERE status = 'approved' AND due_date = ?;", (today,)).fetchone()["count"]
        total_cards = conn.execute("SELECT COUNT(*) as count FROM flashcards WHERE status = 'approved';").fetchone()["count"]
        reviewed_today = conn.execute("""
            SELECT COUNT(DISTINCT flashcard_id) as count 
            FROM flashcard_reviews 
            WHERE reviewed_at LIKE ?;
        """, (f"{today}%",)).fetchone()["count"]
        
        return {
            "overdue_count": overdue,
            "due_today_count": due_today,
            "total_due": overdue + due_today,
            "total_cards": total_cards,
            "reviewed_today": reviewed_today
        }

@router.post("/review")
def submit_flashcard_review(req: FlashcardReviewSubmit):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        card = conn.execute("SELECT * FROM flashcards WHERE id = ?;", (req.card_id,)).fetchone()
        if not card:
            raise HTTPException(status_code=404, detail="Flashcard not found.")

        # Compute next SM-2 state
        sm2_result = calculate_sm2(
            rating=req.rating,
            repetitions=card["repetitions"],
            interval_days=card["interval_days"],
            ease_factor=card["ease_factor"],
            current_date=datetime.now()
        )

        lapses_inc = 1 if sm2_result["lapse"] else 0
        consec_correct = (card["consecutive_correct"] + 1) if req.rating >= 3 else 0

        # Update card in database
        conn.execute("""
            UPDATE flashcards SET
                ease_factor = ?,
                repetitions = ?,
                interval_days = ?,
                due_date = ?,
                last_reviewed_at = ?,
                last_rating = ?,
                consecutive_correct = ?,
                total_reviews = total_reviews + 1,
                lapses = lapses + ?,
                updated_at = ?
            WHERE id = ?;
        """, (
            sm2_result["ease_factor"],
            sm2_result["repetitions"],
            sm2_result["interval_days"],
            sm2_result["due_date"],
            sm2_result["last_reviewed_at"],
            req.rating,
            consec_correct,
            lapses_inc,
            now,
            req.card_id
        ))

        # Log review event
        conn.execute("""
            INSERT INTO flashcard_reviews (
                flashcard_id, rating, ease_factor_before, ease_factor_after,
                interval_before, interval_after, review_time_ms, reviewed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            req.card_id, req.rating, card["ease_factor"], sm2_result["ease_factor"],
            card["interval_days"], sm2_result["interval_days"], req.review_time_ms or 0, now
        ))

        # Log into study session
        conn.execute("""
            INSERT INTO study_sessions (
                session_type, subject_id, chapter_id, items_completed, duration_seconds, notes, created_at
            ) VALUES ('flashcards', ?, ?, 1, ?, 'Active recall flashcard revision', ?);
        """, (card["subject_id"], card["chapter_id"], int((req.review_time_ms or 0) / 1000), now))

        updated_card = conn.execute("SELECT * FROM flashcards WHERE id = ?;", (req.card_id,)).fetchone()
        return {
            "success": True,
            "card": dict(updated_card),
            "sm2": sm2_result
        }

@router.put("/{card_id}")
def update_flashcard(card_id: int, req: FlashcardUpdate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        row = conn.execute("SELECT * FROM flashcards WHERE id = ?;", (card_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Flashcard not found.")

        updates = []
        params = []
        if req.question is not None:
            updates.append("question = ?")
            params.append(req.question.strip())
        if req.answer is not None:
            updates.append("answer = ?")
            params.append(req.answer.strip())
        if req.card_type is not None:
            updates.append("card_type = ?")
            params.append(req.card_type)
        if req.source_reference is not None:
            updates.append("source_reference = ?")
            params.append(req.source_reference.strip())
        if req.status is not None:
            updates.append("status = ?")
            params.append(req.status)

        if updates:
            updates.append("updated_at = ?")
            params.append(now)
            params.append(card_id)
            conn.execute(f"UPDATE flashcards SET {', '.join(updates)} WHERE id = ?;", params)

        updated_row = conn.execute("SELECT * FROM flashcards WHERE id = ?;", (card_id,)).fetchone()
        return dict(updated_row)

@router.delete("/{card_id}")
def delete_flashcard(card_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM flashcards WHERE id = ?;", (card_id,))
        return {"success": True, "message": "Flashcard deleted successfully."}
