# PyQuest — Python Practice Platform

> ระบบฝึกเขียนโปรแกรมและแก้โจทย์ภาษา Python (Python Programming Practice Platform) ออกแบบตามสถาปัตยกรรม Modular Architecture, Firebase Authentication, FastAPI Backend, SQLite/PostgreSQL, Sandboxed Judge Engine, และ React 19 + TypeScript Frontend

---

## จุดเด่นของระบบ (Key Highlights)

1. **Local Sandboxed Execution (ไม่ต้องใช้ Docker)**:
   - ตรวจและรันโค้ด Python ผ่านกระบวนการแยกส่วน (Isolated Subprocess `python -I -s`) บนเครื่องของผู้ใช้โดยตรง
   - มีระบบขออนุญาตก่อนเริ่มรันครั้งแรก (**First-time Permission Modal**) เพื่อความโปร่งใสและปลอดภัย
   - ป้องกันคำสั่งวนลูปไม่รู้จบ (Timeout Watchdog) และล้างสภาพแวดล้อมเพื่อป้องกันการเข้าถึงความลับของระบบ
2. **ระบบคิดคะแนนแบบ Idempotent**:
   - บันทึกประวัติการส่งคำตอบได้ไม่จำกัดครั้ง แต่เพิ่มคะแนนสะสมและอัปเดตสถานะผ่านโจทย์ให้อัตโนมัติเพียงครั้งเดียว ป้องกันคะแนนเบิ้ล
3. **ความปลอดภัยและสิทธิ์การใช้งาน (RBAC)**:
   - ตรวจสอบ ID Token ของ Firebase บน Backend ด้วย Firebase Admin SDK / Token Verifier
   - บทบาทผู้ใช้ (`USER` / `ADMIN`) ถูกควบคุมโดยตรงจากฐานข้อมูล
   - ซ่อน Test Cases ที่เป็นความลับอย่างเข้มงวด
4. **ส่วนติดต่อผู้ใช้ระดับพรีเมียม (Modern Dark Aesthetic)**:
   - พัฒนาด้วย React 19, TypeScript, Tailwind CSS, Lucide Icons และ Google Fonts (Outfit, JetBrains Mono)
   - หน้าแก้โจทย์แบบแบ่งสองฝั่ง (Split Workspace), Console แสดง stdout/stderr, รองรับการอัปโหลดไฟล์ `.py`

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
PyQuestApp/
├── backend/
│   ├── app/
│   │   ├── api/             # API Route Handlers (auth, courses, problems, submissions, progress, admin)
│   │   ├── core/            # Database, Config, Security, Logging, Seed Data
│   │   ├── models/          # SQLAlchemy Database Models (User, Course, Problem, TestCase, Submission, etc.)
│   │   ├── schemas/         # Pydantic v2 Schemas & Response Wrappers
│   │   ├── services/        # Business Logic & Local Judge Sandbox
│   │   ├── dependencies/    # Auth & Admin Route Dependencies
│   │   └── repositories/    # Database Queries
│   ├── tests/               # Unit, Integration & Security Tests (pytest)
│   ├── alembic/             # Database Migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # App Root & React Router
│   │   ├── components/      # Layout (Navbar, Footer), Modals (Consent Modal)
│   │   ├── features/auth/   # Firebase Auth Context & Dev Switcher
│   │   ├── pages/           # Courses, CourseDetail, Problem Workspace, Dashboard, Admin
│   │   ├── services/        # API Client & Firebase Web SDK Setup
│   │   └── types/           # TypeScript Domain Definitions
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # Architecture, Database, API & Security Documentation
└── README.md
```

---

## ขั้นตอนการติดตั้งและเริ่มใช้งาน (Quick Start)

### 1. รัน Backend (FastAPI)

```powershell
# เปิด Terminal ที่ 1
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# นำเข้าฐานข้อมูลและ Seed ข้อมูลตัวอย่าง
python -m alembic upgrade head
python app/core/seed_data.py

# สตาร์ตเซิร์ฟเวอร์
uvicorn app.main:app --port 8000 --reload
```
เซิร์ฟเวอร์ Backend จะทำงานที่ `http://127.0.0.1:8000` (Swagger UI ที่ `/docs`)

---

### 2. รัน Frontend (React 19 + TypeScript + Vite)

```powershell
# เปิด Terminal ที่ 2
cd frontend
npm install
npm run dev
```
เข้าใช้งานเว็บแอปพลิเคชันได้ที่ `http://localhost:5173`

---

## บัญชีสำหรับทดสอบทันที (One-Click Dev Accounts)

ในหน้า Login หรือแถบด้านบนของระบบ มีปุ่มสลับบัญชีทดสอบได้ทันที:
- **User (ผู้เรียน)**: `student@pyquest.com` (บทบาท `USER` เข้าทำโจทย์ รันโค้ด ส่งตรวจ สะสมคะแนน)
- **Admin (ผู้ดูแลระบบ)**: `admin@pyquest.com` (บทบาท `ADMIN` เข้าหน้า `/admin` จัดการคอร์ส โจทย์ และ Test Cases)
- หรือสมัครสมาชิกใหม่ผ่าน Firebase Authentication ด้วยอีเมลและรหัสผ่านจริงได้ทันที

---

## การทดสอบระบบอัตโนมัติ (Automated Tests)

```powershell
# รัน Unit Tests, Integration Tests และ Security Tests ทั้งหมด
python -m pytest backend/tests -v

# ตรวจสอบ TypeScript & Build Frontend Production Bundle
npm run build --prefix frontend
```