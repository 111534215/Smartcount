from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 使用 SQLite 資料庫
SQLALCHEMY_DATABASE_URL = "sqlite:///./campus_visitor.db"

# 建立資料庫引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 建立 Session 類別，用於與資料庫互動
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 所有資料庫模型的基底類別
Base = declarative_base()

# 取得資料庫連線的相依項
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
