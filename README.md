# LA Consolacion Jewelry

An online jewelry shop with a customer side (shop, cart, checkout, custom orders, profile)
and an admin side (orders, walk-in sales, inventory, users, logs).

| Part | Folder | Built with | Runs on |
|---|---|---|---|
| Website | `frontend/` | React 19, Vite, Tailwind CSS | http://localhost:5173 |
| API | `backend/` | PHP 8 (JSON endpoints), MySQL/MariaDB | http://localhost:8000 |
| Email sender | `mailer/` | Node.js, Express, Nodemailer (Gmail) | http://localhost:3000 |
| Database | `database/lcj.sql` | Tables + the first SuperAdmin account | XAMPP MySQL |

## What you need

- **XAMPP** (for MySQL and PHP 8)
- **Node.js 22** or newer
- A **Gmail account with an App Password**, only for sending emails

## Setup (first time)

### 1. Database
1. Start **MySQL** in the XAMPP Control Panel and open **phpMyAdmin**.
2. Create a database named **`lcj`** (collation `utf8mb4_general_ci`).
3. Select it, open **Import**, choose `database/lcj.sql`, and click **Import**.

This creates the tables and one SuperAdmin account:
**`superadmin@lcj.local` / `Admin@1234`**.

To secure it: log in, open **Users**, edit this account and set your real email, then log out and use
**Forgot Password** on the login page to choose a new password (the mailer must be running).

The database login is in `backend/config/db.php` (XAMPP default: user `root`, no password).

### 2. Mailer
```bash
cd mailer
npm install
```
Copy `mailer/.env.example` to `mailer/.env` and fill in your Gmail address and App Password.
Never commit `.env`.

### 3. Website
```bash
cd frontend
npm install
```

## Running it (every time)

Open three terminals in the project folder, and keep XAMPP **MySQL** running:

```bash
# 1. API (use XAMPP's PHP, e.g. C:\xampp\php\php.exe on Windows)
php -S localhost:8000 -t backend

# 2. Website
cd frontend
npm run dev

# 3. Mailer (only needed for emails)
cd mailer
npm start
```

Then open **http://localhost:5173**. While developing, Vite forwards `/api` and `/uploads` to the PHP server, so both work from port 5173.

## Settings

`backend/config/app.php`:

| Setting | What it is |
|---|---|
| `frontend_url` | Address of the website, used in email links (verify, reset password, custom order payment) |
| `mailer_url` | Address of the mailer |
| `admin_email` | Gets a copy of every new custom order, and is the shop contact in "ready for pickup" emails |

## Roles

| Role | Can do |
|---|---|
| Customer | Shop, cart, checkout, custom order payment, profile and order history |
| Admin (level 1) | Admin pages, order status changes, walk-in sales, edit custom orders, change product **stock** |
| SuperAdmin (level 2) | Everything an Admin can, plus add/edit/delete products, delete orders, edit roles and delete users |

The server checks the role on every request, so a demoted admin loses access right away.

## Project structure

```
backend/
  api/        JSON endpoints, grouped by area (admin, auth, cart, orders, products, users)
  config/     db.php (database) and app.php (addresses, admin email)
  helpers/    shared PHP: json responses, admin check, mailer, uploads, form checks
  uploads/    pictures: products/, custom/, payments/, profile/
database/
  lcj.sql     database structure + first SuperAdmin
frontend/
  public/     static images (logo, banners, e-wallet logos)
  src/
    pages/       public/, customer/, admin/
    components/  pieces used by the pages (admin/, shop/, cart/, payment/, ...)
    context/     logged-in user and cart (AuthContext, CartContext)
    services/    functions that call the API
    styles/      page CSS
mailer/
  server.js   sends emails through Gmail
```

Pictures uploaded through the site are saved in `backend/uploads/` and are not tracked by git
(see `.gitignore`), except the product pictures that were already in the repository.

## Git workflow

`feature/*` → **develop** (Pull Request) → **release/x.y.z** → **main** (tagged `vx.y.z`)
