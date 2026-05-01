import shutil
import tempfile
import re
import os
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from src.extractor import extract_text_from_pdf
from src.cleaner import clean_text
from src.matcher import match_topics_in_text, load_topics
from src.prediction_engine import predict_topics, trend_prediction

# Graceful imports for optional dependencies
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("[WARN] python-dotenv not installed. .env file will not be loaded.")

try:
    from src.ai_extractor import extract_syllabus_from_text, analyze_pdf_topics
    HAS_AI_EXTRACTOR = True
except ImportError:
    HAS_AI_EXTRACTOR = False
    print("[WARN] AI extractor unavailable (google-generativeai not installed). Will use topics.json fallback.")

app = FastAPI(title="Exam Pattern Analyzer API", description="API to process PDFs and extract topic trends")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_year_from_filename(filename: str) -> str:
    """Tries to extract a year from a given filename."""
    match = re.search(r"(20\d{2})", filename)
    if match: return match.group(1)
    match = re.search(r"[_\-\s](\d{2})[_\-\s\.]", filename)
    if match:
        y = int(match.group(1))
        if 10 <= y <= 30: return str(2000 + y)
    return Path(filename).stem[:20]


@app.post("/analyze")
async def analyze_pdfs(files: List[UploadFile] = File(...)):
    """
    Accepts multiple PDF files, extracts and cleans text, matches keywords,
    and runs the analysis pipeline including the prediction engine.
    
    When a valid GEMINI_API_KEY is set, each PDF is individually analyzed by
    Gemini AI for accurate, context-aware topic detection. Otherwise falls
    back to keyword matching with topics.json.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
        
    cleaned_data = []
    
    # Process each uploaded file securely in a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        
        for file in files:
            if not file.filename.endswith(".pdf"):
                continue
                
            temp_file_path = temp_dir_path / file.filename
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # 1. Extract text
            try:
                pdf_data = extract_text_from_pdf(str(temp_file_path))
            except Exception as e:
                print(f"Error extracting {file.filename}: {e}")
                continue
            
            # 2. Clean text
            cleaned_pages = []
            for page in pdf_data["pages"]:
                cleaned_pages.append({
                    "page_number": page["page_number"],
                    "text": clean_text(page["text"])
                })
                
            cleaned_data.append({
                "filename": pdf_data["filename"],
                "total_pages": pdf_data["total_pages"],
                "pages": cleaned_pages
            })
            
    if not cleaned_data:
        raise HTTPException(status_code=400, detail="No valid PDF content found.")

    # 3. Build topic dictionary (AI-extracted or fallback to topics.json)
    topics = None
    use_ai_per_pdf = False

    if HAS_AI_EXTRACTOR:
        try:
            # Combine text from all PDFs to give Gemini context for syllabus extraction
            combined_text = ""
            for pdf_data in cleaned_data:
                combined_text += "\n".join(page["text"] for page in pdf_data["pages"])
                
            topics = extract_syllabus_from_text(combined_text)
            use_ai_per_pdf = True  # AI is working, enable per-PDF analysis too
            print("Using AI dynamically extracted syllabus.")
        except Exception as e:
            print(f"AI extraction failed ({e}). Falling back to topics.json.")
    
    if topics is None:
        try:
            topics = load_topics("data/topics.json")
            print("Using topics.json fallback.")
        except Exception as inner_e:
            raise HTTPException(status_code=500, detail=f"Failed to load fallback topics.json: {inner_e}")

    # Gather all chapter names dynamically
    chapters = []
    for subject, ch_dict in topics.items():
        chapters.extend(ch_dict.keys())
        
    per_pdf = []
    
    for pdf_data in cleaned_data:
        full_text = "\n".join(page["text"] for page in pdf_data["pages"])
        year = extract_year_from_filename(pdf_data["filename"])
        
        hits = None
        
        # Try AI-powered per-PDF analysis first (gives unique results per paper)
        if use_ai_per_pdf and HAS_AI_EXTRACTOR:
            try:
                ai_hits = analyze_pdf_topics(full_text, pdf_data["filename"], topics)
                if ai_hits:  # Non-empty result means AI succeeded
                    hits = ai_hits
                    print(f"  [{year}] AI analysis succeeded for {pdf_data['filename']}")
            except Exception as e:
                print(f"  [{year}] AI per-PDF analysis failed for {pdf_data['filename']}: {e}")
        
        # Fallback to keyword matching if AI didn't produce results
        if hits is None:
            hits = match_topics_in_text(full_text, topics)
            print(f"  [{year}] Using keyword matching for {pdf_data['filename']}")
        
        per_pdf.append({
            "filename": pdf_data["filename"],
            "year": year,
            "hits": hits
        })
        
    # Build a DataFrame for Prediction Engine
    # Structure: Dict of Dicts -> pd.DataFrame -> Transpose
    data = {}
    for pdf_info in per_pdf:
         year = pdf_info["year"]
         for chapter in chapters:
             if chapter not in data:
                 data[chapter] = {}
             # Accumulate hits mapped to the given year
             data[chapter][year] = data[chapter].get(year, 0) + pdf_info["hits"].get(chapter, 0)
             
    df = pd.DataFrame(data).T  # Transpose: rows = chapters, cols = unique years
    df.fillna(0, inplace=True)
    df["chapter"] = df.index
    
    # 4. Run prediction engine
    df_predict = predict_topics(df)
    df_trend = trend_prediction(df)
    
    # Merge prediction results
    merged_predictions = pd.merge(df_predict, df_trend, on="chapter")
    predictions_list = merged_predictions.to_dict(orient="records")
    
    # Get top topics by ranking them across all years
    df["Total"] = df.drop(columns=["chapter"]).sum(axis=1)
    df_sorted = df.sort_values("Total", ascending=False)
    
    top_topics_list = []
    for rank, (idx, row) in enumerate(df_sorted.head(15).iterrows(), start=1):
         top_topics_list.append({
             "rank": rank,
             "chapter": row["chapter"],
             "total_hits": int(row["Total"])
         })

    return {
        "status": "success",
        "files_processed": len(cleaned_data),
        "ai_powered": use_ai_per_pdf,
        "predictions": predictions_list,
        "top_topics": top_topics_list
    }

if __name__ == "__main__":
    import uvicorn
    # python api.py
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
