import urllib.request
import os

pdf_folder = "pdfs"
pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith('.pdf')]
if not pdf_files:
    print("No PDFs found")
    exit()

pdf_path = os.path.join(pdf_folder, pdf_files[0])
with open(pdf_path, "rb") as f:
    data = f.read()

boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="files"; filename="{pdf_files[0]}"\r\n'
    f"Content-Type: application/pdf\r\n\r\n"
).encode('utf-8') + data + f"\r\n--{boundary}--\r\n".encode('utf-8')

req = urllib.request.Request("http://127.0.0.1:8000/analyze", data=body)
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.status)
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode('utf-8')}")
