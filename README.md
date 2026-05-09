# TaskFlow — Team Task Manager

A full-stack web app for managing projects and tasks with role-based access control.

## 🔗 Live URL
team-task-manager-production-bed9.up.railway.app

## 🚀 Features
- Authentication (Signup/Login) with JWT
- Role-based access (Admin/Member)
- Project creation and team management
- Task creation, assignment and status tracking
- Dashboard with task stats and overdue indicators

## ⚙️ Tech Stack
- **Frontend:** React, Vite, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT + Bcrypt
- **Deployment:** Railway

## 💻 Local Setup
1. Clone the repo:
   git clone https://github.com/sayedshaizan4/teamtm.git
   cd teamtm

2. Start backend:
   cd backend
   npm install
   node server.js

3. Start frontend:
   cd frontend
   npm install
   npm run dev

4. Open http://localhost:5173

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create project (Admin) |
| POST | /api/projects/:id/members | Add member (Admin) |
| GET | /api/tasks/project/:id | Get project tasks |
| POST | /api/tasks | Create task (Admin) |
| PUT | /api/tasks/:id/status | Update task status |
| GET | /api/dashboard | Get dashboard stats |
