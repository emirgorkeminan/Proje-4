# TECH_DOCS.md — Teknik Mimari ve Dokümantasyon

## 1. Sistem Mimarisi
Uygulama, Docker Compose ortamında izole çalışan 2 katmanlı bir mimariye sahiptir:
- **Frontend Katmanı:** Nginx üzerinde çalışan Vue.js 3, Tailwind CSS ve Chart.js.
- **Backend Katmanı:** FastAPI, SQLAlchemy ORM ve SQLite veritabanı.

## 2. Veri Modeli (Database Schema)
- **Transaction:** `id`, `title`, `amount`, `type` (INCOME/EXPENSE), `category`, `date`
- **Bill:** `id`, `bill_type`, `consumption_amount`, `consumption_unit`, `cost`, `billing_period`
- **CategoryLimit:** `id`, `category`, `monthly_limit`

## 3. API Endpoints
- `GET /api/v1/transactions` — İşlem listesi
- `POST /api/v1/transactions` — Yeni gelir/gider ekleme
- `DELETE /api/v1/transactions/{id}` — İşlem silme
- `GET /api/v1/bills` — Fatura ve tüketim kayıtları
- `POST /api/v1/bills` — Fatura ekleme
- `POST /api/v1/ai/categorize` — Metinden kategori tahmini
- `GET /api/v1/ai/insights` — AI bütçe anomali analizi