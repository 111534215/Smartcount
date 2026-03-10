from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import engine, Base
from .routers import appointments, users

# 自動建立資料庫表格
Base.metadata.create_all(bind=engine)

# 初始化 FastAPI 應用程式
app = FastAPI(title="校園訪客櫃台管理系統")

# 設定 CORS (讓前端 React 可以連線到後端)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 開發環境允許所有來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 建立必要的資料夾 (存放照片與 QR Code)
UPLOAD_DIRS = ["uploads/faces", "uploads/qrcode"]
for d in UPLOAD_DIRS:
    if not os.path.exists(d):
        os.makedirs(d)

# 註冊路由
app.include_router(appointments.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Campus Visitor Management System API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
