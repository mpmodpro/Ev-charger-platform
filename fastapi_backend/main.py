from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from fastapi_backend import models
from fastapi_backend.database import engine, get_db
from pydantic import BaseModel, Field
import uvicorn
import os

# Initialize FastAPI app
app = FastAPI(
    title="Charger Management API",
    description="API for managing electric vehicle chargers",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Create database tables
models.Base.metadata.create_all(bind=engine)
print("Tables created")

# Pydantic models for request/response validation
class ChargerBase(BaseModel):
    location: str
    available: bool = True
    power: str
    type: str
    notes: Optional[str] = None

class ChargerCreate(ChargerBase):
    pass

class ChargerUpdate(BaseModel):
    location: Optional[str] = None
    available: Optional[bool] = None
    power: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None

class ChargerResponse(ChargerBase):
    id: int
    lastUsed: Optional[str] = None
    createdAt: str
    updatedAt: str

    class Config:
        orm_mode = True

class StatsResponse(BaseModel):
    totalChargers: int
    availableChargers: int
    unavailableChargers: int
    chargerTypes: dict


# Helper function to add sample data
def add_sample_data(db: Session):
    # Check if we already have data
    if db.query(models.Charger).count() > 0:
        return
    
    # Sample data
    sample_chargers = [
        models.Charger(
            location="Downtown Parking Garage", 
            available=True, 
            power="50kW", 
            type="CCS", 
            notes="Located near the elevator on level 2"
        ),
        models.Charger(
            location="City Hall - North Lot", 
            available=False, 
            power="150kW", 
            type="CCS/CHAdeMO", 
            notes="Available to public during business hours"
        ),
        models.Charger(
            location="Shopping Mall - Level 2", 
            available=True, 
            power="22kW", 
            type="Type 2", 
            notes="4 hour maximum charging time"
        ),
        models.Charger(
            location="Public Library", 
            available=True, 
            power="11kW", 
            type="Type 2", 
            notes="Free charging for library card holders"
        ),
        models.Charger(
            location="Central Park - East Entrance", 
            available=False, 
            power="7kW", 
            type="Type 1", 
            notes="Solar powered charger"
        ),
        models.Charger(
            location="Tech Campus - Building A", 
            available=True, 
            power="350kW", 
            type="CCS", 
            notes="High-speed charging station"
        )
    ]
    
    for charger in sample_chargers:
        db.add(charger)
    
    db.commit()


# Middleware to initialize sample data
@app.middleware("http")
async def initialize_db(request, call_next):
    db = next(get_db())
    add_sample_data(db)
    response = await call_next(request)
    return response


# API Routes
@app.get("/chargers", response_model=List[ChargerResponse], tags=["Chargers"])
def get_chargers(
    available: Optional[bool] = Query(None, description="Filter by availability"),
    type: Optional[str] = Query(None, description="Filter by charger type"),
    db: Session = Depends(get_db)
):
    """
    Get all chargers with optional filtering
    """
    query = db.query(models.Charger)
    
    if available is not None:
        query = query.filter(models.Charger.available == available)
    
    if type is not None:
        query = query.filter(models.Charger.type == type)
        
    chargers = query.all()
    return [format_charger(charger) for charger in chargers]


@app.get("/chargers/{charger_id}", response_model=ChargerResponse, tags=["Chargers"])
def get_charger(charger_id: int, db: Session = Depends(get_db)):
    """
    Get a specific charger by ID
    """
    charger = db.query(models.Charger).filter(models.Charger.id == charger_id).first()
    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    
    return format_charger(charger)


@app.post("/chargers", response_model=ChargerResponse, status_code=status.HTTP_201_CREATED, tags=["Chargers"])
def add_charger(charger: ChargerCreate, db: Session = Depends(get_db)):
    """
    Add a new charger
    """
    db_charger = models.Charger(
        location=charger.location,
        available=charger.available,
        power=charger.power,
        type=charger.type,
        notes=charger.notes,
    )
    
    db.add(db_charger)
    db.commit()
    db.refresh(db_charger)
    
    return format_charger(db_charger)


@app.put("/chargers/{charger_id}", response_model=ChargerResponse, tags=["Chargers"])
def update_charger(charger_id: int, charger: ChargerUpdate, db: Session = Depends(get_db)):
    """
    Update an existing charger
    """
    db_charger = db.query(models.Charger).filter(models.Charger.id == charger_id).first()
    if not db_charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    
    # Update fields that are present in the request
    update_data = charger.dict(exclude_unset=True)
    
    # Update last_used timestamp if we're changing availability to false
    if 'available' in update_data and update_data['available'] is False and db_charger.available is True:
        db_charger.last_used = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_charger, key, value)
    
    db_charger.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_charger)
    
    return format_charger(db_charger)


@app.patch("/chargers/{charger_id}", response_model=ChargerResponse, tags=["Chargers"])
def partial_update_charger(charger_id: int, charger: ChargerUpdate, db: Session = Depends(get_db)):
    """
    Partially update an existing charger
    """
    # This is identical to PUT but kept separate for RESTful convention
    db_charger = db.query(models.Charger).filter(models.Charger.id == charger_id).first()
    if not db_charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    
    update_data = charger.dict(exclude_unset=True)
    
    # Update last_used timestamp if we're changing availability to false
    if 'available' in update_data and update_data['available'] is False and db_charger.available is True:
        db_charger.last_used = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_charger, key, value)
    
    db_charger.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_charger)
    
    return format_charger(db_charger)


@app.delete("/chargers/{charger_id}", status_code=status.HTTP_200_OK, tags=["Chargers"])
def delete_charger(charger_id: int, db: Session = Depends(get_db)):
    """
    Delete a charger
    """
    db_charger = db.query(models.Charger).filter(models.Charger.id == charger_id).first()
    if not db_charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    
    db.delete(db_charger)
    db.commit()
    
    return {"message": "Charger deleted successfully"}


@app.get("/chargers/stats/summary", response_model=StatsResponse, tags=["Statistics"])
def get_charger_stats(db: Session = Depends(get_db)):
    """
    Get statistics about chargers
    """
    total_chargers = db.query(models.Charger).count()
    available_chargers = db.query(models.Charger).filter(models.Charger.available == True).count()
    unavailable_chargers = total_chargers - available_chargers
    
    # Group by charger type
    charger_types = {}
    types_query = db.query(models.Charger.type, db.func.count(models.Charger.id))\
        .group_by(models.Charger.type)\
        .all()
    
    for charger_type, count in types_query:
        charger_types[charger_type] = count
    
    return {
        "totalChargers": total_chargers,
        "availableChargers": available_chargers,
        "unavailableChargers": unavailable_chargers,
        "chargerTypes": charger_types
    }


# Helper functions
def format_charger(charger: models.Charger) -> dict:
    """Format charger object for API response"""
    return {
        "id": charger.id,
        "location": charger.location,
        "available": charger.available,
        "power": charger.power,
        "type": charger.type,
        "notes": charger.notes,
        "lastUsed": charger.last_used.isoformat() if charger.last_used else None,
        "createdAt": charger.created_at.isoformat(),
        "updatedAt": charger.updated_at.isoformat()
    }


# Run app with uvicorn if executed directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)