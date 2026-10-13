# Rankion | SSC CHSL Preparation Platform

**Rankion** is a personalized, distraction-free preparation and active revision platform with SuperMemo SM-2 spaced repetition, CBT examination simulations, and a Mistake Notebook.

Data is stored directly in **Supabase Cloud (PostgreSQL)** — zero Render server needed, zero local storage risk.

---

## 1. Supabase Cloud Database Setup (1-Time Setup)

1. Create a free project at [Supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase_schema.sql` in this repo (or copy from Settings > "View SQL Schema Migration" inside the app), paste into the Supabase SQL editor, and click **Run**.
4. Go to **Project Settings > API** and copy:
   - **Project URL**
   - **anon (public) Key**
5. Enter them in the Rankion **Settings** page or click **Connect Supabase** in the topbar. Alternatively, paste them into `static/js/supabase-config.js`.

---

## 2. Key Features

- **No AI Complexity:** Add your flashcards, MCQs, and study notes cleanly and directly without AI errors or hallucinations.
- **Active Recall Flashcards (SM-2):**
  - Add individual flashcards or paste in bulk.
  - Spaced repetition algorithm schedules reviews based on your recall rating (Again, Hard, Good, Easy).
- **Practice Tests & Examination Simulator:**
  - Add single multiple-choice questions or import in bulk.
  - Timed CBT exam simulator with SSC scoring (+2 for correct, -0.5 for wrong).
- **Mistake Notebook:**
  - Automatically captures incorrect questions from practice tests.
  - Classify error types (Memory Failure, Calculation Error, Careless Mistake, Conceptual).
  - Add reflections and track mastery.
- **My Notes:**
  - Save concepts, formulas, and topic summaries directly to Supabase cloud.
- **Security Lock:**
  - Default Passcode: `2486` (configurable in Settings).

---

## 3. Hosting & Deployment

- **Vercel (Recommended):** Deploy this repository directly to Vercel. Since data connects directly to Supabase, it runs 100% serverless with zero Render dependency and instant loading.
- **Local Dev:**
  Run locally with python:
  ```powershell
  python run.py
  ```
  And open `http://127.0.0.1:8000`.
