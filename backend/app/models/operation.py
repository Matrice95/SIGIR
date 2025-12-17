"""
Operation model (irrigation, fertilization, treatment)
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Operation(Base):
    __tablename__ = "operations"
    
    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # irrigation, fertilization, treatment, harvest
    date = Column(DateTime, nullable=False)
    field_id = Column(String, ForeignKey("fields.id"), nullable=False)
    
    # Common fields
    notes = Column(String)
    cost = Column(Float)
    
    # Irrigation specific
    water_amount = Column(Float)  # in mm or liters
    irrigation_method = Column(String)
    duration = Column(Float)  # in hours
    
    # Fertilization specific
    fertilizer_type = Column(String)
    fertilizer_quantity = Column(Float)  # in kg
    npk_ratio = Column(String)
    
    # Treatment specific
    product_name = Column(String)
    product_quantity = Column(Float)
    target_pest = Column(String)
    
    # Harvest specific
    harvest_quantity = Column(Float)  # in kg or tons
    quality = Column(String)
    
    # Additional data as JSON
    extra_data = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    field = relationship("Field", back_populates="operations")
