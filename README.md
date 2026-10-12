# Rankion | SSC CHSL 2027 AIR 1 Preparation Platform

**Rankion** is a personalized, distraction-free preparation and active revision platform designed to help achieve **All India Rank 1** in **SSC CHSL 2027**.

Unlike generic educational websites, **Rankion contains zero predefined subjects or chapters**. You have complete control to construct your own curriculum hierarchy, upload notes, synthesize flashcards and exam questions using OpenAI / local study engines, revise with the SuperMemo SM-2 algorithm, simulate real examinations, and systematically eliminate errors in your Mistake Notebook.

---

## 1. Quick Access & Website Lock

- **Local Address:** `http://127.0.0.1:8000`
- **Security Passcode:** `2486` *(Required every visit to access the system)*
- **AI Engine:** Configured with OpenAI (`gpt-4o-mini`) using your provided API key, with an automatic fallback to the built-in offline NLP extractor.

---

## 2. Core Architecture & Features

### A. Flexible Curriculum Hierarchy
- **Hierarchy:** `My Subjects` → `My Chapters` → `My Topics` → `My Notes` → `Flashcards & Questions`
- Add, rename, reorder, archive, and delete subjects and chapters with safety confirmations.
- Chapter progress tracking (Not Started, In Progress, Completed, Mastered).

### B. Notes Ingestion & Processing
- **Input Channels:** Upload PDFs (`pypdf` extraction), plain text (`.txt`, `.md`), or paste study notes directly.
- **Extraction Review:** Inspect extracted text, rectify OCR / formatting errors, and save clean source notes.
- Maintains strict provenance: cards and questions cite their original note.

### C. AI Flashcard Generator & Studio
- **Dual Engine:** Powered by OpenAI (`gpt-4o-mini`) + high-precision built-in local extractor.
- **Supported Formats:**
  1. Question & Answer
  2. Definition & Meaning
  3. Concept Explanation
  4. Fact Recall
  5. Comparison & Distinction
  6. Cause & Effect
  7. Chronology & Timeline
  8. Formula & Application
  9. Rule & Exception
  10. Conceptual Distinctions
- **Draft & Approval Studio:** Review, edit questions/answers, or discard draft cards before approving into your revision schedule.

### D. Interactive Active Recall Revision (SuperMemo SM-2)
- **Active Recall Interface:** Question is displayed first. Attempt retrieval before revealing the answer.
- **Four-Grade Self Assessment:**
  - `Again (1)`: Recall failed (Interval resets to 1 day, lapse logged).
  - `Hard (2)`: Recalled with difficulty.
  - `Good (3)`: Recalled correctly (Standard interval expansion).
  - `Easy (4)`: Recalled instantly and confidently (Bonus interval expansion).
- Calculates Ease Factor ($EF \ge 1.3$), repetitions, interval, and next due date dynamically.

### E. Examination Simulator & Scoring
- **Exam-Style Interface:** Question palette, timer, mark for review, clear selection, and session interruption recovery.
- **Standard SSC Marking Scheme:** $+2.0$ for correct answers, $-0.5$ negative marking for incorrect answers.
- **Immediate Solutions & Scorecard:** Accuracy percentage, topic breakdown, and full explanations.

### F. Mistake Notebook
- Automatically captures incorrect questions from practice tests.
- **Error Classification:**
  - *Memory Failure* (forgot rule or formula)
  - *Conceptual Misunderstanding* (flawed fundamental premise)
  - *Calculation Error* (arithmetic or rough-work lapse)
  - *Careless Mistake* (misread question or options)
  - *Unclassified*
- **Personal Reflections:** Record why you made the mistake and track review status until mastered.

### G. Authentic Previous Year Questions (PYQs)
- Dedicated catalog strictly for authentic past SSC CHSL exam questions (Tier 1 & Tier 2).
- Explicitly labeled with verification status to prevent confusion with AI practice questions.

### H. Performance Analytics & Daily Revision Planner
- **Zero Fake Statistics:** Every metric is computed from real rows in `data/rankion.db`.
- **AIR 1 Directives:** Algorithmic recommendations prioritizing overdue flashcards, repeated mistakes, and low-accuracy chapters.
- **Study Consistency:** 7-day activity trend tracking card reviews and tests completed.

### I. Settings & Data Portability
- Configurable daily revision limits and study targets.
- Light Theme default with an optional distraction-free Dark Theme.
- Complete JSON database backup export and restoration.

---

## 3. Running Locally

The server is currently running on `http://127.0.0.1:8000`.

To start or restart the server in the future:
```powershell
# From the project root (d:\Rankion)
python run.py
```
Or with uvicorn:
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
