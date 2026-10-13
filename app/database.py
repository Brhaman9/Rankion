import sqlite3
import json
from datetime import datetime
from contextlib import contextmanager
from app.config import DB_PATH, DEFAULT_PASSCODE

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def db_session():
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with db_session() as conn:
        cursor = conn.cursor()
        
        # User settings
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """)

        # Subjects (User-created only)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            color TEXT DEFAULT '#2563eb',
            is_archived INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """)

        # Chapters
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            order_index INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed', 'Mastered'
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            UNIQUE(subject_id, name)
        );
        """)

        # Optional Topics under chapters
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chapter_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
            UNIQUE(chapter_id, name)
        );
        """)

        # Notes & Uploaded documents
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            chapter_id INTEGER NOT NULL,
            topic_id INTEGER,
            title TEXT NOT NULL,
            source_type TEXT NOT NULL, -- 'pdf', 'txt', 'pasted'
            file_path TEXT,
            original_filename TEXT,
            raw_content TEXT NOT NULL,
            extracted_content TEXT NOT NULL,
            extraction_status TEXT DEFAULT 'processed', -- 'processed', 'review_needed', 'error'
            extraction_notes TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
        );
        """)

        # Flashcards
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            chapter_id INTEGER NOT NULL,
            topic_id INTEGER,
            note_id INTEGER,
            card_type TEXT NOT NULL, 
            -- 'qa', 'definition', 'concept', 'fact', 'comparison', 'cause_effect', 'chronology', 'formula', 'rule_exception', 'distinction'
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            source_reference TEXT DEFAULT '',
            context_snippet TEXT DEFAULT '',
            status TEXT DEFAULT 'approved', -- 'draft', 'approved', 'rejected'
            
            -- SM-2 Spaced Repetition Core State
            ease_factor REAL DEFAULT 2.5,
            repetitions INTEGER DEFAULT 0,
            interval_days INTEGER DEFAULT 0,
            due_date TEXT NOT NULL, -- YYYY-MM-DD
            last_reviewed_at TEXT,
            last_rating INTEGER, -- 1=Again, 2=Hard, 3=Good, 4=Easy
            consecutive_correct INTEGER DEFAULT 0,
            total_reviews INTEGER DEFAULT 0,
            lapses INTEGER DEFAULT 0,
            
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
        );
        """)

        # Flashcard review events history (SM-2 log)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS flashcard_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flashcard_id INTEGER NOT NULL,
            rating INTEGER NOT NULL, -- 1=Again, 2=Hard, 3=Good, 4=Easy
            ease_factor_before REAL NOT NULL,
            ease_factor_after REAL NOT NULL,
            interval_before INTEGER NOT NULL,
            interval_after INTEGER NOT NULL,
            review_time_ms INTEGER DEFAULT 0,
            reviewed_at TEXT NOT NULL,
            FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
        );
        """)

        # Practice Questions (AI generated or user added)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS practice_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            chapter_id INTEGER NOT NULL,
            topic_id INTEGER,
            note_id INTEGER,
            question_text TEXT NOT NULL,
            question_type TEXT DEFAULT 'mcq', -- 'mcq', 'numerical', 'conceptual'
            options_json TEXT NOT NULL, -- JSON array of options: ["A", "B", "C", "D"]
            correct_answer TEXT NOT NULL,
            explanation TEXT NOT NULL,
            source_reference TEXT DEFAULT '',
            topic_name TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
            is_pyq INTEGER DEFAULT 0,
            pyq_exam TEXT DEFAULT '', -- e.g. "SSC CHSL Tier 1"
            pyq_year TEXT DEFAULT '', -- e.g. "2023"
            verification_status TEXT DEFAULT 'ai_generated', -- 'ai_generated', 'verified_authentic', 'unverified'
            created_at TEXT NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
        );
        """)

        # Test Attempts
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            test_mode TEXT DEFAULT 'exam', -- 'exam', 'practice'
            subject_id INTEGER,
            chapter_id INTEGER,
            question_count INTEGER NOT NULL,
            time_limit_minutes INTEGER DEFAULT 30,
            time_taken_seconds INTEGER DEFAULT 0,
            score REAL DEFAULT 0,
            max_score REAL DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            incorrect_count INTEGER DEFAULT 0,
            unanswered_count INTEGER DEFAULT 0,
            accuracy REAL DEFAULT 0,
            status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
            started_at TEXT NOT NULL,
            completed_at TEXT,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
        );
        """)

        # Individual Question Responses in a Test Attempt
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            user_answer TEXT,
            is_correct INTEGER DEFAULT 0,
            is_marked_for_review INTEGER DEFAULT 0,
            time_spent_seconds INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES practice_questions(id) ON DELETE CASCADE
        );
        """)

        # Mistake Notebook
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mistakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            attempt_id INTEGER,
            subject_id INTEGER NOT NULL,
            chapter_id INTEGER NOT NULL,
            topic_name TEXT DEFAULT '',
            user_selected_answer TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            explanation TEXT NOT NULL,
            source_reference TEXT DEFAULT '',
            error_type TEXT DEFAULT 'Unclassified', -- 'Memory Failure', 'Conceptual Misunderstanding', 'Calculation Error', 'Careless Mistake', 'Unclassified'
            user_reflection TEXT DEFAULT '',
            repeated_count INTEGER DEFAULT 1,
            status TEXT DEFAULT 'unresolved', -- 'unresolved', 'in_progress', 'mastered'
            last_reviewed_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES practice_questions(id) ON DELETE CASCADE,
            FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE SET NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
        );
        """)

        # Study sessions log (tracks consistency and time spent)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_type TEXT NOT NULL, -- 'flashcards', 'test', 'pyq', 'notes'
            subject_id INTEGER,
            chapter_id INTEGER,
            items_completed INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
        );
        """)

        # Create indexes for optimal querying speed
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_chapter ON notes(chapter_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_chapter ON flashcards(chapter_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_date, status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_questions_chapter ON practice_questions(chapter_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_mistakes_chapter ON mistakes(chapter_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_mistakes_status ON mistakes(status);")

        # Default settings seed
        default_settings = {
            "passcode": DEFAULT_PASSCODE,
            "daily_revision_limit": "50",
            "daily_new_cards": "20",
            "daily_target_minutes": "180",
            "theme": "light",
            "exam_target": "SSC CHSL 2027"
        }

        for k, v in default_settings.items():
            cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING;", (k, v))

