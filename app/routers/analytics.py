from datetime import datetime, timedelta
from fastapi import APIRouter
from app.database import db_session

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_analytics():
    today = datetime.now().strftime("%Y-%m-%d")
    with db_session() as conn:
        # Core counts
        total_subjects = conn.execute("SELECT COUNT(*) as count FROM subjects WHERE is_archived = 0;").fetchone()["count"]
        total_chapters = conn.execute("SELECT COUNT(*) as count FROM chapters;").fetchone()["count"]
        completed_chapters = conn.execute("SELECT COUNT(*) as count FROM chapters WHERE status IN ('Completed', 'Mastered');").fetchone()["count"]
        
        # Flashcards
        total_cards = conn.execute("SELECT COUNT(*) as count FROM flashcards WHERE status = 'approved';").fetchone()["count"]
        overdue_cards = conn.execute("SELECT COUNT(*) as count FROM flashcards WHERE status = 'approved' AND due_date < ?;", (today,)).fetchone()["count"]
        due_today_cards = conn.execute("SELECT COUNT(*) as count FROM flashcards WHERE status = 'approved' AND due_date = ?;", (today,)).fetchone()["count"]
        total_reviews = conn.execute("SELECT COUNT(*) as count FROM flashcard_reviews;").fetchone()["count"]
        reviews_today = conn.execute("SELECT COUNT(*) as count FROM flashcard_reviews WHERE reviewed_at LIKE ?;", (f"{today}%",)).fetchone()["count"]

        # Tests
        test_attempts_count = conn.execute("SELECT COUNT(*) as count FROM test_attempts WHERE status = 'completed';").fetchone()["count"]
        overall_accuracy_row = conn.execute("SELECT ROUND(AVG(accuracy), 1) as avg_acc FROM test_attempts WHERE status = 'completed';").fetchone()
        overall_accuracy = overall_accuracy_row["avg_acc"] if overall_accuracy_row["avg_acc"] is not None else 0.0

        # Mistakes
        unresolved_mistakes = conn.execute("SELECT COUNT(*) as count FROM mistakes WHERE status = 'unresolved';").fetchone()["count"]
        repeated_mistakes = conn.execute("SELECT COUNT(*) as count FROM mistakes WHERE repeated_count > 1 AND status != 'mastered';").fetchone()["count"]

        # Chapter-wise performance breakdown
        chapter_performance = conn.execute("""
            SELECT 
                c.id, c.name as chapter_name, s.name as subject_name, c.status,
                (SELECT COUNT(*) FROM notes WHERE chapter_id = c.id) as note_count,
                (SELECT COUNT(*) FROM flashcards WHERE chapter_id = c.id AND status = 'approved') as card_count,
                (SELECT COUNT(*) FROM flashcards WHERE chapter_id = c.id AND status = 'approved' AND due_date <= ?) as due_card_count,
                (SELECT COUNT(*) FROM test_attempts WHERE chapter_id = c.id AND status = 'completed') as test_count,
                (SELECT ROUND(AVG(accuracy), 1) FROM test_attempts WHERE chapter_id = c.id AND status = 'completed') as accuracy,
                (SELECT COUNT(*) FROM mistakes WHERE chapter_id = c.id AND status != 'mastered') as active_mistakes
            FROM chapters c
            JOIN subjects s ON s.id = c.subject_id
            ORDER BY c.subject_id ASC, c.order_index ASC;
        """, (today,)).fetchall()

        # Study consistency (activity over last 7 days)
        activity_days = []
        for d in range(6, -1, -1):
            day_str = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
            card_count = conn.execute("SELECT COUNT(*) as count FROM flashcard_reviews WHERE reviewed_at LIKE ?;", (f"{day_str}%",)).fetchone()["count"]
            test_count = conn.execute("SELECT COUNT(*) as count FROM test_attempts WHERE completed_at LIKE ?;", (f"{day_str}%",)).fetchone()["count"]
            activity_days.append({
                "date": day_str,
                "label": (datetime.now() - timedelta(days=d)).strftime("%b %d"),
                "cards": card_count,
                "tests": test_count,
                "total_items": card_count + test_count
            })

        return {
            "summary": {
                "total_subjects": total_subjects,
                "total_chapters": total_chapters,
                "completed_chapters": completed_chapters,
                "total_cards": total_cards,
                "overdue_cards": overdue_cards,
                "due_today_cards": due_today_cards,
                "total_reviews": total_reviews,
                "reviews_today": reviews_today,
                "test_attempts": test_attempts_count,
                "overall_accuracy": overall_accuracy,
                "unresolved_mistakes": unresolved_mistakes,
                "repeated_mistakes": repeated_mistakes
            },
            "chapter_performance": [dict(cp) for cp in chapter_performance],
            "activity_trend": activity_days
        }

