# HRMS — Human Resource Management System

A production-ready, full-stack HRMS built with React 19, Node.js, Express, Prisma, and MySQL. Designed for single-service deployment on Render.

---

**NOTE:** To create a new account you need to add new employee from Super Admin or HR Manager.

## Features

### Core Modules
- **Authentication** — JWT + Refresh Tokens, bcrypt, secure cookies, email verification, password reset
- **Role-Based Access** — Super Admin, HR, Employee
- **Employee Management** — Full CRUD with profile photos via Cloudinary, document uploads, pagination, search, filters
- **Department Management** — Create, edit, delete departments with head assignment
- **Attendance Tracking** — Clock In/Out, break timer, late detection, overtime calculation, monthly reports
- **Leave Management** — Apply, approve/reject leaves, balance tracking across 7 leave types, email notifications
- **Payroll** — Auto-calculate salary, bulk generation, tax/deduction handling, mark as paid, payslip history
- **Performance Reviews** — Star ratings, feedback, strengths/improvements, promotion recommendations
- **Announcements** — Pin/unpin, mark as read, role-targeted announcements
- **Notifications** — Real-time via Socket.IO, email, in-app notifications
- **Dashboard** — Analytics charts, attendance trends, payroll graphs, department distribution
- **Reports** — Attendance, payroll, employee, leave reports with CSV export

### Technical Features
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Framer Motion, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: MySQL with soft deletes, indexes, relations, enums
- **Security**: Helmet, rate limiting, CORS, XSS protection, input sanitization
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer with templates
- **Real-time**: Socket.IO
- **Deployment**: Single Render Web Service serving both frontend and backend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | MySQL 8 |
| Auth | JWT + Refresh Tokens |
| Storage | Cloudinary |
| Email | Nodemailer |
| Real-time | Socket.IO |
| Deployment | Render (single service) |

---

## Folder Structure

```
employee-management-portal/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/               # Axios API client + services
│   │   ├── components/
│   │   │   ├── ui/            # Reusable UI components
│   │   │   └── layout/        # Sidebar, Header, AppLayout
│   │   ├── contexts/          # AuthContext, ThemeContext
│   │   ├── pages/             # All page components
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Helpers, formatters
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB, Cloudinary, JWT config
│   │   ├── middlewares/       # auth, error, activity log
│   │   ├── modules/           # Feature modules (auth, employees, etc.)
│   │   │   └── [module]/
│   │   │       ├── *.controller.ts
│   │   │       ├── *.service.ts
│   │   │       ├── *.repository.ts
│   │   │       ├── *.routes.ts
│   │   │       └── *.validation.ts
│   │   ├── routes/            # Main router
│   │   └── utils/             # JWT, email, upload, logger, response
│   ├── prisma/
│   │   ├── schema.prisma      # Full DB schema
│   │   └── seed.ts            # Seed script
│   └── package.json
├── .env.example
├── package.json               # Root with concurrently scripts
└── render.yaml
```

### Test Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@hrms.com | Password@123 |
| HR Manager | hr1@hrms.com | Password@123 |
| Employee | alex.smith@hrms.com | Password@123 |
