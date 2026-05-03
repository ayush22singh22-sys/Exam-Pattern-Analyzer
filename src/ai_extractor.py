import os
import json
import warnings

# Lazy import: try the new google.genai package first, then fall back to deprecated google.generativeai
HAS_GENAI = False
_USE_NEW_SDK = False

try:
    from google import genai
    HAS_GENAI = True
    _USE_NEW_SDK = True
except ImportError:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", FutureWarning)
            import google.generativeai as genai
        HAS_GENAI = True
        _USE_NEW_SDK = False
    except ImportError:
        pass

# Cached client instance (avoids re-creating per call)
_client = None
_model = None


def _get_api_key():
    """Retrieve and validate the Gemini API key."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY environment variable is not set or is a placeholder. "
            "Get a free key at https://aistudio.google.com/apikey and set it in your .env file."
        )
    return api_key


def _call_gemini(prompt: str) -> str:
    """Send a prompt to Gemini and return the raw text response."""
    global _client, _model

    if not HAS_GENAI:
        raise ImportError(
            "Neither google-genai nor google-generativeai is installed. "
            "Install with: pip install google-genai"
        )

    api_key = _get_api_key()

    if _USE_NEW_SDK:
        # New google.genai SDK
        if _client is None:
            _client = genai.Client(api_key=api_key)
        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text.strip()
    else:
        # Legacy google.generativeai SDK
        if _model is None:
            genai.configure(api_key=api_key)
            _model = genai.GenerativeModel('gemini-2.5-flash')
        response = _model.generate_content(prompt)
        return response.text.strip()


def _clean_json_response(text: str) -> str:
    """Strip markdown code fences from an AI response to get pure JSON."""
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def extract_syllabus_from_text(text: str) -> dict:
    """
    Uses Google Gemini to analyze the text of the PDF and automatically extract 
    the syllabus (chapters and keywords) in the format expected by the matcher.
    
    Returns:
        dict: { "Subject Name": { "Chapter 1": ["keyword1", "keyword2"], ... } }
    """
    prompt = f"""
    You are an expert academic curriculum analyzer. I am providing you with the extracted text from exam question papers.
    Your task is to identify the overall Subject name, and break it down into 5 to 10 main Chapters or Topics.
    For each chapter, provide a list of highly specific keywords that would appear when discussing that chapter.
    
    You MUST return the output strictly as a valid JSON object. No markdown, no conversational text, JUST JSON.
    Format exactly like this:
    {{
        "Extracted Subject Name": {{
            "Chapter 1 Name": ["keyword1", "keyword2", "keyword3"],
            "Chapter 2 Name": ["keyword4", "keyword5"]
        }}
    }}
    
    Here is the exam text:
    ---
    {text[:30000]}
    ---
    """
    
    print("[AI] Sending text to Gemini for syllabus extraction...")
    result_text = _call_gemini(prompt)
    result_text = _clean_json_response(result_text)
    
    try:
        topics_dict = json.loads(result_text)
        print(f"[AI] Successfully extracted dynamically: {list(topics_dict.keys())[0]}")
        return topics_dict
    except json.JSONDecodeError as e:
        print(f"[AI] Failed to parse JSON from Gemini: {result_text[:500]}")
        raise ValueError("AI returned invalid JSON") from e


def analyze_pdf_topics(pdf_text: str, filename: str, topics: dict) -> dict:
    """
    Uses Gemini to analyze a SINGLE PDF's text against the known topic/chapter list
    and return accurate hit counts per chapter. This gives much better results than
    simple keyword matching because the AI understands context, synonyms, and
    question intent.

    Args:
        pdf_text: The cleaned text from one PDF.
        filename: The filename (for logging).
        topics: The topics dict { subject: { chapter: [keywords] } }

    Returns:
        dict: { "chapter_name": hit_count, ... }
    """
    # Build a chapter list for the prompt
    chapter_list = []
    for subject, chapters in topics.items():
        for chapter, keywords in chapters.items():
            sample_kw = ", ".join(keywords[:5])
            chapter_list.append(f'  - "{chapter}" (keywords: {sample_kw})')

    chapters_str = "\n".join(chapter_list)

    prompt = f"""You are an expert exam question paper analyzer. I will give you:
1. A list of chapters/topics with sample keywords.
2. The full extracted text of an exam question paper.

Your job: For EACH chapter, count how many questions or sub-questions in this paper are related to that chapter.
Be thorough — a single question may cover multiple chapters. Count partial relevance too.
Analyze the actual meaning/intent of each question, not just exact keyword matches.

CHAPTERS:
{chapters_str}

EXAM PAPER TEXT (from file: {filename}):
---
{pdf_text[:25000]}
---

Return ONLY a valid JSON object mapping each chapter name to its question count (integer).
No markdown, no explanation, JUST the JSON object.
Example format:
{{
    "Chapter Name 1": 3,
    "Chapter Name 2": 1,
    "Chapter Name 3": 0
}}

Include ALL chapters from the list above, even if the count is 0.
"""

    print(f"[AI] Analyzing '{filename}' with Gemini for per-PDF topic detection...")
    result_text = _call_gemini(prompt)
    result_text = _clean_json_response(result_text)

    try:
        hits = json.loads(result_text)
        # Ensure all values are integers
        hits = {k: int(v) for k, v in hits.items()}
        total = sum(hits.values())
        top_3 = sorted(hits.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"[AI] '{filename}': {total} total hits. Top: {', '.join(f'{ch}({c})' for ch, c in top_3)}")
        return hits
    except (json.JSONDecodeError, ValueError) as e:
        print(f"[AI] Failed to parse per-PDF analysis for '{filename}': {result_text[:500]}")
        # Return empty dict so caller can fall back to keyword matching
        return {}
