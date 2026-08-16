from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager
from . import models, schemas, database, ai_engine

models.Base.metadata.create_all(bind=database.engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = database.SessionLocal()
    try:
        if not db.query(models.CategoryLimit).first():
            defaults = [
                models.CategoryLimit(category="Market & Gıda", monthly_limit=7500.0),
                models.CategoryLimit(category="Fatura & Abonelik", monthly_limit=3000.0),
                models.CategoryLimit(category="Akaryakıt & Ulaşım", monthly_limit=4000.0),
                models.CategoryLimit(category="Restoran & Kafe", monthly_limit=2500.0),
                models.CategoryLimit(category="Giyim & Aksesuar", monthly_limit=2000.0),
            ]
            db.add_all(defaults)
            db.commit()
    finally:
        db.close()
    yield

app = FastAPI(title="FişAI - Akıllı Bütçe ve Fatura API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Transactions ---
@app.get("/api/v1/transactions", response_model=List[schemas.TransactionOut])
def get_transactions(db: Session = Depends(database.get_db)):
    return db.query(models.Transaction).order_by(models.Transaction.date.desc()).all()

@app.post("/api/v1/transactions", response_model=schemas.TransactionOut)
def create_transaction(item: schemas.TransactionCreate, db: Session = Depends(database.get_db)):
    if not item.category or item.category == "string" or item.category == "":
        ai_res = ai_engine.predict_category(item.title, item.type)
        item.category = ai_res["category"]
    
    db_item = models.Transaction(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/v1/transactions/{t_id}")
def delete_transaction(t_id: int, db: Session = Depends(database.get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == t_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    db.delete(tx)
    db.commit()
    return {"message": "İşlem silindi"}

# --- Bills ---
@app.get("/api/v1/bills", response_model=List[schemas.BillOut])
def get_bills(db: Session = Depends(database.get_db)):
    return db.query(models.Bill).order_by(models.Bill.billing_period.asc()).all()

@app.post("/api/v1/bills", response_model=schemas.BillOut)
def create_bill(bill: schemas.BillCreate, db: Session = Depends(database.get_db)):
    db_bill = models.Bill(**bill.model_dump())
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@app.delete("/api/v1/bills/{b_id}")
def delete_bill(b_id: int, db: Session = Depends(database.get_db)):
    bill = db.query(models.Bill).filter(models.Bill.id == b_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    db.delete(bill)
    db.commit()
    return {"message": "Fatura silindi"}

# --- Limits ---
@app.get("/api/v1/limits", response_model=List[schemas.CategoryLimitOut])
def get_limits(db: Session = Depends(database.get_db)):
    return db.query(models.CategoryLimit).all()

@app.post("/api/v1/limits", response_model=schemas.CategoryLimitOut)
def set_limit(limit: schemas.CategoryLimitBase, db: Session = Depends(database.get_db)):
    existing = db.query(models.CategoryLimit).filter(models.CategoryLimit.category == limit.category).first()
    if existing:
        existing.monthly_limit = limit.monthly_limit
        db.commit()
        db.refresh(existing)
        return existing
    new_limit = models.CategoryLimit(**limit.model_dump())
    db.add(new_limit)
    db.commit()
    db.refresh(new_limit)
    return new_limit

# --- AI Endpoints ---
@app.post("/api/v1/ai/categorize")
def auto_categorize(req: schemas.AICategorizeRequest):
    return ai_engine.predict_category(req.text)

@app.get("/api/v1/ai/insights", response_model=schemas.AIAnalysisResponse)
def get_budget_insights(db: Session = Depends(database.get_db)):
    txs = db.query(models.Transaction).all()
    limits = db.query(models.CategoryLimit).all()
    bills = db.query(models.Bill).all()
    return ai_engine.analyze_budget_anomalies(txs, limits, bills)

@app.post("/api/v1/ai/chat", response_model=schemas.ChatMessageResponse)
def chat_with_fiş_ai(req: schemas.ChatMessageRequest, db: Session = Depends(database.get_db)):
    txs = db.query(models.Transaction).all()
    limits = db.query(models.CategoryLimit).all()
    bills = db.query(models.Bill).all()
    reply = ai_engine.chat_with_assistant(req.message, txs, limits, bills)
    return {"reply": reply}

@app.post("/api/v1/ai/ocr-invoice")
async def ocr_invoice(file: UploadFile = File(...)):
    filename = file.filename or "invoice.png"
    parsed = ai_engine.parse_mock_invoice(filename)
    return {
        "status": "success",
        "file_received": filename,
        "extracted_data": parsed
    }