@router.get("/daily-queue")
def get_daily_revision_queue():
    today = datetime.now().strftime("%Y-%m-%d")
    with db_session() as conn:
        limit_row = conn.execute("SELECT value FROM settings WHERE key = 'daily_revision_limit';").fetchone()
        daily_limit = int(limit_row["value"]) if limit_row else 50

        # 1. Overdue & Due Today Flashcards
        due_cards = conn.execute("""
            SELECT f.id, f.question, f.answer, f.due_date, f.lapses, f.ease_factor,
                   s.name as subject_name, c.name as chapter_name, 'flashcard' as item_type
            FROM flashcards f
            JOIN subjects s ON s.id = f.subject_id
            JOIN chapters c ON c.id = f.chapter_id
            WHERE f.status = 'approved' AND f.due_date <= ?
            ORDER BY f.due_date ASC, f.lapses DESC, f.ease_factor ASC
            LIMIT ?;
        """, (today, daily_limit)).fetchall()

        # 2. Unresolved High-Priority Mistakes
        active_mistakes = conn.execute("""
            SELECT m.id, pq.question_text, m.correct_answer, m.repeated_count, m.error_type,
                   s.name as subject_name, c.name as chapter_name, 'mistake' as item_type
            FROM mistakes m
            JOIN practice_questions pq ON pq.id = m.question_id
            JOIN subjects s ON s.id = m.subject_id
            JOIN chapters c ON c.id = m.chapter_id
            WHERE m.status = 'unresolved'
            ORDER BY m.repeated_count DESC, m.id DESC
            LIMIT 15;
        """).fetchall()

        return {
            "daily_limit": daily_limit,
            "due_cards_count": len(due_cards),
            "due_cards": [dict(c) for c in due_cards],
            "unresolved_mistakes": [dict(m) for m in active_mistakes]
        }

@router.get("/recommendations")
def get_air1_recommendations():
    """
    Grounded, strictly data-driven study recommendations explaining EXACTLY why each action is recommended.
    """
    today = datetime.now().strftime("%Y-%m-%d")
    recommendations = []

    with db_session() as conn:
        # Check 1: Overdue Flashcards
        overdue_row = conn.execute("""
            SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT c.name) as chapters
            FROM flashcards f
            JOIN chapters c ON c.id = f.chapter_id
            WHERE f.status = 'approved' AND f.due_date < ?;
        """, (today,)).fetchone()
        if overdue_row and overdue_row["count"] > 0:
            recommendations.append({
                "priority": "Critical",
                "title": f"Clear {overdue_row['count']} Overdue Flashcards",
                "reason": f"Active recall retention deteriorates rapidly once cards lapse past their SM-2 due date. Affects: {overdue_row['chapters'] or 'multiple chapters'}.",
                "action_type": "flashcards",
                "action_label": "Start Flashcard Revision"
            })

        # Check 2: Repeated Mistakes in Mistake Notebook
        repeat_mistakes = conn.execute("""
            SELECT c.name as chapter_name, COUNT(*) as count
            FROM mistakes m
            JOIN chapters c ON c.id = m.chapter_id
            WHERE m.status = 'unresolved' AND m.repeated_count > 1
            GROUP BY m.chapter_id
            ORDER BY count DESC
            LIMIT 1;
        """).fetchone()
        if repeat_mistakes:
            recommendations.append({
                "priority": "High",
                "title": f"Review Repeated Errors in '{repeat_mistakes['chapter_name']}'",
                "reason": f"You have {repeat_mistakes['count']} questions answered incorrectly more than once in this chapter. Eliminate recurring blindspots before acquiring new notes.",
                "action_type": "mistakes",
                "action_label": "Open Mistake Notebook"
            })

        # Check 3: Chapters with low accuracy (< 60%)
        low_acc = conn.execute("""
            SELECT c.name as chapter_name, ROUND(AVG(ta.accuracy), 1) as avg_acc, COUNT(ta.id) as tests
            FROM test_attempts ta
            JOIN chapters c ON c.id = ta.chapter_id
            WHERE ta.status = 'completed'
            GROUP BY ta.chapter_id
            HAVING avg_acc < 60
            ORDER BY avg_acc ASC
            LIMIT 1;
        """).fetchone()
        if low_acc:
            recommendations.append({
                "priority": "High",
                "title": f"Re-Test Weak Chapter '{low_acc['chapter_name']}'",
                "reason": f"Current average test accuracy is {low_acc['avg_acc']}% over {low_acc['tests']} attempt(s). Take a targeted practice test to reinforce fundamental concepts.",
                "action_type": "test",
                "action_label": "Generate Practice Test"
            })

        # Check 4: Chapters with notes but no flashcards
        untapped_chapters = conn.execute("""
            SELECT c.id, c.name as chapter_name, COUNT(n.id) as note_count
            FROM chapters c
            JOIN notes n ON n.chapter_id = c.id
            LEFT JOIN flashcards f ON f.chapter_id = c.id
            WHERE f.id IS NULL
            GROUP BY c.id
            LIMIT 1;
        """).fetchone()
        if untapped_chapters:
            recommendations.append({
                "priority": "Medium",
                "title": f"Convert Notes to Flashcards for '{untapped_chapters['chapter_name']}'",
                "reason": f"You have added notes to this chapter, but have not yet generated active recall flashcards.",
                "action_type": "notes",
                "action_label": "Open Chapter Notes"
            })

        if not recommendations:
            recommendations.append({
                "priority": "Maintain",
                "title": "On Track - Continue Daily Schedule",
                "reason": "All due flashcards and mistake reviews are up to date. Proceed with adding new chapter notes or attempting full-length timed tests.",
                "action_type": "dashboard",
                "action_label": "View Preparation Plan"
            })

    return recommendations
