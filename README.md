# FinTrack – Personal Finance & Expense Management

A full-stack web app to track income, expenses and budgets, with a live dashboard, reports and CSV export.
**React (Vite) + Bootstrap + Recharts** frontend · **Django REST Framework + JWT** backend · **SQLite / PostgreSQL / MySQL** via Django ORM.

## Features
- **Auth**: register, login, logout, JWT (access + auto-refresh), hashed passwords, forgot-password flow, profile, change password
- **Dashboard**: total income / expenses / balance, monthly savings, transaction count, monthly budget; bar, line and pie charts; recent transactions; budget warnings – all computed from DB records
- **Income & Expenses**: full CRUD, categories, search, filter by category / payment method / date, sort by amount or date
- **Transactions**: unified view with ID, user, type, category, amount, description, payment method, date, created timestamp
- **Budgets**: overall + per-category monthly budgets, utilisation bars, remaining amount, warning (≥80 %) and exceeded alerts
- **Reports**: daily / weekly / monthly / yearly, category-wise spending, income vs expense, savings analysis, CSV download
- **Security**: every query is filtered by `request.user`; other users' records return 404; secrets come from `.env`
- **Demo data**: `python manage.py seed_demo` or the "Load demo data" button

## Architecture
```
React (Vite, :5173) --Axios + Bearer JWT--> Django REST API (:8000/api) --ORM--> SQLite / PostgreSQL / MySQL
```

## Folder structure
```
personal-finance-management/
├── frontend/ (src: components, pages, layouts, services, context, hooks, assets, utils, App.jsx, main.jsx)
├── backend/  (config/, users/, finance/, manage.py, requirements.txt, .env.example)
├── database/schema.sql
├── docs/FinTrack.postman_collection.json
├── screenshots/
└── README.md
```

## Database schema
| Table | Key columns |
|---|---|
| `auth_user` (Users) | id, username (unique), email, password hash |
| `users_userprofile` | user_id (1:1 FK), phone, currency, timestamps |
| `finance_category` | user_id FK, name, type (income/expense); unique (user, name, type) |
| `finance_transaction` | user_id FK, category_id FK, type, amount (>0 check), description, payment_method, date, created_at, updated_at |
| `finance_budget` | user_id FK, category_id FK (NULL = overall), month, amount; unique (user, category, month) |

Income and Expenses are rows of `finance_transaction` (`type` column) exposed through dedicated `/income/` and `/expenses/` endpoints. See `database/schema.sql`.

## API endpoints (all under `/api`, JWT required unless noted)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register/` · `/auth/login/` · `/auth/refresh/` | public |
| POST | `/auth/forgot-password/` | public (email prints to the Django console) |
| GET/PUT | `/auth/profile/` | view / update profile |
| POST | `/auth/change-password/` | change password |
| CRUD | `/categories/` | `?type=income\|expense` |
| CRUD | `/transactions/` | filters: `type, category, payment_method, date_from, date_to, search, ordering` |
| CRUD | `/income/` · `/expenses/` | same as transactions, type fixed |
| CRUD | `/budgets/` | `?month=YYYY-MM`; returns spent / remaining / percent_used / status |
| GET | `/dashboard/` | totals, monthly series, category split, recent |
| GET | `/reports/` | `?period=daily\|weekly\|monthly\|yearly&date_from&date_to` |
| GET | `/reports/export/` | CSV download |
| POST | `/demo-data/` | load sample data into an empty account |

## Setup on Windows (VS Code)
Prerequisites: Python 3.10+, Node.js 18+, Git. Open the project folder in VS Code and use two terminals.

**Backend (Terminal 1)**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo          # optional: demo user  demo / Demo@12345
python manage.py runserver          # http://127.0.0.1:8000
```
If PowerShell blocks activation: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

**Frontend (Terminal 2)**
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev                         # http://localhost:5173
```

### Using PostgreSQL / MySQL instead of SQLite
1. Create an empty database (`CREATE DATABASE finance_db;`).
2. `pip install psycopg2-binary` (PostgreSQL) or `pip install mysqlclient` (MySQL).
3. In `backend/.env` set `DB_ENGINE=postgres` (or `mysql`) and fill `DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT`.
4. Run `python manage.py migrate` again.

## Testing
```powershell
cd backend
python manage.py test
```
8 automated tests cover registration (password hashing), login/auth enforcement, income/expense add-edit-delete, validation, dashboard calculations, budget utilisation, report + CSV generation, demo data and **cross-user data isolation**.

**Postman**: import `docs/FinTrack.postman_collection.json`, run *Register* → *Login*, paste the `access` token into the collection variable `access`, then run the other requests.
Quick check with curl:
```
curl -X POST http://127.0.0.1:8000/api/auth/login/ -H "Content-Type: application/json" -d "{\"username\":\"demo\",\"password\":\"Demo@12345\"}"
```

**Manual UI checklist**: register → add income → add expense → edit → delete → create budget → check dashboard totals → open Reports → download CSV → log in as a second user and confirm you see none of the first user's data.

## Screenshots
Run the app and save screenshots of each page into `screenshots/`, then reference them here.

## Future enhancements
Pagination, recurring transactions, receipt uploads, real SMTP password reset with token links, dark mode, multi-currency, Docker + CI, PDF reports.
