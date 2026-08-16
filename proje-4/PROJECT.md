# Proje 4: Aile Bütçesi ve Fatura Takibi (BütçeAI)

## 1. Problem Tanımı ve Kapsam
Aile bütçesindeki plansız harcamaları, kategori bütçe aşımlarını ve dönemsel fatura artış anomalilerini kural/AI motoruyla analiz edip kullanıcıya uyarı üreten sistem.

## 2. Mimari ve Teknoloji Tercihleri
- **Backend:** FastAPI, SQLite, SQLAlchemy, Pydantic
- **Frontend:** Vue.js 3, Tailwind CSS, Chart.js (Nginx)
- **AI & Kural Motoru:** Doğal dil tabanlı kategori tespiti (`ai_engine.py`), limit sapma yüzdesi hesaplama ve mock OCR ayrıştırma servisi.

## 3. Kurulum ve Çalıştırma
```bash
docker compose up --build