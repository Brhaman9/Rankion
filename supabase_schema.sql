-- ==============================================================================
-- RANKION SINGLE-USER SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This schema supports permanent cloud storage for:
-- 1. Spaced Revision System & Learning Items
-- 2. Calendar-integrated Study Sessions & Practice Records
-- 3. Tasks, Rewards, History, XP, and Gamification Progress
-- Note: Single-user architecture - no auth.users or user_id required.
-- ==============================================================================

-- 1. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#ff5b1f',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SESSIONS TABLE (Normal & Learning Study Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL DEFAULT 'normal', -- 'normal' or 'learning'
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration INTEGER DEFAULT 0, -- duration in minutes
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEARNING ITEMS TABLE (Specific concept / topic unit for spaced repetition)
CREATE TABLE IF NOT EXISTS learning_items (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    subject_name TEXT DEFAULT '',
    topic_name TEXT DEFAULT '',
    subtopic TEXT DEFAULT '',
    title TEXT NOT NULL,
    learning_date DATE NOT NULL,
    what_learned TEXT DEFAULT '',
    key_concepts TEXT DEFAULT '',
    important_points TEXT DEFAULT '',
    formulas_facts TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    confidence INTEGER DEFAULT 3, -- 1 to 5
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVISIONS TABLE (Spaced Repetition Schedule and History)
CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY,
    learning_item_id TEXT NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL DEFAULT 0, -- 0 (Day 0), 1 (Day 3), 2 (Day 7), etc.
    scheduled_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'due_today', 'overdue', 'completed', 'rescheduled'
    recall_score INTEGER, -- 1 (Completely forgot) to 5 (Remembered very well)
    confidence TEXT, -- 'Low', 'Medium', 'High' or rating 1-5
    recall_notes TEXT DEFAULT '',
    what_forgot TEXT DEFAULT '',
    next_revision_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRACTICE RECORDS TABLE
CREATE TABLE IF NOT EXISTS practice_records (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    questions_attempted INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    accuracy NUMERIC GENERATED ALWAYS AS (
        CASE WHEN questions_attempted > 0 
             THEN ROUND((questions_correct::NUMERIC / questions_attempted::NUMERIC) * 100, 2)
             ELSE 0 
        END
    ) STORED,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS TABLE (Preserves existing Rankion task model)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'intelligence',
    repeat_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'weekly'
    target_per_week INTEGER DEFAULT 3,
    reward_points INTEGER DEFAULT 10,
    streak_boost_percent INTEGER DEFAULT 10,
    scheduled_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REWARDS TABLE
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cost INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS redemptions (
    id TEXT PRIMARY KEY,
    reward_id TEXT,
    reward_name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. HISTORY TABLE (Daily completion history & logs)
CREATE TABLE IF NOT EXISTS history (
    date TEXT PRIMARY KEY, -- 'YYYY-MM-DD'
    tasks_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    xp_penalty INTEGER DEFAULT 0,
    penalty_applied BOOLEAN DEFAULT FALSE,
    completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. APP META TABLE (Global Level, Total XP, Points, Streak)
CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_revisions_scheduled_date ON revisions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON revisions(status);
CREATE INDEX IF NOT EXISTS idx_revisions_learning_item ON revisions(learning_item_id);
CREATE INDEX IF NOT EXISTS idx_learning_items_learning_date ON learning_items(learning_date);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SINGLE-USER ACCESS
-- Note: Permissive policies for the anon key so frontend can read/write directly.
-- ==============================================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_meta ENABLE ROW LEVEL SECURITY;

-- Allow anon key full CRUD access on all tables
DROP POLICY IF EXISTS "Anon full access subjects" ON subjects;
CREATE POLICY "Anon full access subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access topics" ON topics;
CREATE POLICY "Anon full access topics" ON topics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access sessions" ON sessions;
CREATE POLICY "Anon full access sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access learning_items" ON learning_items;
CREATE POLICY "Anon full access learning_items" ON learning_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access revisions" ON revisions;
CREATE POLICY "Anon full access revisions" ON revisions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access practice_records" ON practice_records;
CREATE POLICY "Anon full access practice_records" ON practice_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access tasks" ON tasks;
CREATE POLICY "Anon full access tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access rewards" ON rewards;
CREATE POLICY "Anon full access rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access redemptions" ON redemptions;
CREATE POLICY "Anon full access redemptions" ON redemptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access history" ON history;
CREATE POLICY "Anon full access history" ON history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access app_meta" ON app_meta;
CREATE POLICY "Anon full access app_meta" ON app_meta FOR ALL USING (true) WITH CHECK (true);
