"""
matcher.py - Topic matcher function.

For each PDF, counts how many keyword hits each chapter gets.
Uses re.findall() for accurate, case-insensitive matching.

Output per PDF: { "chapter_name": hit_count, ... }
"""

import re
import json
from pathlib import Path


def load_topics(topics_path: str = "data/topics.json") -> dict:
    """
    Loads the topics.json keyword dictionary.

    Returns:
        Dict of { subject: { chapter: [keywords] } }
    """
    with open(topics_path, "r", encoding="utf-8") as f:
        return json.load(f)


def match_topics_in_text(text: str, topics: dict) -> dict:
    """
    Counts keyword hits per chapter in the given text.

    Args:
        text: The cleaned text from a PDF.
        topics: The topics dict { subject: { chapter: [keywords] } }

    Returns:
        Dict of { chapter_name: hit_count }
    """
    text_lower = text.lower()
    results = {}

    for subject, chapters in topics.items():
        for chapter, keywords in chapters.items():
            hit_count = 0
            for keyword in keywords:
                # Use re.findall for accurate word-boundary matching
                # Escape special regex chars in keyword
                pattern = re.escape(keyword.lower())
                matches = re.findall(pattern, text_lower)
                hit_count += len(matches)
            results[chapter] = hit_count

    return results


def extract_year_from_filename(filename: str) -> str:
    """
    Tries to extract a year (e.g. 2019, 2020) from the PDF filename.
    If no year found, returns the filename stem as identifier.

    Args:
        filename: The PDF filename.

    Returns:
        Year string or filename-based identifier.
    """
    # Look for 4-digit year pattern (2000-2099)
    match = re.search(r"(20\d{2})", filename)
    if match:
        return match.group(1)

    # Try 2-digit year (e.g. '19' for 2019)
    match = re.search(r"[_\-\s](\d{2})[_\-\s\.]", filename)
    if match:
        year_2d = int(match.group(1))
        if 10 <= year_2d <= 30:
            return str(2000 + year_2d)

    # Fallback: use filename stem (without extension)
    return Path(filename).stem[:20]


def match_all_pdfs(cleaned_data: list[dict], topics_path: str = "data/topics.json") -> dict:
    """
    Runs topic matching on all PDFs.

    Args:
        cleaned_data: List of cleaned PDF dicts.
        topics_path: Path to topics.json.

    Returns:
        Dict with structure:
        {
            "per_pdf": [
                {
                    "filename": str,
                    "year": str,
                    "hits": { chapter: count }
                },
                ...
            ],
            "chapters": [list of all chapter names]
        }
    """
    topics = load_topics(topics_path)
    per_pdf = []

    # Get all chapter names (preserving order)
    chapters = []
    for subject, ch_dict in topics.items():
        chapters.extend(ch_dict.keys())

    for pdf_data in cleaned_data:
        full_text = "\n".join(page["text"] for page in pdf_data["pages"])
        hits = match_topics_in_text(full_text, topics)
        year = extract_year_from_filename(pdf_data["filename"])

        per_pdf.append({
            "filename": pdf_data["filename"],
            "year": year,
            "hits": hits
        })

        # Print summary for this PDF
        total_hits = sum(hits.values())
        top_3 = sorted(hits.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"  [{year}] {pdf_data['filename']}")
        print(f"    Total hits: {total_hits}")
        print(f"    Top chapters: {', '.join(f'{ch}({c})' for ch, c in top_3)}")

    return {
        "per_pdf": per_pdf,
        "chapters": chapters
    }
