# AGENTS.md — Proje 4 AI Kuralları & Çalışma Günlüğü

## 1. Ajan ve Prompt Kuralları
- **Sistem Rolü:** Bütçe ve finans analisti odaklı kodlama asistanı.
- **Kısıtlar:** 
  - Finansal hesaplamalarda yuvarlama hatalarını önlemek için `float` veya `decimal` hassasiyeti korunmalı.
  - Veritabanına kaydedilmeyen ham metinlerin kategori analizleri yerelde deterministik kurallarla çalıştırılmalı.
  - Bağımlılık eklenirken yalnızca güvenli standart kütüphaneler tercih edilmeli.

## 2. Kullanılan Prompt ve Context Kayıtları (Audit Log)

### Oturum 1: Veri Modeli ve Bütçe Limit Mimarisi
- **Prompt:** "FastAPI ve SQLAlchemy kullanarak Gelir/Gider, Fatura ve Kategori Limiti tablolarını içeren modeller tasarla."
- **AI Çıktısı:** Veritabanı sınıfları ve enum yapıları üretildi.
- **İnsan Revizyonu:** Fatura modeline tüketim birimleri (`kWh`, `m³`) ve dönemsel kıyaslama alanları eklendi.

### Oturum 2: AI Anomali ve Kategori Motoru (`ai_engine.py`)
- **Prompt:** "Serbest metinden harcama kategorisi çıkartan ve bütçe limit aşımlarında anomali uyarısı üreten motor yaz."
- **AI Çıktısı:** RegEx ve kelime eşleme tabanlı motor oluşturuldu.
- **İnsan Revizyonu:** Net tasarruf dengesi ve %25 fatura sıçrama analizi eklendi.