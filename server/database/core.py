from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # database/
PROJECT_ROOT = os.path.dirname(BASE_DIR)              # server/
DEFAULT_DB_PATH = os.path.join(PROJECT_ROOT, "ai_twin.db")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_initials = Column(String, default="AI")
    created_at = Column(DateTime, default=datetime.utcnow)

    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("UserTask", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("UserRoadmap", back_populates="user", cascade="all, delete-orphan")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    coach_sessions = relationship("CoachSession", back_populates="user", cascade="all, delete-orphan")
    event_nodes = relationship("EventNode", back_populates="user", cascade="all, delete-orphan")

class UserSkill(Base):
    __tablename__ = "user_skills"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    category = Column(String, default="technical")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="skills")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    metric_type = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    user = relationship("User", back_populates="progress")

class UserTask(Base):
    __tablename__ = "user_tasks"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, default="study")
    duration = Column(String, default="30 mins")
    priority = Column(String, default="medium")
    description = Column(Text, default="")
    completed = Column(Boolean, default=False)
    planner_type = Column(String, default="daily") 
    is_ai = Column(Boolean, default=True)
    day_of_week = Column(String, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="tasks")

class UserRoadmap(Base):
    __tablename__ = "user_roadmaps"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal = Column(String, nullable=False)
    steps_json = Column(Text, default="[]")
    progress_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="roadmaps")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    result_json = Column(Text, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="resume_analyses")

class CoachSession(Base):
    __tablename__ = "coach_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False) 
    result_json = Column(Text, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="coach_sessions")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
