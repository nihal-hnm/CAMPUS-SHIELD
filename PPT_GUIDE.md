# CampusShield — Hackathon PPT Creation & Pitch Guide
**NexHack 2.0 · Problem Statement PS 07 · Zero-Trust Campus Document Security Platform**

> Use this guide to build your slide deck (10–12 slides) and deliver a crisp 5–7 minute pitch + live demo to the judges.

---

## Visual Design Guide for Your Slides
Match your slides to the CampusShield app's actual design language:
- **Canvas / Background**: Light Neutral (`#F6F7F9`) or White (`#FFFFFF`)
- **Primary Dark / Header Slide**: Deep Navy (`#17243A`)
- **Accent Color**: Institutional Blue (`#2563EB`)
- **Semantic Callouts**: Green (`#15803D`) for `ALLOW`, Red (`#DC2626`) for `DENY` / Lockdown, Amber (`#D97706`) for Pending / Expiring
- **Fonts**: Inter (Headings & Body) + JetBrains Mono (IDs, Codes, Audit Logs)
- **Rule of Thumb**: Max 3–4 short bullets per slide; let diagrams, tables, and live screenshots carry the story.

---

## Slide-by-Slide Structure & Speaker Script

### Slide 1 — Title Slide
- **Visual**: Deep Navy (`#17243A`) background with the CampusShield shield mark and a clean screenshot of the Login / Admin Dashboard.
- **Title**: **CampusShield**
- **Subtitle**: Zero-Trust Campus Document Security & Academic Access Platform
- **Footer**: NexHack 2.0 · Problem Statement PS 07 · Team Name
- **What to say**:
  > "Good morning judges. Universities handle thousands of sensitive files every semester — end-semester exam papers, grading sheets, research, and student records. Today, most campuses still share them over WhatsApp groups or open Drive links with zero expiry, zero audit, and zero control. That's why we built **CampusShield**."

---

### Slide 2 — The Problem
- **Headline**: Campus document sharing is broken and blind
- **4 Key Pain Points**:
  1. **Over-privileged access**: A faculty member in one subject can access another subject's exam paper; graduated or exited users keep old links.
  2. **Uncontrolled sharing**: Static links get forwarded outside the department or campus.
  3. **No session accountability**: Shared logins across multiple laptops with no single-device enforcement or idle lock.
  4. **Zero auditability**: When a paper leaks, administration cannot prove who accessed what, when, or why.
- **What to say**:
  > "Once a PDF link is forwarded in a group chat, the college loses all control. There is no way to scope access by department and subject, no automatic expiry, and no tamper-proof audit trail."

---

### Slide 3 — Our Solution: Zero-Trust CampusShield
- **Headline**: Every request verified in real time. Fail-closed by default.
- **3 Core Pillars**:
  1. **Deterministic Zero-Trust Access**: Every document open checks Role, Department, Subject ownership, Classification tier, and Emergency Lockdown status — any mismatch results in `DENY`.
  2. **Multi-Device & Session Security**: Single-device login enforcement (logging in on a second laptop immediately terminates the first), idle timeout, and periodic re-authentication.
  3. **Complete Academic Workflow**: Unified portal for Ultra Admin, Admin, H.O.D, Faculty, and Students across 7 campus departments.
- **What to say**:
  > "CampusShield applies Zero-Trust to campus academics. Nothing is trusted by default — every single view, permission grant, magic link, and assignment submission is scoped, time-bound, and logged."

---

### Slide 4 — System Architecture
- **Diagram** (draw this clean 3-tier flow on the slide):
  ```text
  [ React 19 + TypeScript + Tailwind SPA (Vercel) ]
                   │
                   ├──► Auth & Session Guard (SHA-256 + Single-Device active_session_id)
                   │
                   ▼
  [ Supabase Postgres (Multi-Laptop Real-Time Sync) ]
     ├── users / departments (7 depts, roll numbers, subject mappings)
     ├── documents / permissions / access_requests / magic_links
     ├── assignment_tasks / assignment_submissions
     └── audit_logs (immutable: UPDATE & DELETE blocked at DB level)
  ```
- *(Mention `backend/` FastAPI deterministic policy engine as the server-side security blueprint)*
- **What to say**:
  > "The frontend is built with React 19, TypeScript, and Tailwind CSS, backed by Supabase Postgres so every user, department, document, and grade syncs live across laptops. At the database layer, `audit_logs` has Postgres rules that block all updates and deletes, making the audit trail immutable."

---

### Slide 5 — Role Hierarchy & Scoped Access Matrix
- **Table to put on slide**:

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **Ultra Admin / Admin** | Campus-wide (`ALL`) | Create Admins, H.O.Ds, Faculty & Students; manage all 7 departments, documents, permissions, magic links, requests, sessions, and emergency lockdowns |
| **H.O.D (`dept_admin`)** | Strictly own Department | Add Dept Users & Students (auto roll no.), upload dept docs, grant dept permissions, issue magic links, approve/deny dept requests, view/grade submissions |
| **Faculty** | Assigned Dept & Subject(s) | Upload subject documents, publish assignment problem statements, download student submissions, assign grades & feedback |
| **Student** | Own Dept & Public Docs | Browse authorized library, view faculty problem statements, upload assignments, track grades & feedback, request document access |

- **What to say**:
  > "Notice the strict blast-radius isolation: an H.O.D in B.Tech CSE can manage students, approve requests, and issue magic links **only** inside CSE. A Faculty member can grade and upload **only** for their assigned subject."

---

