import re
from typing import List, Dict, Any, Tuple

# =============================================================================
# DEMO FORMAT TEMPLATES FOR USER
# =============================================================================

FLASHCARD_DEMO_TEMPLATE = """Q: What is the 73rd Constitutional Amendment Act (1992) related to?
A: Panchayati Raj Institutions (added Part IX and 11th Schedule with 29 subjects).
Type: Concept

Q: State the formula for Compound Interest when compounded annually.
A: Amount = P * (1 + R/100)^T, Compound Interest = Amount - Principal.
Type: Formula

Q: What is the difference between Speed and Velocity in Physics?
A: Speed is a scalar quantity (magnitude only), while Velocity is a vector quantity (magnitude with direction).
Type: Comparison

Q: Exception to the general trend of ionization enthalpy across Period 2?
A: Boron has lower ionization enthalpy than Beryllium because removing a 2p electron is easier than a paired 2s electron.
Type: Rule & Exception

Q: Who founded the Brahmo Samaj and in which year?
A: Raja Ram Mohan Roy in 1828 in Calcutta.
Type: Fact Recall"""

PRACTICE_QUESTION_DEMO_TEMPLATE = """Q: If a 9-digit number 785x3678y is divisible by 72, then what is the value of (x - y)?
A) 2
B) -1
C) 0
D) 1
Correct: A
Explanation: For divisibility by 72, the number must be divisible by 8 and 9. 
Last 3 digits 78y divisible by 8 gives y = 4. 
Sum of digits = 7+8+5+x+3+6+7+8+4 = 48 + x. For divisibility by 9, 48 + x must be 54 => x = 6.
Therefore, (x - y) = 6 - 4 = 2.
Topic: Number Systems
Difficulty: Medium

---

Q: Which Article of the Constitution of India guarantees Equality before Law?
A) Article 14
B) Article 19
C) Article 21
D) Article 32
Correct: A
Explanation: Article 14 states that the State shall not deny to any person equality before the law or equal protection of laws within India.
Topic: Indian Polity
Difficulty: Easy

---

Q: The Battle of Plassey was fought in which year?
A) 1757
B) 1764
C) 1761
D) 1782
Correct: A
Explanation: The Battle of Plassey was fought on 23 June 1757 between Siraj-ud-Daulah (Nawab of Bengal) and the British East India Company led by Robert Clive.
Topic: Modern History
Difficulty: Easy"""

# =============================================================================
# DETERMINISTIC PARSERS (100% FAITHFUL TO USER INPUT, NO AI HALLUCINATION)
# =============================================================================

def parse_flashcards_text(raw_text: str) -> List[Dict[str, str]]:
    """
    Parses user-pasted flashcards in various common human-readable formats:
    Format 1:
      Q: [Question]
      A: [Answer]
      (Optional) Type: [qa/concept/formula/definition/comparison/fact]
    Format 2:
      Question: ...
      Answer: ...
    Format 3: Blocks separated by --- or empty lines with Q: / A:
    """
    cards = []
    if not raw_text or not raw_text.strip():
        return cards

    # Normalize line breaks
    text = raw_text.replace('\r\n', '\n').replace('\r', '\n').strip()

    # Split by standard block dividers if present, else parse line by line
    blocks = re.split(r'\n\s*---\s*\n|\n\s*===\s*\n', text)
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # Check if block has multiple Q: ... A: items inside it
        q_matches = list(re.finditer(r'(?:^|\n)\s*(?:Q|Question|Q\.\d+|Card\s*\d+)\s*[:\.\-]\s*', block, re.IGNORECASE))
        if len(q_matches) > 1:
            # Sub-split by Q: markers
            sub_blocks = []
            for i in range(len(q_matches)):
                start = q_matches[i].start()
                end = q_matches[i + 1].start() if i + 1 < len(q_matches) else len(block)
                sub_blocks.append(block[start:end].strip())
            for sb in sub_blocks:
                card = _extract_single_card(sb)
                if card:
                    cards.append(card)
        else:
            card = _extract_single_card(block)
            if card:
                cards.append(card)

    return cards

def _extract_single_card(text: str) -> Dict[str, str]:
    """Extracts question, answer, and optional card type from a block."""
    lines = text.split('\n')
    question = ""
    answer = ""
    card_type = "concept"
    source_ref = ""

    current_field = None
    q_lines = []
    a_lines = []

    for line in lines:
        stripped = line.strip()
        
        # Check for Question prefix
        m_q = re.match(r'^(?:Q|Question|Q\.\d+|Card\s*\d+)\s*[:\.\-]\s*(.*)$', stripped, re.IGNORECASE)
        # Check for Answer prefix
        m_a = re.match(r'^(?:A|Answer|Ans|Solution)\s*[:\.\-]\s*(.*)$', stripped, re.IGNORECASE)
        # Check for Type prefix
        m_t = re.match(r'^(?:Type|Category|Format)\s*[:\.\-]\s*(.*)$', stripped, re.IGNORECASE)
        # Check for Source prefix
        m_s = re.match(r'^(?:Source|Ref|Reference)\s*[:\.\-]\s*(.*)$', stripped, re.IGNORECASE)

        if m_q:
            current_field = "Q"
            q_lines.append(m_q.group(1).strip())
        elif m_a:
            current_field = "A"
            a_lines.append(m_a.group(1).strip())
        elif m_t:
            current_field = "T"
            raw_t = m_t.group(1).strip().lower()
            if "formula" in raw_t: card_type = "formula"
            elif "def" in raw_t: card_type = "definition"
            elif "comp" in raw_t: card_type = "comparison"
            elif "fact" in raw_t: card_type = "fact"
            elif "rule" in raw_t or "except" in raw_t: card_type = "rule_exception"
            else: card_type = "concept"
        elif m_s:
            source_ref = m_s.group(1).strip()
        else:
            if current_field == "Q":
                q_lines.append(line)
            elif current_field == "A":
                a_lines.append(line)

    question = "\n".join(q_lines).strip()
    answer = "\n".join(a_lines).strip()

    # Fallback: if no Q/A prefix, check if split by '?' or '-' or tab
    if not question and not answer and '?' in text:
        parts = text.split('?', 1)
        question = parts[0].strip() + "?"
        answer = parts[1].strip()

    if question and answer:
        return {
            "question": question,
            "answer": answer,
            "card_type": card_type,
            "source_reference": source_ref
        }
    return None

