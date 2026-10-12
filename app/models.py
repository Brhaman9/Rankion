from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PasscodeRequest(BaseModel):
    passcode: str

class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    color: Optional[str] = "#2563eb"

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_archived: Optional[bool] = None

class ChapterCreate(BaseModel):
    subject_id: int
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = ""
    order_index: Optional[int] = 0

class ChapterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None # 'Not Started', 'In Progress', 'Completed', 'Mastered'
    order_index: Optional[int] = None

class TopicCreate(BaseModel):
    chapter_id: int
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = ""

class NoteCreatePasted(BaseModel):
    subject_id: int
    chapter_id: int
    topic_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=10)

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    extracted_content: Optional[str] = None
    topic_id: Optional[int] = None

class FlashcardCreate(BaseModel):
    subject_id: int
    chapter_id: int
    topic_id: Optional[int] = None
    note_id: Optional[int] = None
    card_type: str = "concept"
    question: str
    answer: str
    source_reference: Optional[str] = ""
    context_snippet: Optional[str] = ""

class FlashcardImportText(BaseModel):
    subject_id: int
    chapter_id: int
    topic_id: Optional[int] = None
    note_id: Optional[int] = None
    raw_text: str = Field(..., min_length=5)
    source_reference: Optional[str] = ""

class QuestionImportText(BaseModel):
    subject_id: int
    chapter_id: int
    topic_id: Optional[int] = None
    note_id: Optional[int] = None
    raw_text: str = Field(..., min_length=10)
    source_reference: Optional[str] = ""

class FlashcardBatchApprove(BaseModel):
    cards: List[FlashcardCreate]

class FlashcardReviewSubmit(BaseModel):
    card_id: int
    rating: int = Field(..., ge=1, le=4) # 1=Again, 2=Hard, 3=Good, 4=Easy
    review_time_ms: Optional[int] = 0

class FlashcardUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    card_type: Optional[str] = None
    source_reference: Optional[str] = None
    status: Optional[str] = None # 'approved', 'rejected'

class TestGenerateRequest(BaseModel):
    subject_id: int
    chapter_id: Optional[int] = None
    topic_ids: Optional[List[int]] = None
    note_ids: Optional[List[int]] = None
    num_questions: int = Field(5, ge=1, le=50)
    difficulty: str = "Medium" # 'Easy', 'Medium', 'Hard'
    test_mode: str = "exam" # 'exam', 'practice'
    include_mistakes: bool = False

class TestResponseSave(BaseModel):
    attempt_id: int
    question_id: int
    user_answer: str
    is_marked_for_review: Optional[bool] = False
    time_spent_seconds: Optional[int] = 0

class TestSubmitRequest(BaseModel):
    attempt_id: int
    time_taken_seconds: int

class MistakeUpdate(BaseModel):
    error_type: Optional[str] = None # 'Memory Failure', 'Conceptual Misunderstanding', 'Calculation Error', 'Careless Mistake', 'Unclassified'
    user_reflection: Optional[str] = None
    status: Optional[str] = None # 'unresolved', 'in_progress', 'mastered'

class PYQCreate(BaseModel):
    subject_id: int
    chapter_id: int
    topic_id: Optional[int] = None
    question_text: str
    question_type: str = "mcq"
    options: List[str]
    correct_answer: str
    explanation: str
    source_reference: Optional[str] = ""
    pyq_exam: str = "SSC CHSL Tier 1"
    pyq_year: str = "2023"
    verification_status: str = "verified_authentic"

class SettingsUpdate(BaseModel):
    passcode: Optional[str] = None
    daily_revision_limit: Optional[int] = None
    daily_new_cards: Optional[int] = None
    daily_target_minutes: Optional[int] = None
    theme: Optional[str] = None # 'light', 'dark'
    ai_mode: Optional[str] = None # 'built_in', 'external_api'
    ai_provider: Optional[str] = None
    ai_api_key: Optional[str] = None
    ai_endpoint: Optional[str] = None
    ai_model: Optional[str] = None
