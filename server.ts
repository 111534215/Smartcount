import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECRET_KEY = "campus_visitor_secret_key_change_me";
const PORT = 3000;

const db = new Database("campus_visitor.db");

// 初始化資料庫
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    hashed_password TEXT,
    role TEXT,
    student_id TEXT UNIQUE,
    id_card_number TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    visit_time TEXT,
    leave_time TEXT,
    teacher TEXT,
    reason TEXT,
    photo TEXT,
    checkin_time TEXT,
    checkout_time TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);
// 初始化預設使用者
const defaultUsers = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'guard', password: 'guard123', role: 'guard' },
  { username: 'teacher', password: 'teacher123', role: 'teacher' },
  { username: 'student', password: 'student123', role: 'student' }
];

for (const u of defaultUsers) {
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(u.username);
  if (!user) {
    const hashed = bcrypt.hashSync(u.password, 10);
    db.prepare("INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)").run(u.username, hashed, u.role);
  } else {
    // 強制更新密碼以確保一致性 (開發階段)
    const hashed = bcrypt.hashSync(u.password, 10);
    db.prepare("UPDATE users SET hashed_password = ?, role = ? WHERE username = ?").run(hashed, u.role, u.username);
  }
}

// 設定檔案上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/faces";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `face_${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  app.use(express.json());

  // 中間件：日誌紀錄
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- API Routes ---

  // 1. 使用者登入
  app.post("/api/users/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
      return res.status(401).json({ detail: "帳號或密碼錯誤" });
    }

    const token = jwt.sign({ sub: user.username, role: user.role, id: user.id }, SECRET_KEY, { expiresIn: "24h" });
    res.json({
      access_token: token,
      token_type: "bearer",
      user: { id: user.id, username: user.username, role: user.role }
    });
  });

  // 2. 建立使用者 (初始化用)
  app.post("/api/users", (req, res) => {
    const { username, password, role, student_id, id_card_number } = req.body;
    const hashed_password = bcrypt.hashSync(password, 10);
    try {
      const info = db.prepare("INSERT INTO users (username, hashed_password, role, student_id, id_card_number) VALUES (?, ?, ?, ?, ?)")
        .run(username, hashed_password, role, student_id, id_card_number);
      res.json({ id: info.lastInsertRowid, username, role });
    } catch (e) {
      res.status(400).json({ detail: "使用者名稱已存在" });
    }
  });

  // 2.1 取得所有使用者 (僅限管理員)
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, student_id FROM users").all();
    res.json(users);
  });

  // 2.2 更新使用者密碼 (僅限管理員)
  app.post("/api/users/:id/password", (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ detail: "請提供新密碼" });
    
    const hashed_password = bcrypt.hashSync(password, 10);
    const info = db.prepare("UPDATE users SET hashed_password = ? WHERE id = ?").run(hashed_password, req.params.id);
    
    if (info.changes === 0) return res.status(404).json({ detail: "使用者不存在" });
    res.json({ message: "密碼更新成功" });
  });

  // 3. 建立預約
  app.post("/api/appointments", (req, res) => {
    let { name, phone, visit_time, leave_time, teacher, reason } = req.body;
    
    if (!name || !phone || !visit_time) {
      return res.status(400).json({ detail: "請填寫所有必填欄位 (姓名、電話、入校時間)" });
    }

    // 正規化電話號碼 (僅保留數字)
    const normalizedPhone = phone.replace(/\D/g, '');
    
    // 防呆：檢查是否有相同電話的「待簽到」預約
    const existing = db.prepare("SELECT * FROM appointments WHERE phone = ? AND status = 'pending'").get(normalizedPhone);
    if (existing) {
      return res.status(400).json({ detail: "該電話號碼已有尚未簽到的預約，請先完成入校或聯繫管理員。" });
    }

    try {
      const info = db.prepare("INSERT INTO appointments (name, phone, visit_time, leave_time, teacher, reason) VALUES (?, ?, ?, ?, ?, ?)")
        .run(name, normalizedPhone, visit_time, leave_time, teacher, reason);
      const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(info.lastInsertRowid);
      res.json(appointment);
    } catch (e) {
      console.error("建立預約失敗:", e);
      res.status(500).json({ detail: "系統錯誤，無法建立預約" });
    }
  });

  // 4. 取得所有預約
  app.get("/api/appointments", (req, res) => {
    const appointments = db.prepare("SELECT * FROM appointments ORDER BY created_at DESC").all();
    res.json(appointments);
  });

  // 4.1 搜尋預約 (透過姓名或電話)
  app.get("/api/appointments/search", (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ detail: "請提供搜尋關鍵字" });
    
    const appointments = db.prepare("SELECT * FROM appointments WHERE name LIKE ? OR phone LIKE ? ORDER BY created_at DESC")
      .all(`%${query}%`, `%${query}%`);
    res.json(appointments);
  });

  // 4.2 透過電話找回 QR Code (僅限待簽到)
  app.get("/api/appointments/find-by-phone", (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ detail: "請提供電話號碼" });
    
    const normalizedPhone = (phone as string).replace(/\D/g, '');
    const appointment = db.prepare("SELECT * FROM appointments WHERE phone = ? AND status = 'pending' ORDER BY created_at DESC").get(normalizedPhone);
    if (!appointment) return res.status(404).json({ detail: "找不到該電話的有效預約紀錄" });
    res.json(appointment);
  });

  // 5. 取得單一預約
  app.get("/api/appointments/:id", (req, res) => {
    const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
    if (!appointment) return res.status(404).json({ detail: "預約紀錄不存在" });
    res.json(appointment);
  });

  // 6. 取得 QR Code
  app.get("/api/appointments/:id/qrcode", async (req, res) => {
    const id = req.params.id;
    const data = `visitor_app:${id}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(data);
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      const img = Buffer.from(base64Data, 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
      });
      res.end(img);
    } catch (err) {
      res.status(500).json({ detail: "QR Code 生成失敗" });
    }
  });

  // 7. 簽到 (上傳照片)
  app.post("/api/appointments/:id/checkin", upload.single("photo"), (req: any, res) => {
    const id = req.params.id;
    const photoPath = req.file?.path;
    const checkin_time = new Date().toISOString();
    
    const info = db.prepare("UPDATE appointments SET status = 'checked_in', checkin_time = ?, photo = ? WHERE id = ? AND status = 'pending'")
      .run(checkin_time, photoPath, id);
    
    if (info.changes === 0) return res.status(400).json({ detail: "簽到失敗，可能已簽到或預約不存在" });
    
    const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
    res.json(appointment);
  });

  // 8. 簽退
  app.post("/api/appointments/:id/checkout", (req, res) => {
    const id = req.params.id;
    const checkout_time = new Date().toISOString();
    
    const info = db.prepare("UPDATE appointments SET status = 'checked_out', checkout_time = ? WHERE id = ? AND status = 'checked_in'")
      .run(checkout_time, id);
    
    if (info.changes === 0) return res.status(400).json({ detail: "簽退失敗，可能尚未簽到或預約不存在" });
    
    const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
    res.json(appointment);
  });

  // 9. 靜態檔案服務 (照片)
  app.use("/uploads", express.static("uploads"));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