def parse_practice_questions_text(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parses user-pasted Practice Questions / MCQs directly.
    Extracts Question, Options (A, B, C, D), Correct Answer, and Explanation.
    """
    questions = []
    if not raw_text or not raw_text.strip():
        return questions

    text = raw_text.replace('\r\n', '\n').replace('\r', '\n').strip()
    blocks = re.split(r'\n\s*---\s*\n|\n\s*===\s*\n', text)

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # Handle multiple Q: inside single block if separator was missed
        q_matches = list(re.finditer(r'(?:^|\n)\s*(?:Q|Question|Q\.\d+)\s*[:\.\-]\s*', block, re.IGNORECASE))
        if len(q_matches) > 1:
            for i in range(len(q_matches)):
                start = q_matches[i].start()
                end = q_matches[i + 1].start() if i + 1 < len(q_matches) else len(block)
                parsed = _extract_single_mcq(block[start:end].strip())
                if parsed:
                    questions.append(parsed)
        else:
            parsed = _extract_single_mcq(block)
            if parsed:
                questions.append(parsed)

    return questions

def _extract_single_mcq(block: str) -> Dict[str, Any]:
    lines = block.split('\n')
    q_lines = []
    options = []
    option_dict = {}
    correct_key = ""
    explanation_lines = []
    topic_name = ""
    difficulty = "Medium"

    mode = "Q" # Q, OPTION, CORRECT, EXP

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check Question header (Q:, Q1:, Question 1:, 1., 1), etc.)
        m_q = re.match(r'^(?:Q|Question|Q\d+|Q\.\d+|\d+)[\s:\.\-\)]\s*(.*)$', stripped, re.IGNORECASE)
        # Check Option letter: A), A., (A), [A], A:, 1), 1., etc.
        m_opt = re.match(r'^(?:[\(\[]?([A-Da-d1-4])[\)\]\.\:\-]\s*)(.*)$', stripped)
        # Check Correct Answer (Correct:, Ans:, Answer:, Correct Option:, etc.)
        m_corr = re.match(r'^(?:Correct(?:\s*Answer|\s*Option)?|Answer|Ans|Right Choice)\s*[:\.\-]?\s*(.*)$', stripped, re.IGNORECASE)
        # Check Explanation
        m_exp = re.match(r'^(?:Explanation|Solution|Sol|Explain)\s*[:\.\-]?\s*(.*)$', stripped, re.IGNORECASE)
        # Check Topic / Difficulty
        m_top = re.match(r'^Topic\s*[:\.\-]\s*(.*)$', stripped, re.IGNORECASE)
        m_diff = re.match(r'^Difficulty\s*[:\.\-]\s*(.*)$', stripped, re.IGNORECASE)

        if m_q and mode == "Q" and not q_lines:
            q_lines.append(m_q.group(1).strip())
        elif m_opt:
            mode = "OPTION"
            key = m_opt.group(1).upper()
            # Map 1,2,3,4 to A,B,C,D
            num_map = {'1': 'A', '2': 'B', '3': 'C', '4': 'D'}
            key = num_map.get(key, key)
            val = m_opt.group(2).strip()
            option_dict[key] = val
        elif m_corr:
            mode = "CORRECT"
            correct_key = m_corr.group(1).strip()
        elif m_exp:
            mode = "EXP"
            explanation_lines.append(m_exp.group(1).strip())
        elif m_top:
            topic_name = m_top.group(1).strip()
        elif m_diff:
            difficulty = m_diff.group(1).strip().capitalize()
        else:
            if mode == "Q":
                q_lines.append(line)
            elif mode == "EXP":
                explanation_lines.append(line)
            elif mode == "OPTION":
                # Multi-line option support
                last_key = list(option_dict.keys())[-1] if option_dict else None
                if last_key:
                    option_dict[last_key] += " " + stripped

    question_text = "\n".join(q_lines).strip()
    explanation = "\n".join(explanation_lines).strip()

    # Format options list
    final_options = []
    for k in ['A', 'B', 'C', 'D']:
        if k in option_dict:
            final_options.append(option_dict[k])

    if not final_options and len(option_dict) >= 2:
        final_options = list(option_dict.values())

    if not question_text or len(final_options) < 2:
        return None

    # Resolve correct answer string
    correct_answer = ""
    # Check if correct_key matches option key e.g. "A" or "Option A"
    m_single_letter = re.search(r'\b([A-D])\b', correct_key, re.IGNORECASE)
    if m_single_letter:
        letter = m_single_letter.group(1).upper()
        letter_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}.get(letter, 0)
        if letter_idx < len(final_options):
            correct_answer = final_options[letter_idx]

    if not correct_answer:
        # Check if direct text match
        for opt in final_options:
            if opt.lower() in correct_key.lower() or correct_key.lower() in opt.lower():
                correct_answer = opt
                break

    if not correct_answer:
        correct_answer = final_options[0] # Default to first option if unspecified

    return {
        "question_text": question_text,
        "options": final_options,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "topic_name": topic_name,
        "difficulty": difficulty if difficulty in ["Easy", "Medium", "Hard"] else "Medium"
    }
