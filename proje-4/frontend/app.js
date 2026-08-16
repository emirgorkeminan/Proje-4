const { createApp } = Vue;

const API_BASE = "/api/v1";

createApp({
  data() {
    return {
      currentTab: "dashboard",
      transactions: [],
      bills: [],
      limits: [],
      insights: {
        total_income: 0,
        total_expense: 0,
        net_savings: 0,
        anomalies: [],
        ai_insights: ""
      },
      expenseCategories: [
        "Market & Gıda",
        "Akaryakıt & Ulaşım",
        "Giyim & Aksesuar",
        "Restoran & Kafe",
        "Fatura & Abonelik",
        "Teknoloji & Elektronik",
        "Sağlık & Bakım",
        "Eğlence & Hobiler",
        "Ev & Yaşam",
        "Eğitim & Kitap",
        "Kira & Aidat",
        "Borç & Kredi",
        "Diğer Gider"
      ],
      incomeCategories: [
        "Maaş & Ücret",
        "Freelance & Ek Gelir",
        "Yatırım & Borsa",
        "Kira Geliri",
        "İkinci El Satış",
        "Hediye & Harçlık",
        "Ek Gelir"
      ],
      newTx: {
        title: "",
        amount: null,
        type: "EXPENSE",
        category: ""
      },
      newBill: {
        bill_type: "Elektrik",
        billing_period: "2026-08",
        consumption_amount: 150,
        consumption_unit: "kWh",
        cost: null
      },
      aiSuggested: false,
      activeSpeech: null,
      activeMood: "praise",
      roastIndex: 0,
      praiseIndex: 0,
      isListening: false,
      // Chatbot State
      isChatOpen: false,
      userMsg: "",
      chatHistory: [
        { role: "ai", text: "Merhaba! Ben FişAI akıllı bütçe asistanınızım. Harcamalarınız, faturalarınız veya tasarruf hedefleriniz hakkında bana dilediğinizi sorabilirsiniz!" }
      ],
      categoryChart: null,
      billChart: null
    };
  },
  computed: {
    daysLeftInMonth() {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Math.max(1, lastDay - now.getDate() + 1);
    },
    safeToSpendDaily() {
      const remaining = Math.max(0, this.insights.net_savings);
      return Math.round(remaining / this.daysLeftInMonth);
    },
    healthScore() {
      const income = this.insights.total_income || 0;
      const expense = this.insights.total_expense || 0;
      if (income === 0 && expense === 0) return 100;
      if (income === 0 && expense > 0) return 25;
      
      let score = 100;
      const ratio = (expense / income) * 100;
      if (ratio > 100) score -= 40;
      else if (ratio > 80) score -= 25;
      else if (ratio > 60) score -= 10;

      const anomalyCount = (this.insights.anomalies || []).length;
      score -= (anomalyCount * 10);

      return Math.max(10, Math.min(100, Math.round(score)));
    },
    healthBadges() {
      const list = [];
      const score = this.healthScore;
      const income = this.insights.total_income || 0;
      const savings = this.insights.net_savings || 0;

      if (savings > 0 && income > 0 && (savings / income) >= 0.20) {
        list.push({ name: 'Tasarruf Şampiyonu', icon: '🏆', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', desc: 'Net tasarruf %20 üzeri' });
      }
      if (this.bills.length > 0 && (!this.insights.anomalies || !this.insights.anomalies.some(a => a.includes('fatura')))) {
        list.push({ name: 'Fatura Bükücü', icon: '⚡', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30', desc: 'Faturalar kontrol altında' });
      }
      if (score >= 80) {
        list.push({ name: 'Finansal Dahi', icon: '🎓', color: 'text-lime-400 bg-lime-400/10 border-lime-400/30', desc: 'Sağlık skoru 80+' });
      } else if (score < 50) {
        list.push({ name: 'Tehlikeli Sular', icon: '🚨', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30', desc: 'Bütçe açık veriyor' });
      }
      if (list.length === 0) {
        list.push({ name: 'Bütçe Çırağı', icon: '🌱', color: 'text-slate-300 bg-slate-800 border-slate-700', desc: 'Takibe yeni başladı' });
      }
      return list;
    },
    savingsRecommendations() {
      const tips = [];
      const catExpenses = {};

      this.transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
        catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
      });

      if (catExpenses["Restoran & Kafe"] && catExpenses["Restoran & Kafe"] > 500) {
        const val = catExpenses["Restoran & Kafe"];
        tips.push({
          title: "Dışarıda Yemek & Kafe Detoksu",
          icon: "☕",
          color: "text-amber-400",
          desc: `Bu ay kafe ve restoranlara ${val.toLocaleString('tr-TR')} TL harcadınız. Haftada 1 kez evde kahve/yemek hazırlayarak tasarruf edebilirsiniz.`,
          potentialSavings: `${Math.round(val * 0.35).toLocaleString('tr-TR')} TL / ay`
        });
      } else {
        tips.push({
          title: "Abonelik & Dijital Platform Kontrolü",
          icon: "🍿",
          color: "text-purple-400",
          desc: "Kullanmadığınız dijital dizi/müzik platformlarını dondurarak yıllık bütçenizde önemli bir alan açabilirsiniz.",
          potentialSavings: "450 TL / ay"
        });
      }

      if (catExpenses["Market & Gıda"] && catExpenses["Market & Gıda"] > 1000) {
        const val = catExpenses["Market & Gıda"];
        tips.push({
          title: "Haftalık Liste ile Market Alışverişi",
          icon: "🛒",
          color: "text-lime-400",
          desc: "Market harcamanız toplam bütçenizin önemli bir kısmını oluşturuyor. Liste hazırlayıp anlık alışverişleri engelleyerek %15 tasarruf sağlayabilirsiniz.",
          potentialSavings: `${Math.round(val * 0.15).toLocaleString('tr-TR')} TL / ay`
        });
      } else {
        tips.push({
          title: "Toplu Ulaşım & Akaryakıt Bütçesi",
          icon: "🚗",
          color: "text-cyan-400",
          desc: "Yakın mesafelerde yürüyüş veya toplu ulaşım tercih ederek akaryakıt masraflarını düşürebilirsiniz.",
          potentialSavings: "600 TL / ay"
        });
      }

      tips.push({
        title: "Akıllı Fatura & Gece Tarifesi",
        icon: "⚡",
        color: "text-emerald-400",
        desc: "Çamaşır ve bulaşık makinelerini 22:00 sonrasındaki ucuz elektrik saatlerinde çalıştırarak faturanızı düşürün.",
        potentialSavings: "180 TL / ay"
      });

      return tips;
    },
    peerComparison() {
      const types = [
        { type: "Elektrik", avgCost: 550, unit: "kWh" },
        { type: "Su", avgCost: 220, unit: "m³" },
        { type: "Doğalgaz", avgCost: 850, unit: "m³" },
        { type: "İnternet", avgCost: 320, unit: "Mbps" }
      ];

      return types.map(item => {
        const userBills = this.bills.filter(b => b.bill_type === item.type);
        const lastBill = userBills.length > 0 ? userBills[userBills.length - 1] : null;
        const userCost = lastBill ? lastBill.cost : 0;

        const isLower = userCost <= item.avgCost;
        const diffPct = item.avgCost > 0 ? Math.abs(Math.round(((userCost - item.avgCost) / item.avgCost) * 100)) : 0;

        let statusText = isLower ? `Ortalamadan %${diffPct} Düşük 👏` : `Ortalamadan %${diffPct} Yüksek ⚡`;
        if (userCost === 0) statusText = "Veri Bekleniyor";

        return {
          type: item.type,
          userVal: `${userCost.toLocaleString('tr-TR')} TL`,
          avgVal: `${item.avgCost} TL`,
          isLower,
          statusText,
          note: isLower ? "Tüketiminiz Türkiye standart hane ortalamasının altında, tebrikler!" : "Tüketim miktarınız genel ortalamanın üzerinde seyrediyor."
        };
      });
    },
    monthlyArchive() {
      const monthMap = {};

      this.transactions.forEach(t => {
        const period = t.date ? t.date.substring(0, 7) : "2026-08";
        if (!monthMap[period]) {
          monthMap[period] = { income: 0, expense: 0, bills: 0, catMap: {} };
        }
        if (t.type === 'INCOME') {
          monthMap[period].income += t.amount;
        } else {
          monthMap[period].expense += t.amount;
          monthMap[period].catMap[t.category] = (monthMap[period].catMap[t.category] || 0) + t.amount;
        }
      });

      this.bills.forEach(b => {
        const period = b.billing_period || "2026-08";
        if (!monthMap[period]) {
          monthMap[period] = { income: 0, expense: 0, bills: 0, catMap: {} };
        }
        monthMap[period].bills += b.cost;
      });

      const monthNames = {
        "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan", "05": "Mayıs", "06": "Haziran",
        "07": "Temmuz", "08": "Ağustos", "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık"
      };

      return Object.keys(monthMap).sort().reverse().map(period => {
        const data = monthMap[period];
        const [year, mNum] = period.split("-");
        const periodName = `${monthNames[mNum] || mNum} ${year}`;
        const netSavings = data.income - data.expense;
        const expenseRatio = data.income > 0 ? Math.round((data.expense / data.income) * 100) : (data.expense > 0 ? 100 : 0);
        
        let topCategory = "Yok";
        let maxCatVal = 0;
        Object.entries(data.catMap).forEach(([cat, val]) => {
          if (val > maxCatVal) {
            maxCatVal = val;
            topCategory = cat;
          }
        });

        return {
          period,
          periodName,
          income: data.income,
          expense: data.expense,
          billTotal: data.bills,
          netSavings,
          expenseRatio,
          topCategory
        };
      });
    }
  },
  mounted() {
    this.loadAllData();
  },
  methods: {
    printReport() {
      window.print();
    },
    exportToCSV() {
      let csvContent = "data:text/csv;charset=utf-8,Tarih,Aciklama,Kategori,Tip,Tutar (TL)\n";
      this.transactions.forEach(t => {
        csvContent += `${t.date},${t.title},${t.category},${t.type},${t.amount}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `fis_ai_butce_gecmisi_${new Date().toISOString().substring(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    startVoiceInput() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Tarayıcınız ses tanıma özelliğini desteklemiyor.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.start();
      this.isListening = true;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.newTx.title = transcript;
        this.onTitleChange();
        this.isListening = false;
      };
      recognition.onerror = () => { this.isListening = false; };
      recognition.onend = () => { this.isListening = false; };
    },
    async sendMessage() {
      if (!this.userMsg.trim()) return;
      const text = this.userMsg;
      this.chatHistory.push({ role: "user", text });
      this.userMsg = "";

      try {
        const res = await fetch(`${API_BASE}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        this.chatHistory.push({ role: "ai", text: data.reply });
        this.$nextTick(() => {
          const container = document.getElementById("chatMsgContainer");
          if (container) container.scrollTop = container.scrollHeight;
        });
      } catch (e) {
        console.error("Chat hatası:", e);
      }
    },
    sendQuickMessage(txt) {
      this.userMsg = txt;
      this.sendMessage();
    },
    async loadAllData() {
      await Promise.all([
        this.fetchTransactions(),
        this.fetchBills(),
        this.fetchLimits(),
        this.fetchInsights()
      ]);
      this.renderCharts();
    },
    async fetchTransactions() {
      try {
        const res = await fetch(`${API_BASE}/transactions`);
        this.transactions = await res.json();
      } catch (e) {
        console.error("Transactions hatası:", e);
      }
    },
    async fetchBills() {
      try {
        const res = await fetch(`${API_BASE}/bills`);
        this.bills = await res.json();
      } catch (e) {
        console.error("Bills hatası:", e);
      }
    },
    async fetchLimits() {
      try {
        const res = await fetch(`${API_BASE}/limits`);
        this.limits = await res.json();
      } catch (e) {
        console.error("Limits hatası:", e);
      }
    },
    async fetchInsights() {
      try {
        const res = await fetch(`${API_BASE}/ai/insights`);
        this.insights = await res.json();
      } catch (e) {
        console.error("Insights hatası:", e);
      }
    },
    async onTitleChange() {
      if (this.newTx.title.length > 2) {
        try {
          const res = await fetch(`${API_BASE}/ai/categorize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: this.newTx.title })
          });
          const data = await res.json();
          if (data.matched_keyword) {
            this.newTx.category = data.category;
            this.aiSuggested = true;
          }
        } catch (e) {
          console.error("Categorize hatası:", e);
        }
      }
    },
    async addTransaction() {
      try {
        await fetch(`${API_BASE}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newTx)
        });
        this.newTx = { title: "", amount: null, type: "EXPENSE", category: "" };
        this.aiSuggested = false;
        this.loadAllData();
      } catch (e) {
        console.error("Add tx hatası:", e);
      }
    },
    async deleteTransaction(id) {
      try {
        await fetch(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
        this.loadAllData();
      } catch (e) {
        console.error("Delete tx hatası:", e);
      }
    },
    async addBill() {
      try {
        this.newBill.consumption_unit = this.newBill.bill_type === "Elektrik" ? "kWh" : (this.newBill.bill_type === "Doğalgaz" || this.newBill.bill_type === "Su" ? "m³" : "Mbps");
        await fetch(`${API_BASE}/bills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newBill)
        });
        this.newBill.cost = null;
        this.loadAllData();
      } catch (e) {
        console.error("Add bill hatası:", e);
      }
    },
    async deleteBill(id) {
      try {
        await fetch(`${API_BASE}/bills/${id}`, { method: "DELETE" });
        this.loadAllData();
      } catch (e) {
        console.error("Delete bill hatası:", e);
      }
    },
    triggerRoast() {
      this.activeMood = "roast";
      const nonRentExpenses = [...this.transactions].filter(t => t.type === 'EXPENSE' && t.category !== 'Kira & Aidat' && !t.title.toLowerCase().includes('kira'));
      const topExp = nonRentExpenses.sort((a,b) => b.amount - a.amount)[0];
      const topTitle = topExp ? topExp.title : "dışarıda yemek";
      const topAmt = topExp ? this.formatCurrency(topExp.amount) : "500 TL";

      const roastBank = [
        `Geçen gün '${topTitle}' için tam ${topAmt} harcamışsın! Krallar gibi yaşamayı bırakıp biraz birikim yapmaya ne dersin? 🍿💸`,
        "Cüzdanına baksam sanırım içine rüzgar esiyordur. Harcama hızın ışık hızını geçti! 🚀💥",
        `Yine mi '${topTitle}'? Paranı birikim hesabına yatırmak yerine adeta ateşe atıyorsun! 💸🔥`,
        "Giderlerin geliri sollamak üzere. Yakında kedi mamasıyla beslenmeye başlarsan şaşırma! 🐱🥫",
        "Harika bir finansal stratejin var: Son kuruşuna kadar harca, sonra mucize bekle! 🔮✨",
        "Aylık bütçe limitlerini adeta bir hedef değil, aşılması gereken engel olarak görüyorsun! 🏁🚨"
      ];

      this.activeSpeech = roastBank[this.roastIndex % roastBank.length];
      this.roastIndex++;
    },
    triggerPraise() {
      this.activeMood = "praise";
      const savings = this.formatCurrency(Math.max(0, this.insights.net_savings));

      const praiseBank = [
        `Tebrikler! Bu ay cebinde tam ${savings} net tasarruf var. Finansal özgürlük yolunda harika gidiyorsun! 🏆✨`,
        "Bütçe disiplinin parıldıyor! Gereksiz harcamalardan uzak durarak tam bir şampiyon gibi ilerliyorsun! 🌟💪",
        "Harikasın! Bütçeni düzenli takip etmek geleceğine yaptığın en büyük yatırımdır. 👏👏",
        "Fatura ve harcamaların tamamen kontrol altında. Warren Buffett seninle gurur duyardı! 🎓🧾",
        "Tasarruf yapma hevesin ilham verici. Finansal hedeflerine ulaşmana çok az kaldı! 🚀🌟",
        "Harika bir özdisiplin! Bütçendeki bu denge sayesinde ay sonunu kafa rahat geçireceksin. ✨🌴"
      ];

      this.activeSpeech = praiseBank[this.praiseIndex % praiseBank.length];
      this.praiseIndex++;
    },
    formatCurrency(val) {
      return (val || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("tr-TR");
    },
    renderCharts() {
      const cleoColors = ['#a3e635', '#f43f5e', '#06b6d4', '#facc15', '#c084fc', '#38bdf8', '#fb923c', '#e879f9'];

      const catTotals = {};
      let totalExp = 0;
      this.transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        totalExp += t.amount;
      });

      const catLabels = Object.keys(catTotals).map(cat => {
        const pct = totalExp > 0 ? ((catTotals[cat] / totalExp) * 100).toFixed(1) : 0;
        return `${cat} (%${pct})`;
      });

      const catCtx = document.getElementById('categoryChart');
      if (catCtx) {
        if (this.categoryChart) this.categoryChart.destroy();
        this.categoryChart = new Chart(catCtx, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: Object.values(catTotals),
              backgroundColor: cleoColors,
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { 
                position: 'bottom',
                labels: { color: '#94a3b8', font: { size: 9, weight: 'bold' }, padding: 8 } 
              }
            }
          }
        });
      }

      const billPeriods = [...new Set(this.bills.map(b => b.billing_period))].sort();
      const billTypes = ["Elektrik", "Su", "Doğalgaz", "İnternet"];
      const typeColors = {
        "Elektrik": "#facc15",
        "Su": "#06b6d4",
        "Doğalgaz": "#fb923c",
        "İnternet": "#c084fc"
      };

      const billDatasets = billTypes.map(type => {
        const data = billPeriods.map(period => {
          const match = this.bills.find(b => b.billing_period === period && b.bill_type === type);
          return match ? match.cost : 0;
        });
        return {
          label: type,
          data: data,
          backgroundColor: typeColors[type],
          borderRadius: 6
        };
      });

      const billCtx = document.getElementById('billTrendChart');
      if (billCtx) {
        if (this.billChart) this.billChart.destroy();
        this.billChart = new Chart(billCtx, {
          type: 'bar',
          data: {
            labels: billPeriods,
            datasets: billDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
            },
            plugins: { 
              legend: { 
                display: true, 
                position: 'bottom', 
                labels: { color: '#94a3b8', font: { size: 9, weight: 'bold' }, padding: 8 } 
              } 
            }
          }
        });
      }
    }
  }
}).mount('#app');