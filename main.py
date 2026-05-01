"""
main.py - Entry point for the Exam Pattern Analyzer.

Full Pipeline:
  1. Extract text from all PDFs in 'pdfs/' folder
  2. Clean the extracted text using regex
  3. Save extracted text as JSON
  4. Match topics using keyword dictionary (topics.json)
  5. Build DataFrame, rank topics, detect trends
  6. Generate web dashboard

Usage:
  python main.py
  (then open dashboard/index.html in your browser)
"""

from src.extractor import extract_all_pdfs
from src.cleaner import clean_extracted_data
from src.saver import save_to_json
from src.matcher import match_all_pdfs
from src.trend_analyzer import run_full_analysis
from src.dashboard import generate_dashboard

# -- Config --
PDF_FOLDER = "pdfs"
OUTPUT_FOLDER = "output"
TOPICS_FILE = "data/topics.json"
DASHBOARD_FOLDER = "dashboard"


def main():
    print("=" * 55)
    print("   EXAM PATTERN ANALYZER")
    print("   Computer Organization & Architecture | RGPV CS-404")
    print("=" * 55)
    print()

    # Step 1: Extract
    print("[Step 1/6] Extracting text from PDFs...")
    raw_data = extract_all_pdfs(PDF_FOLDER)
    if not raw_data:
        print("No PDFs found! Add PDF files to the 'pdfs/' folder and re-run.")
        return
    print()

    # Step 2: Clean
    print("[Step 2/6] Cleaning extracted text...")
    cleaned_data = clean_extracted_data(raw_data)
    print()

    # Step 3: Save extracted text
    print("[Step 3/6] Saving extracted text to JSON...")
    save_to_json(cleaned_data, OUTPUT_FOLDER)
    print()

    # Step 4: Match topics
    print("[Step 4/6] Matching topics from keyword dictionary...")
    match_results = match_all_pdfs(cleaned_data, TOPICS_FILE)
    print()

    # Step 5: Full analysis (DataFrame + top topics + trends)
    print("[Step 5/6] Running full analysis...")
    report = run_full_analysis(match_results, OUTPUT_FOLDER)
    if not report:
        print("Analysis failed. Make sure pandas is installed:")
        print("  pip install pandas")
        return
    print()

    # Step 6: Generate Dashboard
    print("[Step 6/6] Generating web dashboard...")
    dashboard_path = generate_dashboard(report, DASHBOARD_FOLDER)
    print()

    print("=" * 55)
    print("   ALL DONE!")
    print()
    print("   Output files:")
    print(f"     - output/chapter_weightage.csv")
    print(f"     - output/top_topics.json")
    print(f"     - output/trends.json")
    print(f"     - output/analysis_report.json")
    print(f"     - {dashboard_path}")
    print()
    print("   Open the dashboard in your browser:")
    print(f"     {dashboard_path}")
    print("=" * 55)


if __name__ == "__main__":
    main()
