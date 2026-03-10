from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# 訪客預約請求格式
class AppointmentCreate(BaseModel):
    name: str = Field(..., description="訪客姓名")
    phone: str = Field(..., description="電話")
    visit_time: datetime = Field(..., description="來訪時間")
    leave_time: datetime = Field(..., description="預計離校時間")
    teacher: Optional[str] = Field(None, description="受訪老師")
    reason: str = Field(..., description="來訪理由")

# 訪客預約回應格式
class AppointmentResponse(BaseModel):
    id: int
    name: str
    phone: str
    visit_time: datetime
    leave_time: datetime
    teacher: Optional[str]
    reason: str
    status: str
    photo: Optional[str]
    checkin_time: Optional[datetime]
    checkout_time: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# 使用者帳號格式
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "student"
    student_id: Optional[str] = None
    id_card_number: Optional[str] = None

# 批量建立使用者格式
class UserBulkCreate(BaseModel):
    users: List[UserCreate]

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    student_id: Optional[str]

    class Config:
        from_attributes = True
