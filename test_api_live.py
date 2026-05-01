"""Test the /analyze endpoint with actual PDF files using urllib."""
import urllib.request
import json
import os

# Build multipart form data manually
boundary = "----TestBoundary7MA4YWxkTrZu0gW"
body_parts = []

pdf_folder = "pdfs"
pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith('.pdf')]

for pdf_name in pdf_files:
    pdf_path = os.path.join(pdf_folder, pdf_name)
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()
    
    body_parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="{pdf_name}"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    )
    body_parts.append(pdf_data)
    body_parts.append(b"\r\n")

body_parts.append(f"--{boundary}--\r\n")

# Combine binary and text
body = b""
for part in body_parts:
    if isinstance(part, str):
        body += part.encode("utf-8")
    else:
        body += part

req = urllib.request.Request("http://127.0.0.1:8000/analyze", data=body)
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

try:
    with urllib.request.urlopen(req, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
        print(f"Status: {response.status}")
        print(f"Response status: {data.get('status')}")
        print(f"Files processed: {data.get('files_processed')}")
        print(f"Predictions count: {len(data.get('predictions', []))}")
        print(f"Top topics count: {len(data.get('top_topics', []))}")
        
        if data.get("predictions"):
            print("\nFirst 3 predictions:")
            for p in data["predictions"][:3]:
                print(f"  {p['chapter']}: {p.get('prediction', 'N/A')} / {p.get('trend', 'N/A')}")
        
        if data.get("top_topics"):
            print("\nTop 3 topics:")
            for t in data["top_topics"][:3]:
                print(f"  #{t['rank']}: {t['chapter']} ({t['total_hits']} hits)")
        
        print("\nAPI TEST PASSED")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
