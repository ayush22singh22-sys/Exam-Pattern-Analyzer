"""Quick pipeline validation script."""
from src.extractor import extract_text_from_pdf
from src.cleaner import clean_text
from src.matcher import match_topics_in_text, load_topics
from src.prediction_engine import predict_topics, trend_prediction
import pandas as pd

# Test extract
pdf_data = extract_text_from_pdf("pdfs/Unit_1_Computer_Organization_and_Architecture_www_rgpvnotes_in.pdf")
print(f"Extracted: {pdf_data['filename']}, {pdf_data['total_pages']} pages")

# Test clean
cleaned_text = clean_text(pdf_data["pages"][0]["text"])
print(f"Cleaned first page: {len(cleaned_text)} chars")

# Test match
topics = load_topics("data/topics.json")
hits = match_topics_in_text(cleaned_text, topics)
print(f"Hits from page 1: {sum(hits.values())} total")

# Test with full pipeline like api.py does
full_text = "\n".join(page["text"] for page in pdf_data["pages"])
full_text = clean_text(full_text)
hits = match_topics_in_text(full_text, topics)

# Build DataFrame like api.py
chapters = []
for subject, ch_dict in topics.items():
    chapters.extend(ch_dict.keys())

data = {}
year = "2020"
for chapter in chapters:
    if chapter not in data:
        data[chapter] = {}
    data[chapter][year] = hits.get(chapter, 0)

df = pd.DataFrame(data).T
df.columns = [year]
df = df.T.groupby(level=0).sum().T
df["chapter"] = df.index
df.fillna(0, inplace=True)

print(f"DataFrame shape: {df.shape}")
print(df.head())

# Test prediction
df_predict = predict_topics(df)
print(f"Predictions: {len(df_predict)} rows")
print(df_predict.head())

df_trend = trend_prediction(df)
print(f"Trends: {len(df_trend)} rows")
print(df_trend.head())

# Merge
merged = pd.merge(df_predict, df_trend, on="chapter")
print(f"Merged: {len(merged)} rows")
print(merged.head())

# Test Total column addition like api.py line 143
df["Total"] = df.drop(columns=["chapter"]).sum(axis=1)
df_sorted = df.sort_values("Total", ascending=False)
top_topics_list = []
for rank, (idx, row) in enumerate(df_sorted.head(15).iterrows(), start=1):
    top_topics_list.append({
        "rank": rank,
        "chapter": row["chapter"],
        "total_hits": int(row["Total"])
    })
print(f"Top topics: {len(top_topics_list)}")
for t in top_topics_list[:3]:
    print(f"  #{t['rank']}: {t['chapter']} ({t['total_hits']})")

print("\nALL PIPELINE TESTS PASSED")
