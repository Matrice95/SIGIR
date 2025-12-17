"""
Field routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.database import get_db
from app.models.field import Field
from app.schemas.field import FieldCreate, FieldUpdate, FieldResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=FieldResponse, status_code=status.HTTP_201_CREATED)
async def create_field(
    field_data: FieldCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new field"""
    field = Field(
        id=str(uuid.uuid4()),
        **field_data.dict(),
        owner_id=current_user["id"]
    )
    
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.get("/", response_model=List[FieldResponse])
async def get_fields(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all fields for current user"""
    fields = db.query(Field).filter(
        Field.owner_id == current_user["id"]
    ).offset(skip).limit(limit).all()
    return fields

@router.get("/{field_id}", response_model=FieldResponse)
async def get_field(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get field by ID"""
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    return field

@router.put("/{field_id}", response_model=FieldResponse)
async def update_field(
    field_id: str,
    field_data: FieldUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update field"""
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Update fields
    for key, value in field_data.dict(exclude_unset=True).items():
        setattr(field, key, value)
    
    db.commit()
    db.refresh(field)
    return field

@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete field"""
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    db.delete(field)
    db.commit()
    return None
