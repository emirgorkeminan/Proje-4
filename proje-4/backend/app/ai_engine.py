import re
from typing import Dict, List, Any

EXPENSE_KEYWORDS = {
    "Market & Gıda": ["migros", "bim", "a101", "şok", "carrefour", "manav", "fırın", "kasap", "pazar", "gıda", "süt", "ekmek"],
    "Akaryakıt & Ulaşım": ["shell", "petrol ofisi", "opet", "bp", "akaryakıt", "benzin", "mazot", "otobüs", "metro", "istanbulkart", "taksi", "uber", "hgs", "otoban"],
    "Giyim & Aksesuar": ["zara", "lcw", "mavi", "mango", "koton", "ayakkabı", "pantolon", "ceket", "giyim", "adidas", "nike", "saat", "çanta"],
    "Restoran & Kafe": ["starbucks", "restoran", "lokanta", "yemek", "kafe", "kahve", "burger", "pizza", "kebap", "döner", "mcdonalds", "yemeksepeti", "getir"],
    "Fatura & Abonelik": ["elektrik", "enerjisa", "su", "iski", "doğalgaz", "igdaş", "türk telekom", "turkcell", "vodafone", "netflix", "spotify", "youtube", "disney"],
    "Teknoloji & Elektronik": ["teknosa", "vatan", "mediamarkt", "apple", "samsung", "bilgisayar", "telefon", "kulaklık", "şarj", "hepsiburada", "trendyol"],
    "Sağlık & Bakım": ["eczane", "hastane", "doktor", "diş", "klinik", "kuaför", "berber", "kozmetik", "watsons", "gratis", "ilaç", "parfüm"],
    "Eğlence & Hobiler": ["sinema", "tiyatro", "konser", "oyun", "steam", "playstation", "bilet", "hobi", "biletix", "etkinlik"],
    "Ev & Yaşam": ["ikea", "koçtaş", "bauhaus", "mobilya", "dekorasyon", "perde", "halı", "arçelik", "beko", "temizlik"],
    "Eğitim & Kitap": ["d&r", "kitap", "kurs", "udemy", "okul", "harç", "kırtasiye", "akademi", "ders"],
    "Kira & Aidat": ["kira", "aidat", "site yönetimi", "konut"],
    "Borç & Kredi": ["kredi kartı", "taksit", "borç", "kredi ödemesi", "avans"]
}

INCOME_KEYWORDS = {
    "Maaş & Ücret": ["maaş", "bordro", "hakediş", "ücret", "şirket"],
    "Freelance & Ek Gelir": ["bionluk", "upwork", "ek iş", "danışmanlık", "proje", "tasarım", "yazılım"],
    "Yatırım & Borsa": ["temettü", "faiz", "borsa", "fon", "kripto", "kar payı", "altın"],
    "Kira Geliri": ["kira geliri", "dükkan kirası", "ev kirası"],
    "İkinci El Satış": ["dolap", "gardrops", "sahibinden", "ikinci el", "satış"],
    "Hediye & Harçlık": ["hediye", "harçlık", "transfer", "bağış", "ikramiye"]
}

def predict_category(text: str, tx_type: str = "EXPENSE") -> Dict[str, Any]:
    text_lower = text.lower()
    mapping = INCOME_KEYWORDS if tx_type == "INCOME" else EXPENSE_KEYWORDS
    default_cat = "Ek Gelir" if tx_type == "INCOME" else "Diğer Gider"

    for category, keywords in mapping.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return {"category": category, "confidence": 0.95, "matched_keyword": kw}
    return {"category": default_cat, "confidence": 0.40, "matched_keyword": None}

def analyze_budget_anomalies(
    transactions: List[Any], 
    limits: List[Any], 
    bills: List[Any]
) -> Dict[str, Any]:
    cat_expenses: Dict[str, float] = {}
    total_income = 0.0
    total_expense = 0.0

    for t in transactions:
        if t.type == "INCOME":
            total_income += t.amount
        else:
            total_expense += t.amount
            cat_expenses[t.category] = cat_expenses.get(t.category, 0.0) + t.amount

    limit_dict = {l.category: l.monthly_limit for l in limits}
    anomalies = []
    
    for cat, spent in cat_expenses.items():
        if cat in limit_dict and cat != "Kira & Aidat":
            limit = limit_dict[cat]
            if spent > limit:
                diff = spent - limit
                anomalies.append(f"⚠️ **{cat}** kategorisinde {limit:.2f} TL bütçe sınırı %{((diff/limit)*100):.1f} aşıldı! (Toplam: {spent:.2f} TL)")
            elif spent > (limit * 0.85):
                anomalies.append(f"⚡ **{cat}** kategorisi limit sınırına yaklaştı (Kullanım: %{((spent/limit)*100):.1f})")

    if len(bills) >= 2:
        recent_bills = sorted(bills, key=lambda x: x.billing_period, reverse=True)
        latest = recent_bills[0]
        prev = recent_bills[1]
        if latest.cost > (prev.cost * 1.25):
            anomalies.append(f"📈 Son **{latest.bill_type}** faturasında ({latest.billing_period}) bir önceki döneme göre %{(((latest.cost - prev.cost)/prev.cost)*100):.1f} artış tespit edildi.")

    net_savings = total_income - total_expense
    if net_savings < 0:
        summary_tone = f"🚨 Bu ay gelir-gider dengeniz eksiye düştü ({net_savings:.2f} TL). Keyfi harcamaları kısmanız önerilir."
    elif total_expense > 0 and (total_expense / (total_income or 1)) > 0.80:
        summary_tone = f"⚠️ Harcamalarınız gelirinizin %{((total_expense/(total_income or 1))*100):.1f}'ini buldu. Tasarruf alanlarına odaklanın."
    else:
        summary_tone = f"✅ Bütçeniz dengede. Mevcut kullanılabilir net tasarruf: {net_savings:.2f} TL."

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": net_savings,
        "anomalies": anomalies,
        "ai_insights": summary_tone
    }