### Slide 6 — Zero-Trust Document Classification & Access Engine
- **4 Classification Tiers** (show as a 4-row color-coded ladder):
  - **Public** (`badge-success`): Visible to all authenticated campus users including Students.
  - **Internal** (`badge-info`): Staff, Faculty, H.O.D, and Admins only; Students blocked.
  - **Restricted** (`badge-warning`): H.O.D, Admin, and tagged users (e.g., Auditors) only.
  - **Confidential** (`badge-danger`): Strictly subject-owner Faculty + Admin only.
- **Deterministic Decision Flow**:
  - `Emergency Locked?` → `DENY (EMERGENCY_LOCKDOWN)`
  - `Wrong Department?` → `DENY (DEPARTMENT_MISMATCH)`
  - `Wrong Role / Classification?` → `DENY (ROLE_UNAUTHORIZED)`
  - `Wrong Subject?` → `DENY (SUBJECT_MISMATCH)`
  - Otherwise → `ALLOW`
- **What to say**:
  > "Access decisions are 100% deterministic — never guessed. Even if two faculty members are in the same CSE department, Dr. A teaching `CS-301` cannot open Dr. B's confidential `CS-302` exam paper."

---

### Slide 7 — Key Security Features (What Makes Us Stand Out)
- **4 Feature Cards with Screenshots**:
  1. **Single-Device Enforcement**: Logging into an account on Laptop B updates `active_session_id` in Supabase; Laptop A detects it within seconds and displays *"Logged in elsewhere"*.
  2. **Magic Links (Time-Limited Access)**: Generate temporary view-only links (15 min to 24 hrs) with automatic expiry and instant revocation.
  3. **Access Request & Approval Workflow**: Students/Faculty request access with a justification; H.O.D/Admin approves or denies, automatically creating the permission record.
  4. **Emergency Lockdown**: One-click lockdown by Document, Department, or User to immediately block compromised access.
- **What to say**:
  > "If a professor forgets to log out in a computer lab and signs in on their laptop at home, the lab session is automatically terminated."

---

### Slide 8 — Academic Workflow: Assignments & Grading
- **3-Step Visual Flow**:
  1. **Faculty Publishes Task**: Creates an assignment with Title, Subject, Due Date, and **Problem Statement**.
  2. **Student Uploads Solution**: Sees the problem statement in **My Assignments**, attaches their file, and submits.
  3. **Faculty Accesses & Grades**: Downloads the student's actual submitted file and assigns a Grade (`A+`–`F` or score) + Feedback, synced live to the student's portal.
- **What to say**:
  > "Beyond security, CampusShield replaces fragmented email and Drive submissions with a unified academic loop — problem statement to submission to grading — all inside the same Zero-Trust platform."

---

### Slide 9 — Multi-Department Campus Scale
- **Visual**: Screenshot of **Department Management** showing the 7 pre-configured departments:
  - `B.Tech CSE` · `B.Pharmacy` · `Forensic Science` · `Hotel Management` · `Agriculture` · `BBA` · `Law`
- **Highlights**:
  - Expand any department to manage **Subjects**, **Students (with auto-generated Roll Numbers)**, **Faculties**, and **H.O.D**.
  - Bidirectional sync: adding a student or faculty in Users automatically updates their Department roster.

---

### Slide 10 — Live Demo Flow (Keep a Backup Slide with Screenshots!)
Run this exact **90-second live demo** during judging:
1. **Login as Ultra Admin** on Laptop 1 → show **Users** & **7 Departments** synced from Supabase.
2. **Create a Faculty & Student** (or H.O.D) → show they appear in both **Users** and **Department**.
3. **Single-Device Test**: Log in with that same account on Laptop 2 (or a second browser) → show Laptop 1 immediately switching to **"Logged in elsewhere"**.
4. **Faculty → Student Loop**: Faculty publishes a problem statement → Student uploads file → Faculty downloads it and assigns a grade → Student sees the grade live.
5. **Emergency / Magic Link**: Show generating a 15-min Magic Link or triggering an Emergency Lockdown.

---

### Slide 11 — Future Scope & Conclusion
- **Future Enhancements**:
  - Supabase Storage signed URLs + PDF watermarking with viewer's email & timestamp
  - Hardware passkeys / WebAuthn for `Ultra Admin` re-authentication
  - Real-time anomaly alerts (multiple failed subject/classification attempts)
- **Closing Line**:
  > "**CampusShield**: Smart Access. Instant Control. Complete Transparency. Thank you — we're open for questions."

---

## Quick Q&A Cheat Sheet for Judges

- **Q: Why not use AI to decide document permissions?**
  > "Authorization must be deterministic and explainable. If an exam paper leaks or a student is blocked, the system must give an exact, auditable reason code (`SUBJECT_MISMATCH`, `ROLE_UNAUTHORIZED`), never a probabilistic guess."
- **Q: How does single-device login work across different laptops?**
  > "Each login generates a unique `active_session_id` stored in Supabase Postgres (`public.users`). Active clients poll that column; when a new device logs in and overwrites `active_session_id`, the previous device detects the mismatch and terminates its session."
- **Q: Can an H.O.D see or edit another department's students or documents?**
  > "No. Every H.O.D route (`/hod/users`, `/hod/department`, `/hod/documents`, `/hod/permissions`, `/hod/magic-links`, `/hod/requests`) scopes all queries, dropdowns, and actions strictly to `user.department`."
- **Q: What happens if someone tries to tamper with audit logs?**
  > "Our Postgres schema defines `CREATE RULE no_update_audit` and `CREATE RULE no_delete_audit` on `audit_logs`, making the table append-only at the database engine level."
