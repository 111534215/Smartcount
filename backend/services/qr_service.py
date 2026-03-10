import qrcode
import os
from uuid import uuid4

def generate_appointment_qr(appointment_id: int):
    # QR Code 內容：我們存入預約的 ID
    # 警衛掃描後，前端會解析出這個 ID 並呼叫簽到 API
    data = f"visitor_app:{appointment_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # 存放在臨時資料夾，檔名使用隨機 UUID 避免衝突
    os.makedirs("uploads/qrcode", exist_ok=True)
    file_name = f"qr_{appointment_id}_{uuid4().hex[:8]}.png"
    file_path = os.path.join("uploads/qrcode", file_name)
    
    img.save(file_path)
    return file_path
