"""
cleaner.py - Cleans extracted text using regex.

Handles common PDF extraction artifacts like:
  - Extra whitespace / blank lines
  - Page headers/footers (e.g. "www.rgpvnotes.in")
  - Stray special characters
  - Hyphenated line breaks
"""

import re


def clean_text(raw_text: str) -> str:
    """
    Takes raw extracted text from a single page and returns a cleaned version.

    Args:
        raw_text: The raw text string from pdfplumber.

    Returns:
        Cleaned text string.
    """
    text = raw_text

    # 1. Remove common website watermarks / headers / footers
    text = re.sub(
        r"(www\.rgpvnotes\.in|rgpvnotes\.in|Downloaded\s+from.*)",
        "",
        text,
        flags=re.IGNORECASE
    )

    # 2. Remove page numbers (standalone numbers on a line)
    text = re.sub(r"^\s*\d{1,3}\s*$", "", text, flags=re.MULTILINE)

    # 3. Fix hyphenated line breaks  (e.g. "com-\nputer" → "computer")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    # 4. Collapse multiple spaces into one
    text = re.sub(r"[ \t]+", " ", text)

    # 5. Collapse multiple blank lines into a single blank line
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 6. Strip leading/trailing whitespace from each line
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(lines)

    # 7. Final strip
    text = text.strip()

    return text


def clean_extracted_data(extracted_data: list[dict]) -> list[dict]:
    """
    Applies clean_text to every page in every PDF's extracted data.

    Args:
        extracted_data: List of dicts from extractor.extract_all_pdfs().

    Returns:
        Same structure, but with cleaned text on every page.
    """
    cleaned = []

    for pdf_data in extracted_data:
        cleaned_pages = []
        for page in pdf_data["pages"]:
            cleaned_pages.append({
                "page_number": page["page_number"],
                "text": clean_text(page["text"])
            })

        cleaned.append({
            "filename": pdf_data["filename"],
            "total_pages": pdf_data["total_pages"],
            "pages": cleaned_pages
        })

    print(f"[*] Cleaned text for {len(cleaned)} PDF(s).")
    return cleaned
