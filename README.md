# HRMS — Human Resource Management System

A production-ready, full-stack HRMS built with React 19, Node.js, Express, Prisma, and MySQL. Designed for single-service deployment on Render.

---

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
├── Dockerfile
├── docker-compose.yml
└── render.yaml
```

---

## API Documentation

All APIs are prefixed with `/api`.

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/register` | Register employee | Admin/HR |
| POST | `/api/auth/refresh` | Refresh tokens | Public |
| POST | `/api/auth/logout` | Logout | Auth |
| POST | `/api/auth/forgot-password` | Send reset link | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |
| PUT | `/api/auth/change-password` | Change password | Auth |
| GET | `/api/auth/me` | Get current user | Auth |

### Employees
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/employees?search=&status=&page=&limit=` | All |
| GET | `/api/employees/me` | Auth |
| GET | `/api/employees/:id` | Auth |
| PUT | `/api/employees/:id` | Auth |
| POST | `/api/employees/:id/photo` | Auth |
| POST | `/api/employees/:id/documents` | Admin/HR |
| DELETE | `/api/employees/:id` | Admin |

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Database Schema

Key models: `User`, `Employee`, `Department`, `Attendance`, `LeaveRequest`, `LeaveBalance`, `Payroll`, `PerformanceReview`, `Announcement`, `Notification`, `Document`, `ActivityLog`, `RefreshToken`

---

## Installation & Local Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd employee-management-portal

# 2. Install all dependencies
npm run install-all

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env with your MySQL, Cloudinary, and email credentials

# 4. Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# 5. Seed the database
npm run prisma:seed

# 6. Start development servers
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000  
API: http://localhost:5000/api

### Test Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@hrms.com | Password@123 |
| HR Manager | hr1@hrms.com | Password@123 |
| Employee | alex.smith@hrms.com | Password@123 |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | ✅ |
| `JWT_SECRET` | JWT access token secret (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Optional |
| `SMTP_HOST` | SMTP host (e.g. smtp.gmail.com) | Optional |
| `SMTP_USER` | SMTP username/email | Optional |
| `SMTP_PASS` | SMTP password/app password | Optional |
| `EMAIL_FROM` | Sender email address | Optional |
| `FRONTEND_URL` | Frontend URL for reset links | Optional |
| `PORT` | Server port (default: 5000) | Optional |
| `NODE_ENV` | `development` or `production` | Optional |

---

## Deployment on Render

### One-Click Deployment
1. Push to GitHub
2. Connect your repo on [render.com](https://render.com)
3. Select "New Web Service"
4. Set build command: `npm run install-all && npm run build`
5. Set start command: `npm run start`
6. Add all environment variables from `.env.example`
7. Deploy!

Alternatively, use the included `render.yaml` for blueprint deployment.

### Notes
- The Express server serves the React build from `/client/dist` in production
- All API routes are under `/api/*`
- Client-side routing is supported (catch-all serves `index.html`)
- Health check available at `/health`

---

## Docker

```bash
# Start with Docker Compose (includes MySQL)
docker-compose up -d

# The app will be available at http://localhost:5000
```

---

## Future Improvements

- [ ] Export payslips as PDF (using puppeteer or react-pdf)
- [ ] Calendar view for attendance and leaves
- [ ] OKR / goal tracking in performance module
- [ ] Multi-tenant support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics with drill-down charts
- [ ] Bulk employee import via CSV
- [ ] Shift management
- [ ] Interview & recruitment module
- [ ] Asset management

---

## Screenshots

> _Add screenshots of dashboard, employee list, attendance tracker, payroll, etc._

---

## License

MIT
