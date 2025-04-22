from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, func
from sqlalchemy.sql import expression
from fastapi_backend.database import Base
from datetime import datetime

class Charger(Base):
    __tablename__ = "chargers"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(120), nullable=False)
    available = Column(Boolean, default=True)
    power = Column(String(20), nullable=False)
    type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
