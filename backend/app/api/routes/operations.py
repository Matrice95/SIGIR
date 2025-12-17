"""
Operation routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.database import get_db
from app.models.operation import Operation
from app.models.field import Field
from app.schemas.operation import OperationCreate, OperationUpdate, OperationResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=OperationResponse, status_code=status.HTTP_201_CREATED)
async def create_operation(
    operation_data: OperationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new operation"""
    # Verify field belongs to user
    field = db.query(Field).filter(
        Field.id == operation_data.field_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    operation = Operation(
        id=str(uuid.uuid4()),
        **operation_data.dict()
    )
    
    db.add(operation)
    db.commit()
    db.refresh(operation)
    return operation

@router.get("/", response_model=List[OperationResponse])
async def get_operations(
    field_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all operations for current user"""
    query = db.query(Operation).join(Field).filter(
        Field.owner_id == current_user["id"]
    )
    
    if field_id:
        query = query.filter(Operation.field_id == field_id)
    
    operations = query.offset(skip).limit(limit).all()
    return operations

@router.get("/{operation_id}", response_model=OperationResponse)
async def get_operation(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get operation by ID"""
    operation = db.query(Operation).join(Field).filter(
        Operation.id == operation_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operation not found"
        )
    return operation

@router.put("/{operation_id}", response_model=OperationResponse)
async def update_operation(
    operation_id: str,
    operation_data: OperationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update operation"""
    operation = db.query(Operation).join(Field).filter(
        Operation.id == operation_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operation not found"
        )
    
    # Update fields
    for key, value in operation_data.dict(exclude_unset=True).items():
        setattr(operation, key, value)
    
    db.commit()
    db.refresh(operation)
    return operation

@router.delete("/{operation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_operation(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete operation"""
    operation = db.query(Operation).join(Field).filter(
        Operation.id == operation_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operation not found"
        )
    
    db.delete(operation)
    db.commit()
    return None
