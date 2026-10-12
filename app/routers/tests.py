import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from app.database import db_session
from app.parser import PRACTICE_QUESTION_DEMO_TEMPLATE, parse_practice_questions_text
from app.models import TestGenerateRequest, TestResponseSave, TestSubmitRequest, QuestionImportText

router = APIRouter(prefix="/api/tests", tags=["tests"])

@router.get("/demo-template")
def get_practice_questions_demo_template():
    return {
        "template": PRACTICE_QUESTION_DEMO_TEMPLATE,
        "instructions": "Paste your practice questions with options A), B), C), D), Correct answer, and optional explanation. Separate questions with '---'."
    }

@router.post("/import-text")
def import_questions_from_text(req: QuestionImportText):
    questions = parse_practice_questions_text(req.raw_text)
    if not questions:
        raise HTTPException(
            status_code=400,
            detail="Could not detect questions and options. Please format using Q: ..., A) ..., B) ..., C) ..., D) ..., Correct: ..."
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    inserted_ids = []

    with db_session() as conn:
        for q in questions:
            cursor = conn.execute("""
                INSERT INTO practice_questions (
                    subject_id, chapter_id, topic_id, note_id, question_text, question_type,
                    options_json, correct_answer, explanation, source_reference,
                    topic_name, difficulty, is_pyq, verification_status, created_at
                ) VALUES (?, ?, ?, ?, ?, 'mcq', ?, ?, ?, ?, ?, ?, 0, 'user_practice', ?);
            """, (
                req.subject_id, req.chapter_id, req.topic_id, req.note_id,
                q["question_text"], json.dumps(q["options"]), q["correct_answer"],
                q.get("explanation", ""), req.source_reference or "User Pasted Questions",
                q.get("topic_name", ""), q.get("difficulty", "Medium"), now
            ))
            inserted_ids.append(cursor.lastrowid)

    return {
        "success": True,
        "count": len(inserted_ids),
        "message": f"Successfully imported {len(inserted_ids)} practice question(s) into this chapter.",
        "inserted_ids": inserted_ids
    }

@router.get("/questions")
def get_practice_questions(subject_id: Optional[int] = None, chapter_id: Optional[int] = None, limit: int = 250):
    with db_session() as conn:
        query = """
            SELECT pq.*, s.name as subject_name, c.name as chapter_name
            FROM practice_questions pq
            JOIN subjects s ON s.id = pq.subject_id
            JOIN chapters c ON c.id = pq.chapter_id
            WHERE 1=1
        """
        params = []
        if subject_id:
            query += " AND pq.subject_id = ?"
            params.append(subject_id)
        if chapter_id:
            query += " AND pq.chapter_id = ?"
            params.append(chapter_id)

        query += " ORDER BY pq.id DESC LIMIT ?;"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
        result = []
        for r in rows:
            item = dict(r)
            try:
                item["options"] = json.loads(r["options_json"]) if r["options_json"] else []
            except Exception:
                item["options"] = []
            result.append(item)
        return result

@router.delete("/questions/{question_id}")
def delete_practice_question(question_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM practice_questions WHERE id = ?;", (question_id,))
    return {"success": True, "message": "Question deleted successfully."}

@router.post("/generate-and-start")
def generate_and_start_test(req: TestGenerateRequest):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        # Chapter / Subject info
        ch_name = "Subject Practice"
        subject_name = ""
        chapter_id_val = req.chapter_id or 0

        if chapter_id_val > 0:
            ch = conn.execute("""
                SELECT c.*, s.name as subject_name 
                FROM chapters c 
                JOIN subjects s ON s.id = c.subject_id 
                WHERE c.id = ?;
            """, (chapter_id_val,)).fetchone()
            if not ch:
                raise HTTPException(status_code=404, detail="Chapter not found.")
            ch_name = ch["name"]
            subject_name = ch["subject_name"]
        else:
            sub = conn.execute("SELECT * FROM subjects WHERE id = ?;", (req.subject_id,)).fetchone()
            if not sub:
                raise HTTPException(status_code=404, detail="Subject not found.")
            subject_name = sub["name"]
            ch_name = f"{subject_name} (All Chapters)"

        question_ids = []

        # If include_mistakes, fetch previously incorrect questions
        if req.include_mistakes:
            mistake_limit = max(1, int(req.num_questions / 2))
            if chapter_id_val > 0:
                mistake_qs = conn.execute("""
                    SELECT question_id FROM mistakes 
                    WHERE chapter_id = ? AND status != 'mastered' 
                    LIMIT ?;
                """, (chapter_id_val, mistake_limit)).fetchall()
            else:
                mistake_qs = conn.execute("""
                    SELECT question_id FROM mistakes 
                    WHERE subject_id = ? AND status != 'mastered' 
                    LIMIT ?;
                """, (req.subject_id, mistake_limit)).fetchall()
            for m in mistake_qs:
                question_ids.append(m["question_id"])

        # Fetch existing practice questions
        needed = max(1, req.num_questions - len(question_ids))
        if chapter_id_val > 0:
            if question_ids:
                placeholders = ",".join(["?"] * len(question_ids))
                existing_qs = conn.execute(f"""
                    SELECT id FROM practice_questions 
                    WHERE chapter_id = ? AND id NOT IN ({placeholders})
                    ORDER BY RANDOM()
                    LIMIT ?;
                """, [chapter_id_val] + question_ids + [needed]).fetchall()
            else:
                existing_qs = conn.execute("""
                    SELECT id FROM practice_questions 
                    WHERE chapter_id = ?
                    ORDER BY RANDOM()
                    LIMIT ?;
                """, (chapter_id_val, needed)).fetchall()
        else:
            if question_ids:
                placeholders = ",".join(["?"] * len(question_ids))
                existing_qs = conn.execute(f"""
                    SELECT id FROM practice_questions 
                    WHERE subject_id = ? AND id NOT IN ({placeholders})
                    ORDER BY RANDOM()
                    LIMIT ?;
                """, [req.subject_id] + question_ids + [needed]).fetchall()
            else:
                existing_qs = conn.execute("""
                    SELECT id FROM practice_questions 
                    WHERE subject_id = ?
                    ORDER BY RANDOM()
                    LIMIT ?;
                """, (req.subject_id, needed)).fetchall()

        for eq in existing_qs:
            question_ids.append(eq["id"])

        # If chapter specific has fewer than requested, fallback to any other questions in the subject
        if len(question_ids) < req.num_questions and chapter_id_val > 0:
            remaining_needed = req.num_questions - len(question_ids)
            if question_ids:
                placeholders = ",".join(["?"] * len(question_ids))
                sub_qs = conn.execute(f"""
                    SELECT id FROM practice_questions 
                    WHERE subject_id = ? AND id NOT IN ({placeholders})
                    ORDER BY RANDOM()
                    LIMIT ?;
                """, [req.subject_id] + question_ids + [remaining_needed]).fetchall()
            else:
                sub_qs = conn.execute("""
                    SELECT id FROM practice_questions 
                    WHERE subject_id = ?
                    ORDER BY RANDOM()
                    LIMIT ?;
                """, (req.subject_id, remaining_needed)).fetchall()
            for sq in sub_qs:
                question_ids.append(sq["id"])

        # If still no questions, check if notes have parseable MCQs
        if not question_ids:
            if chapter_id_val > 0:
                notes = conn.execute("SELECT * FROM notes WHERE chapter_id = ?;", (chapter_id_val,)).fetchall()
            else:
                notes = conn.execute("SELECT * FROM notes WHERE subject_id = ?;", (req.subject_id,)).fetchall()

            for n in notes:
                content = n["extracted_content"] or n["raw_content"]
                parsed_qs = parse_practice_questions_text(content)
                for pq in parsed_qs:
                    cursor = conn.execute("""
                        INSERT INTO practice_questions (
                            subject_id, chapter_id, note_id, question_text, question_type,
                            options_json, correct_answer, explanation, source_reference,
                            topic_name, difficulty, is_pyq, verification_status, created_at
                        ) VALUES (?, ?, ?, ?, 'mcq', ?, ?, ?, ?, ?, ?, 0, 'user_practice', ?);
                    """, (
                        n["subject_id"], n["chapter_id"], n["id"],
                        pq["question_text"], json.dumps(pq["options"]), pq["correct_answer"],
                        pq.get("explanation", ""), n["title"],
                        pq.get("topic_name", ch_name), pq.get("difficulty", "Medium"), now
                    ))
                    question_ids.append(cursor.lastrowid)

        if not question_ids:
            raise HTTPException(
                status_code=400,
                detail="No practice questions found. Click '+ Paste Questions (MCQs)' to paste questions for this chapter or subject."
            )

        # Step 2: Create Test Attempt record
        title = f"{ch_name} - Practice Test" if req.test_mode == "practice" else f"{ch_name} - Timed Examination"
        cursor = conn.execute("""
            INSERT INTO test_attempts (
                title, test_mode, subject_id, chapter_id, question_count,
                time_limit_minutes, status, started_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?);
        """, (title, req.test_mode, req.subject_id, chapter_id_val, len(question_ids), max(10, len(question_ids) * 2), now))
        attempt_id = cursor.lastrowid

        # Step 3: Initialize test_responses
        for q_id in question_ids:
            conn.execute("""
                INSERT INTO test_responses (attempt_id, question_id, created_at)
                VALUES (?, ?, ?);
            """, (attempt_id, q_id, now))

    return get_attempt_state(attempt_id)

@router.get("/attempt/{attempt_id}")
def get_attempt_state(attempt_id: int):
    with db_session() as conn:
        attempt = conn.execute("""
            SELECT ta.*, s.name as subject_name, c.name as chapter_name
            FROM test_attempts ta
            LEFT JOIN subjects s ON s.id = ta.subject_id
            LEFT JOIN chapters c ON c.id = ta.chapter_id
            WHERE ta.id = ?;
        """, (attempt_id,)).fetchone()
        if not attempt:
            raise HTTPException(status_code=404, detail="Test attempt not found.")

        responses = conn.execute("""
            SELECT 
                tr.*,
                pq.question_text, pq.question_type, pq.options_json,
                pq.correct_answer, pq.explanation, pq.source_reference,
                pq.topic_name, pq.difficulty, pq.verification_status, pq.is_pyq, pq.pyq_exam, pq.pyq_year
            FROM test_responses tr
            JOIN practice_questions pq ON pq.id = tr.question_id
            WHERE tr.attempt_id = ?
            ORDER BY tr.id ASC;
        """, (attempt_id,)).fetchall()

        q_list = []
        is_completed = attempt["status"] == "completed"

        for r in responses:
            item = {
                "response_id": r["id"],
                "question_id": r["question_id"],
                "question_text": r["question_text"],
                "question_type": r["question_type"],
                "options": json.loads(r["options_json"]) if r["options_json"] else [],
                "user_answer": r["user_answer"],
                "is_marked_for_review": bool(r["is_marked_for_review"]),
                "time_spent_seconds": r["time_spent_seconds"],
                "topic_name": r["topic_name"],
                "difficulty": r["difficulty"],
                "verification_status": r["verification_status"],
                "is_pyq": bool(r["is_pyq"]),
                "pyq_exam": r["pyq_exam"],
                "pyq_year": r["pyq_year"]
            }
            # Only reveal correct answers and explanations if test is submitted or in practice review mode
            if is_completed:
                item["correct_answer"] = r["correct_answer"]
                item["explanation"] = r["explanation"]
                item["source_reference"] = r["source_reference"]
                item["is_correct"] = bool(r["is_correct"])

            q_list.append(item)

        return {
            "attempt": dict(attempt),
            "questions": q_list
        }

@router.post("/save-response")
def save_test_response(req: TestResponseSave):
    with db_session() as conn:
        conn.execute("""
            UPDATE test_responses SET
                user_answer = ?,
                is_marked_for_review = ?,
                time_spent_seconds = ?
            WHERE attempt_id = ? AND question_id = ?;
        """, (
            req.user_answer,
            1 if req.is_marked_for_review else 0,
            req.time_spent_seconds or 0,
            req.attempt_id,
            req.question_id
        ))
    return {"success": True}

@router.post("/submit")
def submit_test(req: TestSubmitRequest):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        attempt = conn.execute("SELECT * FROM test_attempts WHERE id = ?;", (req.attempt_id,)).fetchone()
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found.")

        responses = conn.execute("""
            SELECT tr.*, pq.correct_answer, pq.subject_id, pq.chapter_id, pq.topic_name,
                   pq.explanation, pq.source_reference
            FROM test_responses tr
            JOIN practice_questions pq ON pq.id = tr.question_id
            WHERE tr.attempt_id = ?;
        """, (req.attempt_id,)).fetchall()

        total = len(responses)
        correct = 0
        incorrect = 0
        unanswered = 0
        mistakes_to_record = []

        for r in responses:
            user_ans = (r["user_answer"] or "").strip()
            correct_ans = (r["correct_answer"] or "").strip()

            if not user_ans:
                unanswered += 1
                is_corr = 0
            elif user_ans.lower() == correct_ans.lower():
                correct += 1
                is_corr = 1
            else:
                incorrect += 1
                is_corr = 0
                mistakes_to_record.append(r)

            conn.execute("""
                UPDATE test_responses SET is_correct = ? WHERE id = ?;
            """, (is_corr, r["id"]))

        accuracy = round((correct / total * 100), 1) if total > 0 else 0
        # SSC CHSL standard scoring: +2 for correct, -0.5 for incorrect
        raw_score = (correct * 2.0) - (incorrect * 0.5)
        max_score = total * 2.0

        conn.execute("""
            UPDATE test_attempts SET
                time_taken_seconds = ?,
                score = ?,
                max_score = ?,
                correct_count = ?,
                incorrect_count = ?,
                unanswered_count = ?,
                accuracy = ?,
                status = 'completed',
                completed_at = ?
            WHERE id = ?;
        """, (
            req.time_taken_seconds,
            round(raw_score, 2),
            round(max_score, 2),
            correct,
            incorrect,
            unanswered,
            accuracy,
            now,
            req.attempt_id
        ))

        # Record mistakes in Mistake Notebook
        for m in mistakes_to_record:
            existing_mistake = conn.execute("""
                SELECT id, repeated_count FROM mistakes 
                WHERE question_id = ?;
            """, (m["question_id"],)).fetchone()

            if existing_mistake:
                conn.execute("""
                    UPDATE mistakes SET
                        repeated_count = repeated_count + 1,
                        user_selected_answer = ?,
                        attempt_id = ?,
                        status = 'unresolved',
                        last_reviewed_at = ?
                    WHERE id = ?;
                """, (m["user_answer"], req.attempt_id, now, existing_mistake["id"]))
            else:
                conn.execute("""
                    INSERT INTO mistakes (
                        question_id, attempt_id, subject_id, chapter_id, topic_name,
                        user_selected_answer, correct_answer, explanation, source_reference,
                        error_type, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unclassified', 'unresolved', ?);
                """, (
                    m["question_id"], req.attempt_id, m["subject_id"], m["chapter_id"],
                    m["topic_name"] or "", m["user_answer"], m["correct_answer"],
                    m["explanation"] or "", m["source_reference"] or "", now
                ))

        # Log study session
        conn.execute("""
            INSERT INTO study_sessions (
                session_type, subject_id, chapter_id, items_completed, duration_seconds, notes, created_at
            ) VALUES ('test', ?, ?, ?, ?, ?, ?);
        """, (
            attempt["subject_id"], attempt["chapter_id"], total,
            req.time_taken_seconds, f"Test Attempt: {accuracy}% accuracy ({correct}/{total})", now
        ))

    return get_attempt_state(req.attempt_id)

@router.get("/history")
def get_test_history(limit: int = 50):
    with db_session() as conn:
        rows = conn.execute("""
            SELECT ta.*, s.name as subject_name, c.name as chapter_name
            FROM test_attempts ta
            LEFT JOIN subjects s ON s.id = ta.subject_id
            LEFT JOIN chapters c ON c.id = ta.chapter_id
            WHERE ta.status = 'completed'
            ORDER BY ta.id DESC
            LIMIT ?;
        """, (limit,)).fetchall()
        return [dict(r) for r in rows]
