from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum

# 使用者角色
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    GUARD = "guard"
    STUDENT = "student"
    TEACHER = "teacher"

# 預約狀態
class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"      # 已預約，尚未簽到
    CHECKED_IN = "checked_in" # 已簽到
    CHECKED_OUT = "checked_out" # 已簽退
    CANCELLED = "cancelled"  # 已取消

# 使用者模型 (管理員、警衛、學生、老師)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.STUDENT)
    
    # 學生專用欄位
    student_id = Column(String, unique=True, nullable=True)
    id_card_number = Column(String, nullable=True) # 身分證後幾碼或全碼

# 訪客預約模型
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    visit_time = Column(DateTime)
    leave_time = Column(DateTime)
    teacher = Column(String, nullable=True)
    reason = Column(String)
    
    # 簽到簽退相關
    photo = Column(String, nullable=True) # 儲存照片的路徑
    checkin_time = Column(DateTime, nullable=True)
    checkout_time = Column(DateTime, nullable=True)
    status = Column(String, default=AppointmentStatus.PENDING)
    
    # 建立時間
    created_at = Column(DateTime, default=datetime.now)
