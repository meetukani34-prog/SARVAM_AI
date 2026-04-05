import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database.core import SessionLocal, User, create_tables
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_default_user():
    create_tables()
    db = SessionLocal()
    try:
        email = "user@sarvam.ai"
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            user = User(
                email=email,
                name="SARVAM User",
                password_hash=pwd_context.hash("password123"),
                avatar_initials="SU"
            )
            db.add(user)
            db.commit()
            print(f"✅ Default user created: {email} / password123")
        else:
            print(f"ℹ️ User {email} already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    create_default_user()
