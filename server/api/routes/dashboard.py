from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.core import get_db, User
from api.routes.auth import get_current_user
from services.analytics import get_live_metrics

router = APIRouter()

@router.get("")
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = get_live_metrics(current_user.id, db)
    return {"user_name": current_user.name, **metrics}
