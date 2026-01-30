# Local Development Environment

## ✅ Setup Tamamlandı!

Virtual environment oluşturuldu ve tüm bağımlılıklar kuruldu.

---

## 🚀 Hızlı Başlangıç

### Seçenek 1: Otomatik Başlatma (Önerilen)

```bash
cd /Users/kadirarici/Desktop/SENTINEL
./start_local.sh
```

Bu script otomatik olarak:
- ✅ Backend'i başlatır (port 8000)
- ✅ Frontend'i başlatır (port 5173)
- ✅ Ctrl+C ile her ikisini birden kapatır

---

### Seçenek 2: Manuel Başlatma

**Terminal 1 - Backend:**
```bash
cd /Users/kadirarici/Desktop/SENTINEL/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/kadirarici/Desktop/SENTINEL/frontend
npm run dev
```

---

## 📍 Erişim URL'leri

- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

---

## 📁 Proje Yapısı

```
SENTINEL/
├── backend/
│   ├── venv/           # ✅ Python virtual environment
│   ├── grammars/       # ✅ Tree-sitter grammarları (7/8 built)
│   ├── app/
│   │   ├── engine/     # Hybrid extraction engine
│   │   ├── routes/     # API endpoints
│   │   └── main.py     # FastAPI app
│   └── requirements.txt
│
├── frontend/
│   ├── node_modules/   # ✅ NPM dependencies
│   ├── src/
│   │   ├── components/ # Premium React components
│   │   └── services/   # API client
│   └── package.json
│
├── start_local.sh      # 🚀 Otomatik başlatma scripti
└── RUN_LOCAL.md        # Bu dosya
```

---

## 🛠️ Geliştirme Komutları

### Backend (virtual env içinde)

```bash
cd backend
source venv/bin/activate

# Veritabanını sıfırla
rm -f data/hpes.db

# Testleri çalıştır
pytest

# Lint kontrolü
flake8 app/

# Type checking
mypy app/
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Vulnerabilities düzelt
npm audit fix
```

---

## 📦 Kurulu Paketler

### Backend (Python)
- FastAPI 0.104.1
- Tree-sitter 0.20.4 (7/8 language)
- PyMuPDF 1.23.7
- SQLAlchemy 2.0.23
- Pydantic 2.5.0

### Frontend (Node.js)
- React 18.2.0
- Vite 5.4.21
- TailwindCSS 3.3.5
- Monaco Editor 4.6.0

---

## 🔧 Sorun Giderme

### "Port already in use" hatası
```bash
# Port 8000'i kullanı process'i bul ve kapat
lsof -ti:8000 | xargs kill -9

# Port 5173'ü kullanı process'i bul ve kapat
lsof -ti:5173 | xargs kill -9
```

### Virtual environment aktif değil
```bash
cd backend
source venv/bin/activate
# Prompt'ta (venv) görünmeli
```

### Tree-sitter C++ hatası
Normal, 7/8 dil yeterli. C++ desteği gerekirse:
```bash
cd backend
source venv/bin/activate
python scripts/build_grammars.py
```

---

## 🎯 Sonraki Adımlar

1. ✅ Backend ve Frontend çalışıyor
2. ⏳ Test dosyası upload et
3. ⏳ Extraction sonuçlarını incele
4. ⏳ Feedback loop test et
5. ⏳ Export özelliğini dene

---

**Tebrikler! 🎉 Local development ortamınız hazır!**
