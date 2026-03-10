from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import shutil

from ..database import get_db
from .. import models, schemas
from ..services import qr_service

router = APIRouter(
    prefix="/api/appointments",
    tags=["appointments"]
)

# 建立預約
@router.post("/", response_model=schemas.AppointmentResponse)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# 查詢所有預約紀錄
@router.get("/", response_model=List[schemas.AppointmentResponse])
def get_appointments(db: Session = Depends(get_db)):
    return db.query(models.Appointment).all()

# 取得 QR Code 圖片
@router.get("/{appointment_id}/qrcode")
def get_appointment_qr(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="預約紀錄不存在")
    
    # 生成 QR Code 檔案
    file_path = qr_service.generate_appointment_qr(appointment_id)
    
    # 回傳圖片檔案
    return FileResponse(file_path, media_type="image/png")

# 警衛簽到 API (包含拍照上傳)
@router.post("/{appointment_id}/checkin", response_model=schemas.AppointmentResponse)
async def checkin_appointment(
    appointment_id: int, 
    photo: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="預約紀錄不存在")
    
    if db_appointment.status != models.AppointmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="此預約已簽到或已失效")

    # 儲存照片
    file_extension = os.path.splitext(photo.filename)[1]
    photo_filename = f"face_{appointment_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_extension}"
    photo_path = os.path.join("uploads/faces", photo_filename)
    
    with open(photo_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    # 更新資料庫狀態
    db_appointment.status = models.AppointmentStatus.CHECKED_IN
    db_appointment.checkin_time = datetime.now()
    db_appointment.photo = photo_path # 這裡對應 models.py 中的 photo 欄位
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# 訪客簽退 API
@router.post("/{appointment_id}/checkout", response_model=schemas.AppointmentResponse)
def checkout_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="預約紀錄不存在")
    
    if db_appointment.status != models.AppointmentStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="此訪客尚未簽到，無法簽退")

    # 更新資料庫狀態
    db_appointment.status = models.AppointmentStatus.CHECKED_OUT
    db_appointment.checkout_time = datetime.now()
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# 查詢單一預約紀錄
@router.get("/{appointment_id}", response_model=schemas.AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="預約紀錄不存在")
    return db_appointment
