3rd Year 1st semester ITPM Project

# 🏆 SliitArena 360
**SLIIT Sports Management System** — Tournaments, Facilities, Equipment, Events & Sponsorships.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb) ![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat&logo=stripe)

---

## 👥 Group Members
| Name | Student ID |
|------|-----------|
| JAYASOORIYA S R | IT23849006 |
| WIJETHUNGA K S N | IT23714502 |
| YASHAWINI G D J | IT23626874 |
| KAVISHKA P V U | IT23714670 |

---

## 🚀 Quick Start

### 1. Clone & Configure
```bash
git clone https://github.com/YOUR_USERNAME/sliitarena360.git
cd sliitarena360/sliitarena
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRE=7d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16char_app_password   # Gmail App Password — NOT your normal password
STRIPE_SECRET_KEY=sk_test_your_key
```

Also replace the Stripe publishable key in `client/src/pages/sponsor/SponsorTournaments.jsx` line 10.

### 2. Backend
```bash
cd server
npm install
node seed.js      # Run ONCE to load demo data
npm run dev       # http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm start         # http://localhost:3000
```

---

## 🔐 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | sujithawijethunga06@gmail.com | admin123 |
| Coach | coach@sliit.lk | coach123 |
| Student | dharmarathnajayasooriya6@gmail.com | user123 |
| Sponsor | sponsor@sportzone.lk | sponsor123 |

**Stripe test card:** `4242 4242 4242 4242` · any future date · any CVC

---

## ✅ Features
- **Tournaments** — CRUD, team & individual registration, validations
- **Events** — Schedule and manage sports events
- **Facilities** — Book courts/fields/gyms with conflict prevention + confirmation email
- **Equipment** — Inventory management with low stock alerts
- **Sponsors** — Stripe payments + auto PDF receipt generation
- **Users** — Role management (Admin/Coach/Student/Sponsor)
- **Dashboard** — Stats, charts, and alerts per role

---

## 🏗 Tech Stack
**Frontend:** React 18, Tailwind CSS, React Hook Form, Axios, Stripe.js, jsPDF  
**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, JWT, Nodemailer, Stripe

---

## 📁 Structure
```
sliitarena/
├── client/          # React frontend (port 3000)
│   └── src/
│       ├── pages/   # Home, Dashboard, Tournaments, Events, Facilities, Equipment, Sponsor, Admin
│       ├── components/  # Navbar, Layout, Modal, Spinner
│       └── context/ # AuthContext (JWT + roles)
└── server/          # Express backend (port 5000)
    ├── models/      # User, Tournament, Event, Facility, Equipment, Sponsor, Booking...
    ├── routes/      # Auth, Tournaments, Events, Facilities, Equipment, Sponsors, Users
    └── utils/       # mailer.js (email templates)
```

---

## 🌐 Key API Routes
| Module | Base Route |
|--------|-----------|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` |
| Tournaments | `GET/POST /api/tournaments` |
| Facilities | `POST /api/facilities/:id/book` — sends confirmation email |
| Sponsors | `POST /api/sponsors/create-payment-intent` · `POST /api/sponsors/confirm-payment` |

---

## 🗂 .gitignore
```
node_modules/
.env
client/build/
.DS_Store
```

---

<div align="center">Built with ❤️ for ITPM Module · SLIIT · 2026</div>
