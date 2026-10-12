import re
import json
import httpx
from typing import List, Dict, Any, Optional

CARD_TYPES = [
    ("qa", "Question and Answer"),
    ("definition", "Definition and Meaning"),
    ("concept", "Concept Explanation"),
    ("fact", "Fact Recall"),
    ("comparison", "Comparison / Distinction"),
    ("cause_effect", "Cause and Effect"),
    ("chronology", "Chronology / Timeline"),
    ("formula", "Formula and Application"),
    ("rule_exception", "Rule and Exception"),
    ("distinction", "Conceptual Distinctions")
]

class AIGenerator:
    @staticmethod
    def generate_flashcards(
        notes_text: str,
        note_title: str,
        subject_name: str,
        chapter_name: str,
        api_config: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Generates draft flashcards from notes.
        Uses external LLM if configured; otherwise uses high-precision local extractor.
        """
        if not notes_text or len(notes_text.strip()) < 30:
            return {
                "success": False,
                "message": "Notes content is too short to extract reliable flashcards (minimum 30 characters required).",
                "cards": []
            }

        # Try external API if configured and key present
        raw_key = (api_config.get("ai_api_key") or api_config.get("api_key") or "").strip() if api_config else ""
        ai_mode = (api_config.get("ai_mode") or "external_api") if api_config else ""
        if raw_key and ai_mode == "external_api":
            try:
                cards = AIGenerator._generate_with_external_api_flashcards(notes_text, note_title, subject_name, chapter_name, api_config)
                if cards:
                    return {
                        "success": True,
                        "source": f"OpenAI ({api_config.get('ai_model', 'gpt-4o-mini')})",
                        "cards": cards
                    }
            except Exception as e:
                # Fallback to built-in generator if network or API error
                pass

        # Built-in High-Precision Extraction Engine
        cards = AIGenerator._generate_builtin_flashcards(notes_text, note_title, subject_name, chapter_name)
        return {
            "success": True,
            "source": "Built-in Study Engine (Faithful to Notes)",
            "cards": cards
        }

    @staticmethod
    def generate_practice_questions(
        notes_text: str,
        note_title: str,
        subject_name: str,
        chapter_name: str,
        num_questions: int = 5,
        difficulty: str = "Medium",
        api_config: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Generates practice questions (MCQs) from notes.
        """
        if not notes_text or len(notes_text.strip()) < 50:
            return {
                "success": False,
                "message": "Notes content is too brief to generate reliable exam-standard questions.",
                "questions": []
            }

        raw_key = (api_config.get("ai_api_key") or api_config.get("api_key") or "").strip() if api_config else ""
        ai_mode = (api_config.get("ai_mode") or "external_api") if api_config else ""
        if raw_key and ai_mode == "external_api":
            try:
                questions = AIGenerator._generate_with_external_api_questions(notes_text, note_title, subject_name, chapter_name, num_questions, difficulty, api_config)
                if questions:
                    return {
                        "success": True,
                        "source": f"OpenAI ({api_config.get('ai_model', 'gpt-4o-mini')})",
                        "questions": questions
                    }
            except Exception:
                pass

        questions = AIGenerator._generate_builtin_questions(notes_text, note_title, subject_name, chapter_name, num_questions, difficulty)
        return {
            "success": True,
            "source": "Built-in Exam Generation Engine",
            "questions": questions
        }

    # =========================================================================
    # BUILT-IN FLASHCARD EXTRACTION ENGINE
    # =========================================================================
    @staticmethod
    def _generate_builtin_flashcards(
        text: str,
        note_title: str,
        subject: str,
        chapter: str
    ) -> List[Dict[str, Any]]:
        cards = []
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        # 1. Formulas & Mathematical / Physical rules (e.g. Formula: X = Y, or contains =)
        for line in lines:
            if re.search(r'\b(formula|equation|theorem|identity)\b[:=]', line, re.I) or (('=' in line or '∝' in line) and len(line) < 140 and not line.startswith("http")):
                parts = re.split(r'[:=]', line, maxsplit=1)
                if len(parts) == 2 and len(parts[0]) > 3:
                    cards.append({
                        "card_type": "formula",
                        "question": f"State the formula or relation for: {parts[0].strip()}",
                        "answer": parts[1].strip(),
                        "source_reference": f"{note_title} | {chapter}",
                        "context_snippet": line[:150]
                    })

        # 2. Definitions and Key Meanings (X is defined as Y / X refers to Y / X: Y)
        def_patterns = [
            r'^([A-Z][a-zA-Z0-9\s\-_]{2,35})\s*(?:is defined as|refers to|means|stands for)\s+(.+)$',
            r'^([A-Z][a-zA-Z0-9\s\-_]{2,35})\s*:\s*(.{15,})$',
            r'^([A-Z][a-zA-Z0-9\s\-_]{2,35})\s*—\s*(.{15,})$',
            r'^([A-Z][a-zA-Z0-9\s\-_]{2,35})\s*-\s*(.{20,})$'
        ]
        for line in lines:
            for pattern in def_patterns:
                m = re.match(pattern, line)
                if m:
                    term, definition = m.group(1).strip(), m.group(2).strip()
                    if len(term.split()) <= 6 and len(definition) >= 15:
                        cards.append({
                            "card_type": "definition",
                            "question": f"What is the definition and significance of '{term}'?",
                            "answer": definition,
                            "source_reference": f"{note_title} | {chapter}",
                            "context_snippet": line[:150]
                        })
                        break

        # 3. Rules and Exceptions ("Exception:", "Note:", "However,", "Except")
        for line in lines:
            if re.search(r'\b(exception|however|except|exempt|proviso|deviation|caveat)\b', line, re.I):
                if len(line) > 20:
                    cards.append({
                        "card_type": "rule_exception",
                        "question": f"What is the key rule or exception mentioned regarding: {line.split('.')[0][:60]}...?",
                        "answer": line,
                        "source_reference": f"{note_title} | {chapter}",
                        "context_snippet": line[:150]
                    })

        # 4. Chronology / Dates / History / Articles (e.g. In 1947, Article 21, Schedule 7)
        for line in lines:
            m_year = re.search(r'\b(in|by|year|date|during)\s+([12][0-9]{3}|[0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+[0-9]{4})?)\b', line, re.I)
            m_art = re.search(r'\b(Article\s+[0-9]+[A-Z]?|Amendment\s+[0-9]+[a-z]?|Schedule\s+[0-9]+)\b', line, re.I)
            if m_year or m_art:
                entity = m_art.group(0) if m_art else m_year.group(0)
                cards.append({
                    "card_type": "chronology" if m_year else "fact",
                    "question": f"What key event, provision, or rule is associated with {entity} in this topic?",
                    "answer": line,
                    "source_reference": f"{note_title} | {chapter}",
                    "context_snippet": line[:150]
                })

        # 5. Comparisons & Distinctions ("vs", "whereas", "while", "differs from", "between X and Y")
        for line in lines:
            if re.search(r'\b(vs\.?|versus|differs? from|whereas|while|difference between)\b', line, re.I):
                cards.append({
                    "card_type": "comparison",
                    "question": f"Explain the comparison or distinction highlighted in this point.",
                    "answer": line,
                    "source_reference": f"{note_title} | {chapter}",
                    "context_snippet": line[:150]
                })

        # 6. Bullet lists & Key Facts / Causes
        for i, line in enumerate(lines):
            # Bullet point or numbered item
            m_bullet = re.match(r'^(?:[\*\-\•]|\d+[\.\)])\s*(.+)$', line)
            if m_bullet and len(m_bullet.group(1)) > 20:
                fact_content = m_bullet.group(1).strip()
                # Find preceding heading if available
                heading = "Core Concept"
                for h_idx in range(max(0, i - 4), i):
                    if not re.match(r'^(?:[\*\-\•]|\d+[\.\)])', lines[h_idx]) and len(lines[h_idx]) < 70:
                        heading = lines[h_idx].rstrip(":")
                        break

                cards.append({
                    "card_type": "concept",
                    "question": f"Regarding '{heading}', what is the key principle or fact?",
                    "answer": fact_content,
                    "source_reference": f"{note_title} | {chapter}",
                    "context_snippet": f"{heading}: {fact_content}"[:150]
                })

        # Deduplicate cards by question
        unique_cards = []
        seen_questions = set()
        for c in cards:
            clean_q = c["question"].strip().lower()
            if clean_q not in seen_questions:
                seen_questions.add(clean_q)
                unique_cards.append(c)

        # Fallback if too few specific patterns matched
        if len(unique_cards) < 3:
            # Paragraph chunking for general Q&A
            paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 35]
            for p in paragraphs[:5]:
                sentences = re.split(r'(?<=[.!?])\s+', p)
                if len(sentences) >= 2:
                    unique_cards.append({
                        "card_type": "qa",
                        "question": f"Explain the key concept described in: '{sentences[0][:60]}...'?",
                        "answer": p,
                        "source_reference": f"{note_title} | {chapter}",
                        "context_snippet": p[:150]
                    })

        return unique_cards[:25] # Return top relevant cards

    # =========================================================================
    # BUILT-IN PRACTICE QUESTIONS ENGINE (MCQs)
    # =========================================================================
    @staticmethod
    def _generate_builtin_questions(
        text: str,
        note_title: str,
        subject: str,
        chapter: str,
        num_questions: int,
        difficulty: str
    ) -> List[Dict[str, Any]]:
        questions = []
        lines = [line.strip() for line in text.split("\n") if len(line.strip()) > 20]

        # Scan for facts, definitions, statements to turn into questions
        candidate_facts = []
        for line in lines:
            # Look for lines with clear statements
            if re.search(r'(:|is|are|was|were|means|refers to|contains|states that)', line, re.I):
                candidate_facts.append(line)

        if not candidate_facts:
            candidate_facts = lines

        for i, fact in enumerate(candidate_facts):
            if len(questions) >= num_questions:
                break

            # Try to build an MCQ
            # Case 1: Definition or key-value (Term : Statement)
            if ":" in fact:
                parts = fact.split(":", 1)
                term = parts[0].strip()
                desc = parts[1].strip()
                if 2 <= len(term.split()) <= 7 and len(desc) > 15:
                    options = [
                        desc,
                        f"It is unrelated to {term} and applies only in reverse conditions.",
                        f"A secondary clause that was repealed in subsequent revisions.",
                        f"An alternative process with inverse outcomes."
                    ]
                    # Deterministic option ordering
                    questions.append({
                        "question_text": f"With reference to {chapter}, which of the following accurately describes '{term}'?",
                        "question_type": "mcq",
                        "options": options,
                        "correct_answer": desc,
                        "explanation": f"According to study notes on {chapter}: '{term}' is defined as '{desc}'.",
                        "source_reference": f"{note_title} | {chapter}",
                        "topic_name": term[:40],
                        "difficulty": difficulty,
                        "verification_status": "ai_generated",
                        "is_pyq": 0
                    })
                    continue

            # Case 2: Fact statement
            if len(fact) > 30:
                sentences = re.split(r'(?<=[.!?])\s+', fact)
                core_sentence = sentences[0]
                
                questions.append({
                    "question_text": f"Consider the following statement from {chapter}:\nWhich of the following is correct regarding this concept?",
                    "question_type": "mcq",
                    "options": [
                        core_sentence,
                        f"The statement is universally false under standard principles of {subject}.",
                        f"This applies strictly as an exception with no general validity.",
                        f"This relation is valid only in theoretical models and disregarded in practice."
                    ],
                    "correct_answer": core_sentence,
                    "explanation": f"Source notes state: '{core_sentence}'. This is verified in {chapter}.",
                    "source_reference": f"{note_title} | {chapter}",
                    "topic_name": chapter,
                    "difficulty": difficulty,
                    "verification_status": "ai_generated",
                    "is_pyq": 0
                })

        return questions[:num_questions]

    # =========================================================================
    # EXTERNAL LLM INTEGRATION (OpenAI / Gemini / Groq / Ollama / Custom API)
    # =========================================================================
    @staticmethod
    def _generate_with_external_api_flashcards(
        notes_text: str,
        note_title: str,
        subject: str,
        chapter: str,
        config: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        api_key = (config.get("ai_api_key") or config.get("api_key") or "").strip()
        provider = (config.get("ai_provider") or config.get("provider") or "openai").strip()
        model = (config.get("ai_model") or config.get("model") or "gpt-4o-mini").strip()
        endpoint = config.get("ai_endpoint", "").strip()

        prompt = f"""You are an expert exam revision designer preparing high-yield notes for SSC CHSL 2027 (AIR 1 focus).
Read the following student study notes carefully and generate concise, accurate flashcards.

Rules:
1. Ground every card strictly in the provided text. Do not invent facts.
2. One key concept per card.
3. Card types to use appropriately: 'qa', 'definition', 'concept', 'fact', 'comparison', 'cause_effect', 'chronology', 'formula', 'rule_exception', 'distinction'.
4. Return ONLY valid JSON array with objects matching:
[
  {{
    "card_type": "...",
    "question": "Clear, focused question",
    "answer": "Concise, precise answer",
    "source_reference": "{note_title}",
    "context_snippet": "Relevant phrase from text"
  }}
]

Subject: {subject}
Chapter: {chapter}
Notes:
{notes_text[:4000]}
"""

        # Call endpoint (supporting OpenAI / OpenRouter / Groq / Gemini compatible format)
        if "gemini" in provider.lower() and not endpoint:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text_resp = data["candidates"][0]["content"]["parts"][0]["text"]
                    return AIGenerator._safe_parse_json(text_resp)
        else:
            # OpenAI / Groq / Custom compatible endpoint
            target_url = endpoint if endpoint else "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model or "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a specialized SSC exam flashcard generator. Output ONLY a raw JSON array, without any markdown formatting or commentary."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            with httpx.Client(timeout=35.0) as client:
                res = client.post(target_url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    return AIGenerator._safe_parse_json(content)
        return []

    @staticmethod
    def _generate_with_external_api_questions(
        notes_text: str,
        note_title: str,
        subject: str,
        chapter: str,
        num_questions: int,
        difficulty: str,
        config: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        api_key = (config.get("ai_api_key") or config.get("api_key") or "").strip()
        provider = (config.get("ai_provider") or config.get("provider") or "openai").strip()
        model = (config.get("ai_model") or config.get("model") or "gpt-4o-mini").strip()
        endpoint = config.get("ai_endpoint", "").strip()

        prompt = f"""You are an SSC CHSL examination specialist. Generate {num_questions} multiple-choice practice questions strictly based on the provided student notes.
Difficulty: {difficulty}

Rules:
1. 4 options per question (A, B, C, D).
2. One unambiguous correct answer.
3. 3 plausible distractors (not absurd).
4. Detailed explanation citing the source note.
5. Return ONLY a valid JSON array of objects:
[
  {{
    "question_text": "...",
    "question_type": "mcq",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct_answer": "Exact matching string from options",
    "explanation": "...",
    "source_reference": "{note_title}",
    "topic_name": "...",
    "difficulty": "{difficulty}",
    "verification_status": "ai_generated",
    "is_pyq": 0
  }}
]

Subject: {subject}
Chapter: {chapter}
Notes:
{notes_text[:4000]}
"""
        if "gemini" in provider.lower() and not endpoint:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "response_mime_type": "application/json"}
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text_resp = data["candidates"][0]["content"]["parts"][0]["text"]
                    return AIGenerator._safe_parse_json(text_resp)
        else:
            target_url = endpoint if endpoint else "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model or "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are an SSC exam test generator. Output ONLY a raw JSON array, without any markdown formatting or commentary."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            }
            with httpx.Client(timeout=35.0) as client:
                res = client.post(target_url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    return AIGenerator._safe_parse_json(content)
        return []

    @staticmethod
    def _safe_parse_json(content: str) -> List[Dict[str, Any]]:
        if not content:
            return []
        cleaned = content.strip()
        # Strip ```json ... ``` code fence if present
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)
        m = re.search(r'\[.*\]', cleaned, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
        try:
            res = json.loads(cleaned)
            return res if isinstance(res, list) else []
        except Exception:
            return []
