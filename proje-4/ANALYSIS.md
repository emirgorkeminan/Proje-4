# Proje 4: Aile Bütçesi ve Fatura Takibi — İş Analizi Dokümanı

## 1. Problem Tanımı
Aile bireylerinin aylık gelir ve giderlerini düzensiz takip etmesi, kategori bazlı bütçe limitlerinin aşılması ve elektrik/su/doğalgaz gibi faturalardaki beklenmedik sıçramaların zamanında fark edilememesi.

## 2. Kapsam ve Kapsam Dışı Tablosu

| Kapsam İçi (In-Scope) | Kapsam Dışı (Out-of-Scope) |
| :--- | :--- |
| Gelir ve gider kaydı oluşturma, listeleme, silme | Gerçek banka API entegrasyonu (Open Banking) |
| Kategori bazlı bütçe limiti tanımlama ve aşım uyarısı | Çoklu para birimi ve canlı döviz çevirisi |
| Fatura (Elektrik, Su, Doğalgaz) tüketim ve tutar takibi | Çoklu aile üyesi yetkilendirme (RBAC) |
| Serbest metinden otomatik harcama kategorisi tespiti | Gerçek OCR donanım/kamera tarama entegrasyonu |
| Aylık harcama anomalisi ve bütçe özeti (AI Insights) | Otomatik fatura ödeme talimatı verme |

---

## 3. Kullanıcı Hikâyeleri (User Stories) & Kabul Kriterleri

### US-01: Akıllı Harcama Kaydı
> **Bir kullanıcı olarak**, harcama açıklamasını yazdığımda kategorinin otomatik önerilmesini istiyorum, böylece manuel kategori seçmekle vakit kaybetmem.

* **Scenario 1: Kategori Otomatik Tespiti**
  * **Given** Kullanıcı harcama açıklamasına "Migros sanal market" yazar.
  * **When** Açıklama 3 karakteri geçtiğinde AI sınıflandırma motoru tetiklenir.
  * **Then** Kategori alanı otomatik olarak "Market & Gıda" şeklinde doldurulur ve ekranda (AI Önerisi) etiketi belirir.

---

### US-02: Bütçe Limiti Aşım Uyarısı
> **Bir aile bireyi olarak**, belirlediğim kategori limitini aştığımda anında uyarılmak istiyorum, böylece ay sonu bütçe açığı vermem.

* **Scenario 1: Limit Aşım Anomalisi**
  * **Given** "Market & Gıda" kategorisi aylık limiti 7,500 TL olarak belirlenmiştir.
  * **When** Yapılan yeni harcama ile toplam kategori harcaması 8,200 TL'ye ulaşır.
  * **Then** AI Anomali paneli kırmızı renkli uyarı üreterek "Market & Gıda kategorisinde 7500.00 TL bütçe sınırı %9.3 aşıldı!" bildirimini gösterir.

---

### US-03: Fatura Tüketim ve Tutar Sıçrama Analizi
> **Bir kullanıcı olarak**, faturam bir önceki döneme göre anormal arttığında bilgilendirilmek istiyorum.

* **Scenario 1: Fatura Artış Sıçraması**
  * **Given** 2026-07 dönemi Elektrik faturası 400 TL'dir.
  * **When** Kullanıcı 2026-08 dönemi için 650 TL tutarında Elektrik faturası girer.
  * **Then** Sistem artış oranını (%62.5) hesaplar ve Fatura Trend Analizi bölümünde uyarısını listeler.