"""
Operation schemas (Pydantic models)
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class OperationBase(BaseModel):
    type: str = Field(..., pattern="^(irrigation|fertilization|treatment|harvest)$")
    date: datetime
    field_id: str
    notes: Optional[str] = None
    cost: Optional[float] = None

class IrrigationCreate(OperationBase):
    water_amount: Optional[float] = None
    irrigation_method: Optional[str] = None
    duration: Optional[float] = None

class FertilizationCreate(OperationBase):
    fertilizer_type: Optional[str] = None
    fertilizer_quantity: Optional[float] = None
    npk_ratio: Optional[str] = None

class TreatmentCreate(OperationBase):
    product_name: Optional[str] = None
    product_quantity: Optional[float] = None
    target_pest: Optional[str] = None

class HarvestCreate(OperationBase):
    harvest_quantity: Optional[float] = None
    quality: Optional[str] = None

class OperationCreate(OperationBase):
    # All optional fields for different operation types
    water_amount: Optional[float] = None
    irrigation_method: Optional[str] = None
    duration: Optional[float] = None
    fertilizer_type: Optional[str] = None
    fertilizer_quantity: Optional[float] = None
    npk_ratio: Optional[str] = None
    product_name: Optional[str] = None
    product_quantity: Optional[float] = None
    target_pest: Optional[str] = None
    harvest_quantity: Optional[float] = None
    quality: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class OperationUpdate(BaseModel):
    type: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    cost: Optional[float] = None
    water_amount: Optional[float] = None
    irrigation_method: Optional[str] = None
    duration: Optional[float] = None
    fertilizer_type: Optional[str] = None
    fertilizer_quantity: Optional[float] = None
    npk_ratio: Optional[str] = None
    product_name: Optional[str] = None
    product_quantity: Optional[float] = None
    target_pest: Optional[str] = None
    harvest_quantity: Optional[float] = None
    quality: Optional[str] = None

class OperationResponse(OperationBase):
    id: str
    water_amount: Optional[float] = None
    irrigation_method: Optional[str] = None
    duration: Optional[float] = None
    fertilizer_type: Optional[str] = None
    fertilizer_quantity: Optional[float] = None
    npk_ratio: Optional[str] = None
    product_name: Optional[str] = None
    product_quantity: Optional[float] = None
    target_pest: Optional[str] = None
    harvest_quantity: Optional[float] = None
    quality: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
