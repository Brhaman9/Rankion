import re
from pathlib import Path
from typing import Dict, Any
from pypdf import PdfReader

def extract_from_pdf(file_path: Path) -> Dict[str, Any]:
    """
    Extracts text from PDF preserving layout, headings, and lists where possible.
    Flags image-only / scanned PDFs without embedded text.
    """
    if not file_path.exists():
        return {
            "status": "error",
            "content": "",
            "notes": "File does not exist on disk."
        }
    
    try:
        reader = PdfReader(str(file_path))
        num_pages = len(reader.pages)
        if num_pages == 0:
            return {
                "status": "error",
                "content": "",
                "notes": "PDF document contains 0 pages."
            }

        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                extracted_pages.append(f"--- [Page {i + 1}] ---\n{text}")

        combined_text = "\n\n".join(extracted_pages).strip()

        # Check if empty (e.g. scanned image PDF)
        if not combined_text or len(combined_text) < 25:
            return {
                "status": "review_needed",
                "content": combined_text,
                "notes": f"Scanned/Image-only document detected across {num_pages} pages. No selectable text layer found. Please paste raw text or transcribed notes directly."
            }

        cleaned_text = clean_extracted_text(combined_text)
        return {
            "status": "processed",
            "content": cleaned_text,
            "notes": f"Successfully extracted text from {num_pages} pages ({len(cleaned_text)} characters)."
        }
    except Exception as e:
        return {
            "status": "error",
            "content": "",
            "notes": f"PDF parsing failed: {str(e)}"
        }

def extract_from_txt(file_path: Path) -> Dict[str, Any]:
    """
    Reads plain text or markdown files with automatic encoding detection fallback.
    """
    try:
        for encoding in ['utf-8', 'utf-16', 'latin-1', 'cp1252']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                cleaned = clean_extracted_text(content)
                return {
                    "status": "processed",
                    "content": cleaned,
                    "notes": f"Successfully read text file using {encoding} encoding."
                }
            except UnicodeDecodeError:
                continue
        return {
            "status": "error",
            "content": "",
            "notes": "Unable to decode text file with standard encodings."
        }
    except Exception as e:
        return {
            "status": "error",
            "content": "",
            "notes": f"Failed reading text file: {str(e)}"
        }

def clean_extracted_text(text: str) -> str:
    """
    Normalizes whitespace while preserving headings, bullet points, and numbered lists.
    """
    # Normalize line breaks
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove multiple repeated empty lines beyond 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Fix broken hyphenated words at end of line: e.g. "imple-\nmentation" -> "implementation"
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    
    return text.strip()
