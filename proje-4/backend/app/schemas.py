from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    title: str
    amount: float
    type: str
    category: Optional[str] = None
    date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: int
    date: datetime
    model_config = ConfigDict(from_attributes=True)

class BillBase(BaseModel):
    bill_type: str
    consumption_amount: float
    consumption_unit: str
    cost: float
    billing_period: str

class BillCreate(BillBase):
    pass

class BillOut(BillBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CategoryLimitBase(BaseModel):
    category: str
    monthly_limit: float

class CategoryLimitOut(CategoryLimitBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AICategorizeRequest(BaseModel):
    text: str

class AIAnalysisResponse(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    anomalies: List[str]
    ai_insights: str

class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    reply: str