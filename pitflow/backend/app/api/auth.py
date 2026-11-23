from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import User
from app.schemas.api import AuthToken, LoginRequest
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=AuthToken)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.query(User).filter(User.phone == body.phone).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return AuthToken(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
        user_id=user.id,
    )
