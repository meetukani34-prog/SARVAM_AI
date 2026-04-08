import os, hashlib, bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests

from database.core import get_db, User
from models.schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse, GoogleLoginRequest, SetPasswordRequest

load_dotenv()
router = APIRouter()
bearer_scheme = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-sarvam-ai-twin-do-not-use-in-production")
if SECRET_KEY == "None" or not SECRET_KEY:
    SECRET_KEY = "fallback-secret-key-for-sarvam-ai-twin"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def _get_initials(name: str) -> str:
    if not name: return "AI"
    parts = name.strip().split()
    if len(parts) >= 2: return f"{parts[0][0]}{parts[-1][0]}".upper()
    return name[:2].upper() if name else "AI"

def hash_password(password: str) -> str: 
    # Final Proper Fix V5.0.0: Use raw bcrypt directly to bypass all library-imposed limits.
    # Pre-hash with SHA-256 then bcrypt the 32-byte binary digest.
    pwd_bytes = password.encode("utf-8")
    sha_digest = hashlib.sha256(pwd_bytes).digest() # Binary 32 bytes
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(sha_digest, salt).decode("utf-8")

def verify_password(p: str, h: str) -> bool: 
    # Final Proper Fix V5.0.0: Direct bcrypt verification
    try:
        p_bytes = p.encode("utf-8")
        sha_digest = hashlib.sha256(p_bytes).digest()
        return bcrypt.checkpw(sha_digest, h.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id: raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError: raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/signup", response_model=TokenResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    try:
        user_exists = db.query(User).filter(User.email == req.email).first()
        if user_exists: 
            raise HTTPException(status_code=400, detail="This email is already registered")
        
        user = User(
            email=req.email, 
            name=req.name, 
            password_hash=hash_password(req.password), 
            avatar_initials=_get_initials(req.name)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        token = create_access_token({"sub": str(user.id)})
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "user": {
                "id": user.id, 
                "email": user.email, 
                "name": user.name, 
                "avatar_initials": user.avatar_initials
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print(f"❌ Signup error: {str(e)}")
        # Silencing technical library errors to prevent confusing UI messages
        ui_error = "Database processing error. Please try again with a different password if this persists."
        if "72 bytes" in str(e):
            ui_error = "Security processing failed. Please use a slightly shorter password for now."
        raise HTTPException(status_code=500, detail=f"Signup failed: {ui_error}")

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash): raise HTTPException(status_code=401, detail="Invalid email/password")
    return {"access_token": create_access_token({"sub": str(user.id)}), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "name": user.name, "avatar_initials": user.avatar_initials}}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "avatar_initials": current_user.avatar_initials}

@router.post("/google", response_model=TokenResponse)
def google_auth(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify the Google Token
        idinfo = id_token.verify_oauth2_token(req.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google Token: {str(e)}")

    user = db.query(User).filter(User.email == email).first()
    is_new = False

    if not user:
        # Create new user for Google Login
        # We use a random suffix for password as it won't be used
        user = User(
            email=email,
            name=name,
            avatar_initials=_get_initials(name),
            password_hash=hash_password(os.urandom(24).hex()) 
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new = True

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_initials": user.avatar_initials
        },
        "is_new_user": is_new
    }
