"""
trend_analyzer.py - pandas DataFrame analysis + trend detection.

Builds a DataFrame: rows = chapters, columns = PDFs/years.
Calculates Total, Avg %, ranks topics, and detects trends.
Exports results to CSV and JSON.
"""

import json
import math
from pathlib import Path

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


def build_dataframe(match_results: dict) -> "pd.DataFrame":
    """
    Builds a pandas DataFrame from match results.

    Rows = chapters, Columns = year/pdf identifiers.
    Each cell = keyword hit count for that chapter in that PDF.

    Args:
        match_results: Output from matcher.match_all_pdfs()

    Returns:
        pandas DataFrame with hit counts + Total + Avg% columns.
    """
    if not HAS_PANDAS:
        print("[!] pandas not installed. Run: pip install pandas")
        return None

    chapters = match_results["chapters"]
    per_pdf = match_results["per_pdf"]

    # Build data dict: { chapter: { year: hits, ... } }
    data = {}
    year_labels = []

    for pdf_info in per_pdf:
        year = pdf_info["year"]
        year_labels.append(year)
        for chapter in chapters:
            if chapter not in data:
                data[chapter] = {}
            data[chapter][year] = pdf_info["hits"].get(chapter, 0)

    # Create DataFrame
    df = pd.DataFrame(data).T  # Transpose so chapters are rows
    df.columns = year_labels

    # Add Total column
    df["Total"] = df.sum(axis=1)

    # Add Avg % column (what % of total hits does this chapter have)
    grand_total = df["Total"].sum()
    if grand_total > 0:
        df["Avg %"] = (df["Total"] / grand_total * 100).round(2)
    else:
        df["Avg %"] = 0.0

    # Sort by Total (descending)
    df = df.sort_values("Total", ascending=False)

    return df


def get_top_topics(df: "pd.DataFrame", top_n: int = 15) -> list[dict]:
    """
    Extracts the top N topics by total hits.

    Args:
        df: The chapter weightage DataFrame.
        top_n: Number of top topics.

    Returns:
        List of {"rank", "chapter", "total_hits", "avg_percent"} dicts.
    """
    if df is None:
        return []

    top = df.head(top_n)
    results = []

    for rank, (chapter, row) in enumerate(top.iterrows(), start=1):
        results.append({
            "rank": rank,
            "chapter": chapter,
            "total_hits": int(row["Total"]),
            "avg_percent": float(row["Avg %"])
        })

    return results


def detect_trends(df: "pd.DataFrame", match_results: dict) -> list[dict]:
    """
    For each chapter, analyzes hits across PDFs/years to determine trend.

    Trend tags:
      - trending   (increasing pattern)
      - fading     (decreasing pattern)
      - stable     (roughly constant)
      - new        (only appears in recent PDFs)
      - absent     (zero hits everywhere)

    Args:
        df: The DataFrame.
        match_results: Original match results for year ordering.

    Returns:
        List of {"chapter", "trend", "hits_per_year", "total"} dicts.
    """
    if df is None:
        return []

    per_pdf = match_results["per_pdf"]
    year_labels = [p["year"] for p in per_pdf]
    trends = []

    for chapter in df.index:
        hits_list = []
        for pdf_info in per_pdf:
            year = pdf_info["year"]
            hits_list.append({
                "year": year,
                "hits": pdf_info["hits"].get(chapter, 0)
            })

        total = int(df.loc[chapter, "Total"])

        # Determine trend
        hit_values = [h["hits"] for h in hits_list]

        if total == 0:
            trend = "absent"
        elif len(hit_values) < 3:
            # Not enough data points for trend — call it stable
            if total > 0:
                trend = "stable"
            else:
                trend = "absent"
        else:
            # Simple trend detection: compare first half avg vs second half avg
            mid = len(hit_values) // 2
            first_half_avg = sum(hit_values[:mid]) / max(mid, 1)
            second_half_avg = sum(hit_values[mid:]) / max(len(hit_values) - mid, 1)

            if second_half_avg > first_half_avg * 1.3:
                trend = "trending"
            elif second_half_avg < first_half_avg * 0.7:
                trend = "fading"
            else:
                trend = "stable"

        # Trend tag (ASCII-safe for Windows terminals)
        emoji_map = {
            "trending": "[UP]",
            "fading": "[DOWN]",
            "stable": "[--]",
            "new": "[NEW]",
            "absent": "[  ]"
        }

        trends.append({
            "chapter": chapter,
            "trend": trend,
            "trend_icon": emoji_map.get(trend, ""),
            "hits_per_year": hits_list,
            "total": total,
            "avg_percent": float(df.loc[chapter, "Avg %"])
        })

    return trends


def run_full_analysis(match_results: dict, output_folder: str) -> dict:
    """
    Runs the complete analysis pipeline:
    1. Build DataFrame + export CSV
    2. Extract top topics + save top_topics.json
    3. Detect trends + save trends.json
    4. Save full analysis_report.json

    Args:
        match_results: Output from matcher.match_all_pdfs()
        output_folder: Where to save outputs.

    Returns:
        Complete analysis report dict.
    """
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    if not HAS_PANDAS:
        print("[!] pandas not installed. Skipping DataFrame analysis.")
        print("    Run:  pip install pandas")
        return {}

    print("  Building chapter weightage DataFrame...")
    df = build_dataframe(match_results)

    if df is not None:
        # Export CSV
        csv_path = output_folder / "chapter_weightage.csv"
        df.to_csv(csv_path)
        print(f"  Saved: {csv_path}")

        # Print table
        print("\n  --- Chapter Weightage Table ---")
        print(df.to_string())
        print()

    # Top topics
    print("  Extracting top topics...")
    top_topics = get_top_topics(df, top_n=15)

    top_topics_path = output_folder / "top_topics.json"
    with open(top_topics_path, "w", encoding="utf-8") as f:
        json.dump(top_topics, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {top_topics_path}")

    # Trends
    print("  Detecting year-wise trends...")
    trends = detect_trends(df, match_results)

    trends_path = output_folder / "trends.json"
    with open(trends_path, "w", encoding="utf-8") as f:
        json.dump(trends, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {trends_path}")

    # Full report
    report = {
        "summary": {
            "total_pdfs": len(match_results["per_pdf"]),
            "total_chapters": len(match_results["chapters"]),
            "top_chapter": top_topics[0]["chapter"] if top_topics else "N/A",
            "top_chapter_hits": top_topics[0]["total_hits"] if top_topics else 0,
        },
        "top_topics": top_topics,
        "trends": trends,
        "match_results": match_results,
    }

    report_path = output_folder / "analysis_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {report_path}")

    return report
