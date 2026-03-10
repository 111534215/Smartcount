from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth_utils

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

# 建立使用者 (註冊)
@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="使用者名稱已存在")
    
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        student_id=user.student_id,
        id_card_number=user.id_card_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 登入 API
@router.post("/login")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_credentials.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not auth_utils.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_utils.create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

# 批次建立使用者 (初始化用)
@router.post("/bulk", response_model=List[schemas.UserResponse])
def bulk_create_users(users: List[schemas.UserCreate], db: Session = Depends(get_db)):
    created_users = []
    for user in users:
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        if not db_user:
            hashed_password = auth_utils.get_password_hash(user.password)
            new_user = models.User(
                username=user.username,
                hashed_password=hashed_password,
                role=user.role,
                student_id=user.student_id,
                id_card_number=user.id_card_number
            )
            db.add(new_user)
            created_users.append(new_user)
    db.commit()
    return created_users
