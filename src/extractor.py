"""
extractor.py - Extracts raw text from PDF files using pdfplumber.
"""

import pdfplumber
from pathlib import Path


def extract_text_from_pdf(pdf_path: str) -> dict:
    """
    Reads a single PDF file and extracts text from every page.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        A dict with:
          - "filename": name of the PDF
          - "total_pages": number of pages
          - "pages": list of {"page_number": int, "text": str}
    """
    pdf_path = Path(pdf_path)
    pages_data = []

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages_data.append({
                "page_number": i,
                "text": text
            })

    return {
        "filename": pdf_path.name,
        "total_pages": len(pages_data),
        "pages": pages_data
    }


def extract_all_pdfs(pdf_folder: str) -> list[dict]:
    """
    Finds every .pdf in the given folder and extracts text from each.

    Args:
        pdf_folder: Path to the folder containing PDFs.

    Returns:
        A list of dicts (one per PDF), each produced by extract_text_from_pdf.
    """
    pdf_folder = Path(pdf_folder)
    pdf_files = sorted(pdf_folder.glob("*.pdf"))

    if not pdf_files:
        print(f"[!]  No PDF files found in '{pdf_folder}'")
        return []

    results = []
    for pdf_file in pdf_files:
        print(f"[*] Extracting: {pdf_file.name}")
        data = extract_text_from_pdf(pdf_file)
        results.append(data)

    print(f"\n[OK] Extracted text from {len(results)} PDF(s).")
    return results
