"""
Field schemas (Pydantic models)
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class FieldBase(BaseModel):
    name: str
    area: float = Field(..., gt=0)
    crop_type: str
    variety: Optional[str] = None
    soil_type: Optional[str] = None
    planting_date: Optional[datetime] = None
    expected_harvest_date: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class FieldCreate(FieldBase):
    pass

class FieldUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[float] = Field(None, gt=0)
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    soil_type: Optional[str] = None
    planting_date: Optional[datetime] = None
    expected_harvest_date: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None

class FieldResponse(FieldBase):
    id: str
    status: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
