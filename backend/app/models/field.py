"""
Field (Parcelle) model
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Field(Base):
    __tablename__ = "fields"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    area = Column(Float, nullable=False)  # in hectares
    crop_type = Column(String, nullable=False)
    variety = Column(String)
    soil_type = Column(String)
    planting_date = Column(DateTime)
    expected_harvest_date = Column(DateTime)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="active")
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="fields")
    # operations = relationship("Operation", back_populates="field", cascade="all, delete-orphan")  # TODO: Create Operation model
