"""
saver.py - Saves cleaned data to JSON files in the output folder.
"""

import json
from pathlib import Path


def save_to_json(cleaned_data: list[dict], output_folder: str) -> None:
    """
    Saves each PDF's cleaned data as a separate JSON file,
    and also creates a combined 'all_extracted.json'.

    Args:
        cleaned_data:   List of cleaned PDF dicts from cleaner.
        output_folder:  Path to the output directory.
    """
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    # Save individual JSON per PDF
    for pdf_data in cleaned_data:
        # Turn  "Unit_1_Computer_...pdf"  →  "Unit_1_Computer_...json"
        json_name = Path(pdf_data["filename"]).stem + ".json"
        json_path = output_folder / json_name

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(pdf_data, f, indent=2, ensure_ascii=False)

        print(f"[*] Saved: {json_path}")

    # Save combined file
    combined_path = output_folder / "all_extracted.json"
    with open(combined_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

    print(f"[*] Combined file saved: {combined_path}")
    print(f"\n[OK] All done!  {len(cleaned_data)} file(s) -> '{output_folder}/'")