def chat_with_assistant(
    message: str, 
    transactions: List[Any], 
    limits: List[Any], 
    bills: List[Any]
) -> str:
    msg = message.lower().strip()
    
    total_income = sum(t.amount for t in transactions if t.type == "INCOME")
    total_expense = sum(t.amount for t in transactions if t.type == "EXPENSE")
    net_savings = total_income - total_expense
    
    if any(w in msg for w in ["en çok", "en fazla", "nereye"]):
        cat_map = {}
        for t in transactions:
            if t.type == "EXPENSE" and t.category != "Kira & Aidat":
                cat_map[t.category] = cat_map.get(t.category, 0.0) + t.amount
        if not cat_map:
            return "Henüz yeterli harcama veriniz bulunmuyor."
        top_cat = max(cat_map.items(), key=lambda x: x[1])
        return f"Kira hariç en yüksek harcama yaptığınız kategori **{top_cat[0]}** (Toplam: {top_cat[1]:,.2f} TL). Bu alanda dikkatli olmanızı öneririm!"

    elif any(w in msg for w in ["kahve", "starbucks"]):
        coffee_spent = sum(t.amount for t in transactions if t.type == "EXPENSE" and ("kahve" in t.title.lower() or "starbucks" in t.title.lower()))
        if coffee_spent > 0:
            return f"Bu dönem kahve & kafe için toplam **{coffee_spent:,.2f} TL** harcamışsınız. Haftada 2 gün evde kahve hazırlamak size ayda ortalama {coffee_spent * 0.4:,.2f} TL tasarruf ettirebilir! ☕"
        return "Kayıtlarınızda doğrudan kahve harcaması görünmüyor."

    elif any(w in msg for w in ["durum", "bütçe", "nasılım", "özet"]):
        return f"Şu anki mali durumunuz: Toplam Gelir: **{total_income:,.2f} TL**, Toplam Gider: **{total_expense:,.2f} TL**. Net Tasarruf: **{net_savings:,.2f} TL**."

    elif any(w in msg for w in ["fatura", "elektrik", "doğalgaz", "su"]):
        total_bills = sum(b.cost for b in bills)
        return f"Sistemde kayıtlı faturalarınızın toplam tutarı **{total_bills:,.2f} TL**. Gelecek ay için tasarruf adına kullanılmayan cihazları prizden çekebilirsiniz."

    elif any(w in msg for w in ["tavsiye", "öneri", "nasıl tasarruf"]):
        if net_savings < 0:
            return "Acil eylem planı: Dışarıdan yemek siparişlerini durdurun ve aboneliklerinizi gözden geçirin. Bütçeniz şu an açık veriyor!"
        return "Tavsiyem: Gelirinizin en az %20'sini ayın başında birikim hesabına aktarın ve günlük güvenli harcama limitinizi aşmamaya özen gösterin. 🌟"

    return "Sorunuzu analiz ettim. Bütçe durumunuz, faturalarınız veya harcamalarınızla ilgili detaylı sorular sorabilirsiniz (Örn: 'En çok neye harcadım?', 'Kahveye ne kadar gitti?')."

def parse_mock_invoice(text: str) -> Dict[str, Any]:
    bill_type = "Elektrik" if "elektrik" in text.lower() else "Doğalgaz" if "doğalgaz" in text.lower() else "Su"
    cost_match = re.search(r'(\d+[\.,]?\d*)\s*(?:tl|türk lirası)', text, re.IGNORECASE)
    cost = float(cost_match.group(1).replace(',', '.')) if cost_match else 520.0
    return {
        "bill_type": bill_type,
        "cost": cost,
        "consumption_amount": 140.0,
        "consumption_unit": "kWh" if bill_type == "Elektrik" else "m³",
        "billing_period": "2026-08"
    }