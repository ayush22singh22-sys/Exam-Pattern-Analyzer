"""
analyzer.py - Analyzes extracted text to find topics, keywords, and questions.

Works with both study notes and question papers.
"""

import re
import json
from collections import Counter
from pathlib import Path


# Common English stop words to ignore during keyword analysis
STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "must", "can", "could", "of", "in", "to",
    "for", "with", "on", "at", "from", "by", "about", "as", "into",
    "through", "during", "before", "after", "above", "below", "between",
    "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
    "neither", "each", "every", "all", "any", "few", "more", "most",
    "other", "some", "such", "no", "only", "own", "same", "than", "too",
    "very", "just", "because", "if", "when", "where", "how", "what",
    "which", "who", "whom", "this", "that", "these", "those", "it", "its",
    "he", "she", "they", "them", "their", "we", "us", "our", "you", "your",
    "i", "me", "my", "also", "then", "used", "using", "one", "two",
    "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "use", "get", "set", "new", "first", "last", "next", "like", "make",
    "made", "per", "see", "shown", "show", "shows", "fig", "figure",
    "page", "example", "called", "given", "following", "therefore",
    "thus", "hence", "however", "since", "well", "take", "takes",
    "number", "value", "values", "bit", "bits", "case", "need", "needs",
    "note", "notes", "refer", "follow", "www", "rgpvnotes", "com",
    "rgpv", "http", "https", "downloaded"
}


def extract_keywords(text: str, top_n: int = 30) -> list[dict]:
    """
    Extracts the most frequent meaningful keywords from text.

    Args:
        text: The cleaned text content.
        top_n: Number of top keywords to return.

    Returns:
        List of {"keyword": str, "count": int} sorted by frequency.
    """
    # Tokenize: only keep words with 3+ characters
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())

    # Filter stop words
    filtered = [w for w in words if w not in STOP_WORDS]

    # Count frequencies
    counter = Counter(filtered)

    return [
        {"keyword": word, "count": count}
        for word, count in counter.most_common(top_n)
    ]


def extract_topics(text: str) -> list[str]:
    """
    Identifies major topic headings from the text.
    Looks for lines that are fully or mostly UPPERCASE — typical of PDF headings.

    Args:
        text: The cleaned text content.

    Returns:
        List of topic strings found.
    """
    topics = []
    lines = text.splitlines()

    for line in lines:
        line = line.strip()
        if not line or len(line) < 4:
            continue

        # Detect UPPERCASE headings (at least 60% uppercase letters)
        alpha_chars = [c for c in line if c.isalpha()]
        if not alpha_chars:
            continue

        upper_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)

        if upper_ratio >= 0.6 and len(alpha_chars) >= 4:
            # Clean up the topic
            topic = line.strip("- :.")
            if topic and len(topic) > 3:
                topics.append(topic)

    # Remove duplicates while preserving order
    seen = set()
    unique_topics = []
    for t in topics:
        t_lower = t.lower()
        if t_lower not in seen:
            seen.add(t_lower)
            unique_topics.append(t)

    return unique_topics


def extract_questions(text: str) -> list[str]:
    """
    Finds question-like sentences from the text.
    Useful when analyzing previous year question papers.

    Args:
        text: The cleaned text content.

    Returns:
        List of question strings.
    """
    questions = []

    # Pattern 1: Lines ending with '?'
    q_marks = re.findall(r"[^\n]*\?", text)
    questions.extend([q.strip() for q in q_marks if len(q.strip()) > 10])

    # Pattern 2: Lines starting with Q. or Q1. or Q1) etc.
    q_numbered = re.findall(
        r"(?:^|\n)\s*(?:Q\.?\s*\d*|q\.?\s*\d*|\d+\s*[\.\)]\s*).{10,}",
        text
    )
    questions.extend([q.strip() for q in q_numbered])

    # Pattern 3: Common question starters
    q_starters = re.findall(
        r"(?:^|\n)\s*(?:Explain|Describe|Define|What|How|Why|Compare|Discuss|"
        r"Differentiate|Derive|Prove|Calculate|Write|Draw|List|State|Enumerate)"
        r"[^\n]{10,}",
        text,
        re.IGNORECASE
    )
    questions.extend([q.strip() for q in q_starters])

    # Remove duplicates while preserving order
    seen = set()
    unique_questions = []
    for q in questions:
        q_clean = q.strip()
        if q_clean and q_clean.lower() not in seen:
            seen.add(q_clean.lower())
            unique_questions.append(q_clean)

    return unique_questions


def analyze_single_pdf(pdf_data: dict) -> dict:
    """
    Runs full analysis on one PDF's extracted data.

    Args:
        pdf_data: Dict with "filename", "total_pages", "pages".

    Returns:
        Analysis dict with keywords, topics, questions, and stats.
    """
    # Combine all page text
    full_text = "\n".join(page["text"] for page in pdf_data["pages"])

    # Word count
    word_count = len(full_text.split())

    # Extract info
    keywords = extract_keywords(full_text, top_n=30)
    topics = extract_topics(full_text)
    questions = extract_questions(full_text)

    return {
        "filename": pdf_data["filename"],
        "total_pages": pdf_data["total_pages"],
        "word_count": word_count,
        "topics_found": len(topics),
        "questions_found": len(questions),
        "top_keywords": keywords,
        "topics": topics,
        "questions": questions,
    }


def analyze_all(cleaned_data: list[dict]) -> dict:
    """
    Analyzes all PDFs and produces a combined report.

    Args:
        cleaned_data: List of cleaned PDF dicts.

    Returns:
        Full analysis report dict.
    """
    per_pdf_analysis = []
    all_text = ""

    for pdf_data in cleaned_data:
        analysis = analyze_single_pdf(pdf_data)
        per_pdf_analysis.append(analysis)
        all_text += "\n".join(p["text"] for p in pdf_data["pages"]) + "\n"

    # Global analysis across all PDFs
    global_keywords = extract_keywords(all_text, top_n=50)
    global_topics = extract_topics(all_text)
    global_questions = extract_questions(all_text)

    report = {
        "summary": {
            "total_pdfs": len(cleaned_data),
            "total_pages": sum(a["total_pages"] for a in per_pdf_analysis),
            "total_words": sum(a["word_count"] for a in per_pdf_analysis),
            "total_topics": len(global_topics),
            "total_questions": len(global_questions),
        },
        "global_keywords": global_keywords,
        "global_topics": global_topics,
        "global_questions": global_questions,
        "per_pdf": per_pdf_analysis,
    }

    print("[OK] Analysis complete!")
    print(f"   [*] PDFs analyzed: {report['summary']['total_pdfs']}")
    print(f"   [*] Total pages: {report['summary']['total_pages']}")
    print(f"   [*] Total words: {report['summary']['total_words']}")
    print(f"   [*] Topics found: {report['summary']['total_topics']}")
    print(f"   [*] Questions found: {report['summary']['total_questions']}")

    return report


def save_report(report: dict, output_folder: str) -> str:
    """
    Saves the analysis report as JSON.

    Args:
        report: The analysis report dict.
        output_folder: Path to the output directory.

    Returns:
        Path to the saved report file.
    """
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    report_path = output_folder / "analysis_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"[OK] Report saved: {report_path}")
    return str(report_path)
