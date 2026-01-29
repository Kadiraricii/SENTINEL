# HPES Backend API - Usage Guide
# HPES Backend API - Kullanım Kılavuzu

---

## 🌍 Language / Dil

- [English Documentation](#english-documentation)
- [Türkçe Dokümantasyon](#türkçe-dokümantasyon)

---

# English Documentation

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Session Management](#session-management)
   - [File Upload](#file-upload)
   - [Text Input](#text-input)
   - [Extraction](#extraction)
   - [Feedback](#feedback)
   - [Export](#export)
4. [Examples](#examples)
5. [Error Handling](#error-handling)

---

## Getting Started

### Base URL

When running locally:
```
http://localhost:8000
```

### Interactive Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You can test all endpoints directly from your browser!

### API Version

Current version: **v2.0.0**

Check version:
```bash
curl http://localhost:8000/
```

Response:
```json
{
  "message": "HPES API v2.0",
  "version": "2.0.0",
  "docs": "/docs",
  "features": ["sessions", "text-input", "batch-processing"]
}
```

---

## Authentication

Currently, HPES v2.0 does not require authentication for local development. All endpoints are publicly accessible.

> **Note**: Authentication will be added in future versions for production deployments.

---

## API Endpoints

### Session Management

Sessions help you organize files into projects or categories.

#### 1. Create a Session

**Endpoint**: `POST /api/sessions`

**Request Body**:
```json
{
  "name": "My Python Project",
  "metadata": {
    "description": "All Python files from my web app",
    "tags": ["python", "web", "backend"]
  }
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "My Python Project",
  "created_at": "2026-01-29T22:00:00Z",
  "updated_at": "2026-01-29T22:00:00Z",
  "metadata": {
    "description": "All Python files from my web app",
    "tags": ["python", "web", "backend"]
  },
  "file_count": 0,
  "block_count": 0
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Python Project",
    "metadata": {"description": "Python web app files"}
  }'
```

---

#### 2. List All Sessions

**Endpoint**: `GET /api/sessions`

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 50)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "My Python Project",
    "created_at": "2026-01-29T22:00:00Z",
    "updated_at": "2026-01-29T22:00:00Z",
    "metadata": {"description": "Python web app files"},
    "file_count": 5,
    "block_count": 23
  },
  {
    "id": 2,
    "name": "Config Files",
    "created_at": "2026-01-29T21:30:00Z",
    "updated_at": "2026-01-29T21:30:00Z",
    "metadata": null,
    "file_count": 3,
    "block_count": 12
  }
]
```

**cURL Example**:
```bash
curl "http://localhost:8000/api/sessions?limit=10"
```

---

#### 3. Get Session Details

**Endpoint**: `GET /api/sessions/{session_id}`

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "My Python Project",
  "created_at": "2026-01-29T22:00:00Z",
  "updated_at": "2026-01-29T22:00:00Z",
  "metadata": {"description": "Python web app files"},
  "file_count": 5,
  "block_count": 23,
  "files": [1, 2, 3, 4, 5]
}
```

**cURL Example**:
```bash
curl "http://localhost:8000/api/sessions/1"
```

---

#### 4. Update Session

**Endpoint**: `PUT /api/sessions/{session_id}`

**Request Body** (all fields optional):
```json
{
  "name": "Renamed Project",
  "metadata": {
    "description": "Updated description"
  }
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Renamed Project",
  "created_at": "2026-01-29T22:00:00Z",
  "updated_at": "2026-01-29T22:30:00Z",
  "metadata": {"description": "Updated description"},
  "file_count": 5,
  "block_count": 23
}
```

---

#### 5. Delete Session

**Endpoint**: `DELETE /api/sessions/{session_id}`

**Response** (204 No Content)

**Note**: Deleting a session does NOT delete files or extracted blocks. It only removes the grouping.

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8000/api/sessions/1"
```

---

#### 6. Add File to Session

**Endpoint**: `POST /api/sessions/{session_id}/files/{file_id}`

**Response** (201 Created):
```json
{
  "message": "File added to session",
  "file_id": 5
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/sessions/1/files/5"
```

---

#### 7. Remove File from Session

**Endpoint**: `DELETE /api/sessions/{session_id}/files/{file_id}`

**Response** (204 No Content)

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8000/api/sessions/1/files/5"
```

---

### File Upload

Upload files for code extraction.

**Endpoint**: `POST /api/upload`

**Request**: Multipart form data

**Supported Formats**:
- PDF (.pdf)
- Word Documents (.docx)
- Text files (.txt, .md, .log, .conf, .sh, .py, .js, etc.)

**Example using cURL**:
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@/path/to/your/file.pdf"
```

**Example using Python**:
```python
import requests

url = "http://localhost:8000/api/upload"
files = {"file": open("document.pdf", "rb")}
response = requests.post(url, files=files)

print(response.json())
# Output: {"file_id": 1, "filename": "document.pdf", ...}
```

**Response** (200 OK):
```json
{
  "file_id": 1,
  "filename": "1706563200_document.pdf",
  "file_type": "pdf",
  "file_size": 245678,
  "file_hash": "abc123...",
  "message": "File uploaded successfully"
}
```

---

### Text Input

Process text or markdown directly without uploading a file.

#### Process Text/Markdown

**Endpoint**: `POST /api/input/text`

**Request Body**:
```json
{
  "content": "def hello():\n    print('Hello World')\n\nclass User:\n    def __init__(self, name):\n        self.name = name",
  "source_type": "paste"
}
```

**Fields**:
- `content` (required): The text to process
- `source_type` (optional): Either "paste" or "markdown" (default: "paste")

**Response** (200 OK):
```json
{
  "text_input_id": 1,
  "source_type": "paste",
  "created_at": "2026-01-29T22:00:00Z",
  "blocks": [
    {
      "id": 1,
      "content": "def hello():\n    print('Hello World')",
      "language": "python",
      "block_type": "code",
      "confidence_score": 95.5,
      "validation_method": "tree-sitter",
      "start_line": 1,
      "end_line": 2,
      "status": "pending"
    },
    {
      "id": 2,
      "content": "class User:\n    def __init__(self, name):\n        self.name = name",
      "language": "python",
      "block_type": "code",
      "confidence_score": 98.2,
      "validation_method": "tree-sitter",
      "start_line": 4,
      "end_line": 6,
      "status": "pending"
    }
  ],
  "cached": false
}
```

**Example using Python**:
```python
import requests

url = "http://localhost:8000/api/input/text"
data = {
    "content": """
def calculate(x, y):
    return x + y

result = calculate(5, 3)
print(result)
    """,
    "source_type": "paste"
}

response = requests.post(url, json=data)
result = response.json()

print(f"Extracted {len(result['blocks'])} code blocks")
for block in result['blocks']:
    print(f"- {block['language']}: {block['confidence_score']}% confidence")
```

---

#### Get Text Input History

**Endpoint**: `GET /api/input/history`

**Query Parameters**:
- `skip` (optional): Pagination offset
- `limit` (optional): Max results (default: 20)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "source_type": "paste",
    "created_at": "2026-01-29T22:00:00Z",
    "file_hash": "abc123..."
  }
]
```

---

### Extraction

Extract code/config blocks from uploaded files.

**Endpoint**: `POST /api/extract/{file_id}`

**Response** (200 OK):
```json
{
  "file_id": 1,
  "filename": "document.pdf",
  "total_blocks": 15,
  "blocks": [
    {
      "id": 1,
      "content": "function fetchData() { ... }",
      "language": "javascript",
      "block_type": "code",
      "confidence_score": 92.3,
      "validation_method": "tree-sitter",
      "start_line": 10,
      "end_line": 25,
      "status": "pending"
    }
  ],
  "processing_time": 1.234
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/extract/1"
```

---

### Feedback

Provide feedback to improve extraction accuracy.

**Endpoint**: `POST /api/feedback`

**Request Body**:
```json
{
  "block_id": 1,
  "action": "accept",
  "corrected_language": null,
  "corrected_type": null
}
```

**Actions**:
- `accept`: Block is correct
- `reject`: Block is incorrect (false positive)
- `modify`: Block needs correction

**Example - Rejecting a block**:
```json
{
  "block_id": 2,
  "action": "reject"
}
```

**Example - Correcting language**:
```json
{
  "block_id": 3,
  "action": "modify",
  "corrected_language": "typescript",
  "corrected_type": "code"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "updated_confidence": 85.5
}
```

---

### Export

Export accepted blocks as a ZIP file.

**Endpoint**: `GET /api/export/{file_id}`

**Response**: Binary ZIP file

**cURL Example**:
```bash
curl "http://localhost:8000/api/export/1" \
  --output extracted_blocks.zip
```

**Python Example**:
```python
import requests

url = "http://localhost:8000/api/export/1"
response = requests.get(url)

with open("extracted_blocks.zip", "wb") as f:
    f.write(response.content)

print("Downloaded extracted_blocks.zip")
```

---

## Examples

### Complete Workflow Example (Python)

```python
import requests
import time

BASE_URL = "http://localhost:8000"

# 1. Create a session
session_data = {
    "name": "My Project",
    "metadata": {"type": "web-app"}
}
session_response = requests.post(f"{BASE_URL}/api/sessions", json=session_data)
session_id = session_response.json()["id"]
print(f"Created session: {session_id}")

# 2. Upload a file
files = {"file": open("mycode.py", "rb")}
upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
file_id = upload_response.json()["file_id"]
print(f"Uploaded file: {file_id}")

# 3. Add file to session
requests.post(f"{BASE_URL}/api/sessions/{session_id}/files/{file_id}")
print("Added file to session")

# 4. Extract code blocks
extract_response = requests.post(f"{BASE_URL}/api/extract/{file_id}")
blocks = extract_response.json()["blocks"]
print(f"Extracted {len(blocks)} blocks")

# 5. Review and provide feedback
for block in blocks:
    print(f"\nBlock {block['id']}: {block['language']} ({block['confidence_score']}%)")
    print(f"Content preview: {block['content'][:50]}...")
    
    # Accept high-confidence blocks
    if block['confidence_score'] > 85:
        feedback = {
            "block_id": block['id'],
            "action": "accept"
        }
        requests.post(f"{BASE_URL}/api/feedback", json=feedback)
        print("✓ Accepted")

# 6. Export accepted blocks
with open(f"export_file_{file_id}.zip", "wb") as f:
    export_response = requests.get(f"{BASE_URL}/api/export/{file_id}")
    f.write(export_response.content)
print("\n✓ Exported to ZIP")
```

---

### Using Text Input (Quick Extract)

```python
import requests

code_snippet = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Usage
for i in range(10):
    print(fibonacci(i))
"""

response = requests.post(
    "http://localhost:8000/api/input/text",
    json={"content": code_snippet, "source_type": "paste"}
)

result = response.json()
print(f"Found {len(result['blocks'])} code blocks:")

for block in result['blocks']:
    print(f"- Language: {block['language']}")
    print(f"- Confidence: {block['confidence_score']}%")
    print(f"- Lines: {block['start_line']}-{block['end_line']}")
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `204 No Content`: Success with no response body
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Errors

**File too large**:
```json
{
  "detail": "File size 15728640 bytes exceeds maximum allowed size of 10485760 bytes"
}
```

**Unsupported file type**:
```json
{
  "detail": "File type 'exe' is not supported"
}
```

**Session not found**:
```json
{
  "detail": "Session not found"
}
```

---

# Türkçe Dokümantasyon

## 📖 İçindekiler

1. [Başlangıç](#başlangıç)
2. [Kimlik Doğrulama](#kimlik-doğrulama)
3. [API Endpoint'leri](#api-endpointleri)
   - [Session Yönetimi](#session-yönetimi)
   - [Dosya Yükleme](#dosya-yükleme)
   - [Metin Girişi](#metin-girişi)
   - [Çıkarma İşlemi](#çıkarma-işlemi)
   - [Geri Bildirim](#geri-bildirim)
   - [Dışa Aktarma](#dışa-aktarma)
4. [Örnekler](#örnekler-tr)
5. [Hata Yönetimi](#hata-yönetimi)

---

## Başlangıç

### Temel URL

Yerel çalıştırmada:
```
http://localhost:8000
```

### İnteraktif Dokümantasyon

FastAPI otomatik interaktif API dokümantasyonu sağlar:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Tüm endpoint'leri tarayıcınızdan doğrudan test edebilirsiniz!

### API Versiyonu

Güncel versiyon: **v2.0.0**

Versiyon kontrolü:
```bash
curl http://localhost:8000/
```

Yanıt:
```json
{
  "message": "HPES API v2.0",
  "version": "2.0.0",
  "docs": "/docs",
  "features": ["sessions", "text-input", "batch-processing"]
}
```

---

## Kimlik Doğrulama

Şu anda HPES v2.0, yerel geliştirme için kimlik doğrulama gerektirmez. Tüm endpoint'ler herkese açıktır.

> **Not**: Production deployment'lar için gelecek versiyonlarda kimlik doğrulama eklenecektir.

---

## API Endpoint'leri

### Session Yönetimi

Session'lar dosyalarınızı proje veya kategorilere göre organize etmenize yardımcı olur.

#### 1. Session Oluştur

**Endpoint**: `POST /api/sessions`

**İstek Gövdesi**:
```json
{
  "name": "Python Projem",
  "metadata": {
    "description": "Web uygulamamdaki tüm Python dosyaları",
    "tags": ["python", "web", "backend"]
  }
}
```

**Yanıt** (201 Created):
```json
{
  "id": 1,
  "name": "Python Projem",
  "created_at": "2026-01-29T22:00:00Z",
  "updated_at": "2026-01-29T22:00:00Z",
  "metadata": {
    "description": "Web uygulamamdaki tüm Python dosyaları",
    "tags": ["python", "web", "backend"]
  },
  "file_count": 0,
  "block_count": 0
}
```

**cURL Örneği**:
```bash
curl -X POST "http://localhost:8000/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Python Projem",
    "metadata": {"description": "Python web app dosyaları"}
  }'
```

---

#### 2. Tüm Session'ları Listele

**Endpoint**: `GET /api/sessions`

**Sorgu Parametreleri**:
- `skip` (opsiyonel): Atlanacak kayıt sayısı (varsayılan: 0)
- `limit` (opsiyonel): Döndürülecek maksimum kayıt (varsayılan: 50)

**Yanıt** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Python Projem",
    "created_at": "2026-01-29T22:00:00Z",
    "updated_at": "2026-01-29T22:00:00Z",
    "metadata": {"description": "Python web app dosyaları"},
    "file_count": 5,
    "block_count": 23
  },
  {
    "id": 2,
    "name": "Config Dosyaları",
    "created_at": "2026-01-29T21:30:00Z",
    "updated_at": "2026-01-29T21:30:00Z",
    "metadata": null,
    "file_count": 3,
    "block_count": 12
  }
]
```

---

#### 3. Session Detayı

**Endpoint**: `GET /api/sessions/{session_id}`

**Yanıt** (200 OK):
```json
{
  "id": 1,
  "name": "Python Projem",
  "created_at": "2026-01-29T22:00:00Z",
  "updated_at": "2026-01-29T22:00:00Z",
  "metadata": {"description": "Python web app dosyaları"},
  "file_count": 5,
  "block_count": 23,
  "files": [1, 2, 3, 4, 5]
}
```

---

### Dosya Yükleme

Kod çıkarma için dosya yükleyin.

**Endpoint**: `POST /api/upload`

**İstek**: Multipart form data

**Desteklenen Formatlar**:
- PDF (.pdf)
- Word Belgeleri (.docx)
- Metin dosyaları (.txt, .md, .log, .conf, .sh, .py, .js, vb.)

**cURL ile Örnek**:
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@/yol/to/dosyaniz.pdf"
```

**Python ile Örnek**:
```python
import requests

url = "http://localhost:8000/api/upload"
files = {"file": open("belge.pdf", "rb")}
response = requests.post(url, files=files)

print(response.json())
# Çıktı: {"file_id": 1, "filename": "belge.pdf", ...}
```

---

### Metin Girişi

Dosya yüklemeden doğrudan metin veya markdown işleyin.

#### Metin/Markdown İşle

**Endpoint**: `POST /api/input/text`

**İstek Gövdesi**:
```json
{
  "content": "def merhaba():\n    print('Merhaba Dünya')\n\nclass Kullanici:\n    def __init__(self, isim):\n        self.isim = isim",
  "source_type": "paste"
}
```

**Alanlar**:
- `content` (gerekli): İşlenecek metin
- `source_type` (opsiyonel): "paste" veya "markdown" (varsayılan: "paste")

**Python Örneği**:
```python
import requests

url = "http://localhost:8000/api/input/text"
data = {
    "content": """
def topla(x, y):
    return x + y

sonuc = topla(5, 3)
print(sonuc)
    """,
    "source_type": "paste"
}

response = requests.post(url, json=data)
sonuc = response.json()

print(f"{len(sonuc['blocks'])} kod bloğu çıkarıldı")
for blok in sonuc['blocks']:
    print(f"- {blok['language']}: %{blok['confidence_score']} güven")
```

---

### Çıkarma İşlemi

Yüklenen dosyalardan kod/config blokları çıkarın.

**Endpoint**: `POST /api/extract/{file_id}`

**cURL Örneği**:
```bash
curl -X POST "http://localhost:8000/api/extract/1"
```

---

### Geri Bildirim

Çıkarma doğruluğunu artırmak için geri bildirim verin.

**Endpoint**: `POST /api/feedback`

**İşlemler**:
- `accept`: Blok doğru
- `reject`: Blok yanlış (hatalı pozitif)
- `modify`: Blok düzeltmesi gerekiyor

**Örnek - Bloğu reddetme**:
```json
{
  "block_id": 2,
  "action": "reject"
}
```

**Örnek - Dili düzeltme**:
```json
{
  "block_id": 3,
  "action": "modify",
  "corrected_language": "typescript",
  "corrected_type": "code"
}
```

---

### Dışa Aktarma

Kabul edilen blokları ZIP dosyası olarak dışa aktarın.

**Endpoint**: `GET /api/export/{file_id}`

**cURL Örneği**:
```bash
curl "http://localhost:8000/api/export/1" \
  --output cikarilan_bloklar.zip
```

---

## Örnekler (TR)

### Tam İş Akışı Örneği (Python)

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Session oluştur
session_data = {
    "name": "Benim Projem",
    "metadata": {"tip": "web-uygulama"}
}
session_response = requests.post(f"{BASE_URL}/api/sessions", json=session_data)
session_id = session_response.json()["id"]
print(f"Session oluşturuldu: {session_id}")

# 2. Dosya yükle
files = {"file": open("kodum.py", "rb")}
upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
file_id = upload_response.json()["file_id"]
print(f"Dosya yüklendi: {file_id}")

# 3. Dosyayı session'a ekle
requests.post(f"{BASE_URL}/api/sessions/{session_id}/files/{file_id}")
print("Dosya session'a eklendi")

# 4. Kod bloklarını çıkar
extract_response = requests.post(f"{BASE_URL}/api/extract/{file_id}")
bloklar = extract_response.json()["blocks"]
print(f"{len(bloklar)} blok çıkarıldı")

# 5. Gözden geçir ve geri bildirim ver
for blok in bloklar:
    print(f"\nBlok {blok['id']}: {blok['language']} (%{blok['confidence_score']})")
    print(f"İçerik önizleme: {blok['content'][:50]}...")
    
    # Yüksek güvenli blokları kabul et
    if blok['confidence_score'] > 85:
        feedback = {
            "block_id": blok['id'],
            "action": "accept"
        }
        requests.post(f"{BASE_URL}/api/feedback", json=feedback)
        print("✓ Kabul edildi")

# 6. Kabul edilen blokları dışa aktar
with open(f"export_dosya_{file_id}.zip", "wb") as f:
    export_response = requests.get(f"{BASE_URL}/api/export/{file_id}")
    f.write(export_response.content)
print("\n✓ ZIP'e aktarıldı")
```

---

## Hata Yönetimi

### HTTP Durum Kodları

- `200 OK`: İstek başarılı
- `201 Created`: Kaynak başarıyla oluşturuldu
- `204 No Content`: Yanıt gövdesi olmadan başarılı
- `400 Bad Request`: Geçersiz istek verisi
- `404 Not Found`: Kaynak bulunamadı
- `409 Conflict`: Kaynak zaten mevcut
- `422 Unprocessable Entity`: Doğrulama hatası
- `500 Internal Server Error`: Sunucu hatası

### Hata Yanıt Formatı

```json
{
  "detail": "Neyin yanlış gittiğini açıklayan hata mesajı"
}
```

### Yaygın Hatalar

**Dosya çok büyük**:
```json
{
  "detail": "Dosya boyutu 15728640 bayt, izin verilen maksimum 10485760 bayt boyutunu aşıyor"
}
```

**Desteklenmeyen dosya türü**:
```json
{
  "detail": "'exe' dosya türü desteklenmiyor"
}
```

**Session bulunamadı**:
```json
{
  "detail": "Session not found"
}
```

---

## 🚀 İleri Seviye Kullanım

### Batch İşleme (Yakında)

Çok sayıda dosyayı aynı anda işleyin (Phase 2'de gelecek).

### Analytics API (Yakında)

İstatistikler ve trendler için analytics endpoint'leri (Phase 4'te gelecek).

---

## 📞 Yardım ve Destek

- **API Dokümantasyonu**: http://localhost:8000/docs
- **Proje GitHub**: [HPES Repository]
- **Sorunlar**: GitHub Issues

---

**Son Güncelleme**: 29 Ocak 2026  
**Versiyon**: v2.0.0  
**Yazar**: HPES Development Team
