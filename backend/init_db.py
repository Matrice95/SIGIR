"""
Database initialization script
Creates all tables in the database
"""
from app.db.database import Base, engine
from app.models.user import User
from app.models.field import Field
from app.models.operation import Operation
from app.models.alert import Alert

def init_db():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
