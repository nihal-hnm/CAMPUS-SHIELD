# CampusShield — Quick Start Guide
# NexHack 2.0 | PS 07 — Zero-Trust Campus Document Security Platform

## Running Locally

### 1. Start the Backend
```powershell
cd "c:\Users\harsh\Documents\CAMPUS VAULT\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8001
# API: http://localhost:8001
# Docs: http://localhost:8001/docs
```

### 2. Start the Frontend
```powershell
cd "c:\Users\harsh\Documents\CAMPUS VAULT\frontend"
npm run dev
# App: http://localhost:5173
```

### 3. Demo Logins
| Email | Password | Role |
|-------|----------|------|
| admin@college.edu | admin123 | Super Admin |
| hod@cse.college.edu | hod123 | HOD (Dept Admin) |
| fac1@college.edu | fac123 | Faculty (CS-301) |
| fac2@college.edu | fac123 | Faculty (CS-302) |
| auditor@college.edu | aud123 | Financial Auditor |
| student@college.edu | stu123 | Student |

---

## Attack Demo Scenarios

### Attack 1 — Student tries to open exam paper
Login as `student@college.edu` → Library → Click "CS-301 End-Sem Examination Paper"
→ **DENIED** `ROLE_UNAUTHORIZED`

### Attack 2 — Cross-subject faculty
Login as `fac2@college.edu` (CS-302) → Library → Click "CS-301 End-Sem Examination Paper"
→ **DENIED** `SUBJECT_MISMATCH`

### Attack 3 — Financial Auditor exam bypass
Login as `auditor@college.edu` → Library → Click any exam paper
→ **DENIED** `TAG_SCOPE`

### Attack 4 — HOD correct access
Login as `hod@cse.college.edu` → Library → Click any CSE exam paper
→ **ALLOWED** (HOD bypass rule)

### Attack 5 — Emergency Lockdown
Login as `admin@college.edu` → Admin → Emergency Lockdown
→ Select document, confirm → ALL sessions revoked, doc locked
→ Any subsequent access attempt → **DENIED** `EMERGENCY_LOCKDOWN`

### Attack 6 — Unauthenticated API hit
```bash
curl http://localhost:8001/api/v1/documents/DOC_EXAM_CS301_2024/access
# → 401 Unauthorized
```

---

## Deployment

### Frontend (Vercel)
1. Import repo into Vercel
2. Root dir: `frontend`
3. Build: `npm run build` | Output: `dist`
4. Env vars:
   - `VITE_API_BASE_URL` = your Render backend URL
   - `VITE_USE_MOCKS` = `false`

### Backend (Render)
1. New Web Service → connect repo
2. Root dir: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `CORS_ORIGINS`

### Supabase (optional — mock mode works without it)
1. Create new project at supabase.com
2. SQL Editor → paste contents of `supabase_schema.sql` → Run
3. Update backend `.env` with real Supabase credentials

---

## Project Structure
```
CAMPUS VAULT/
├── frontend/               # Vite + React 18 + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/          # 25+ pages (auth, user, admin)
│   │   ├── services/       # apiClient.ts (mock-aware)
│   │   ├── context/        # AuthContext (Zero-Trust session)
│   │   ├── hooks/          # useIdleTimer, useSession
│   │   ├── components/     # UI + Layout + Security
│   │   ├── mocks/          # data.ts (6 users, 5 docs)
│   │   └── types/          # TypeScript types
│   ├── .env                # VITE_USE_MOCKS=false
│   └── netlify.toml        # Netlify deploy config
│
├── backend/                # FastAPI + Python 3.12
│   ├── main.py             # App entry + CORS + routers
│   ├── config.py           # Pydantic settings
│   ├── models/             # Pydantic request/response models
│   ├── routers/            # auth, documents, access, audit
│   ├── services/           # access_engine (10-step), streaming, supabase
│   ├── requirements.txt
│   └── Procfile            # Render deploy
│
├── supabase_schema.sql     # Full DB schema + seed data + RLS
├── render.yaml             # One-click Render deploy
└── QUICKSTART.md           # This file
```

---

## Zero-Trust Architecture

Every document request → 10-step pipeline (backend only):
1. Token verification
2. User profile fetch
3. Document metadata fetch
4. Revocation & emergency lockdown check
5. Access grant TTL validation (≤1 hr)
6. RBAC evaluation
7. ABAC evaluation (subject/tag isolation)
8. Decision (fail-closed: any error → DENY)
9. Immutable audit log write
10. 64KB chunked streaming (per-chunk revocation check)

**AI is NEVER involved in authorization decisions.**
