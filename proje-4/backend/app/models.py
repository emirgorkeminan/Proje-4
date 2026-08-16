from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from datetime import datetime
import enum
from .database import Base

class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    amount = Column(Float, nullable=False)
    type = Column(SQLEnum(TransactionType), default=TransactionType.EXPENSE)
    category = Column(String, index=True)
    date = Column(DateTime, default=datetime.utcnow)

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_type = Column(String)  # Elektrik, Su, Doğalgaz, İnternet
    consumption_amount = Column(Float)  # kWh, m3, vb.
    consumption_unit = Column(String)
    cost = Column(Float, nullable=False)
    billing_period = Column(String)  # YYYY-MM
    created_at = Column(DateTime, default=datetime.utcnow)

class CategoryLimit(Base):
    __tablename__ = "category_limits"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, index=True)
    monthly_limit = Column(Float, nullable=False)