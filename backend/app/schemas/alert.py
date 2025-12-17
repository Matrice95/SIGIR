"""
Alert schemas (Pydantic models)
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AlertBase(BaseModel):
    type: str
    title: str
    message: str
    priority: str = "normal"

class AlertCreate(AlertBase):
    user_id: str

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None

class AlertResponse(AlertBase):
    id: str
    user_id: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
