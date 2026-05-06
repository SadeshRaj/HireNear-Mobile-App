<div align="center">

<img src="mobile/assets/HireNear_Logo.png" alt="HireNear Logo" width="120" />

# HireNear

### *Connecting Clients with Skilled Local Workers — Instantly.*

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

</div>

---

## 📖 Overview

**HireNear** is a full-stack, location-aware freelance marketplace mobile application that bridges the gap between **clients** who need skilled work done and **workers** ready to provide those services nearby. Built with Expo (React Native), a Node.js/Express REST API, and a React-based admin dashboard, HireNear delivers a complete end-to-end hiring platform — from job posting and competitive bidding, through to invoicing, payment verification, and review management.

---

## ✨ Key Features

### 👤 Authentication & Security
- **OTP-Verified Registration** — New users receive a 4-digit OTP via SMS (powered by [Text.lk](https://app.text.lk)) before their account is activated
- **Forgot / Reset Password** — Full OTP-based password recovery flow via SMS
- **JWT Authentication** — Stateless, token-based auth with 7-day expiry; tokens stored securely via `AsyncStorage`
- **Remember Me** — Optional persistent login across app restarts
- **Account Suspension** — Admins can suspend accounts; suspended users are rejected at the middleware level on every request
- **Password Validation** — Enforced strength rules: minimum 6 characters, one uppercase letter, one special character

### 🏗️ For Clients
| Feature | Description |
|---|---|
| **Post a Job** | Create detailed job posts with title, description, category, budget, deadline, GPS location, and supporting images |
| **Browse Bids** | View, compare and filter all bids placed on your job posts |
| **Accept / Reject Bids** | Accept the best bid to automatically create a booking; reject unsuitable ones |
| **Booking Management** | Track all active and completed bookings |
| **Invoice Management** | View worker-generated invoices, upload payment slips, re-upload if rejected |
| **Leave Reviews** | Rate and review workers after job completion with star ratings, written feedback, and proof images |
| **Real-time Chat** | In-app direct messaging with hired workers via Socket.io |
| **Customer Support** | Built-in live chat with platform admins |

### 🔧 For Workers
| Feature | Description |
|---|---|
| **Browse Nearby Jobs** | GPS-powered job discovery — view open jobs within a configurable radius |
| **Submit Competitive Bids** | Place bids with custom pricing, estimated time, cover message, and attachment images |
| **Edit / Withdraw Bids** | Manage bids before they are accepted by the client |
| **Active Job Tracking** | Dedicated tab with live badge count for scheduled and in-progress jobs |
| **Invoice Generation** | Create detailed, itemised invoices for completed work; lock prices on fixed items |
| **Payment Slip Verification** | Review uploaded payment slips from clients; accept or reject with a reason |
| **Worker Portfolio** | Showcase past work with titled project entries, images, and location tagging |
| **Earnings Dashboard** | Overview of total earnings across all completed jobs |
| **Real-time Chat** | Direct messaging with clients; chat list with conversation history |
| **Customer Support** | Live admin support chat from the account settings screen |

### 🛡️ Admin Dashboard (Web)
| Tab | Functionality |
|---|---|
| **Overview** | Platform metrics (total users, active jobs, total bids), top job categories chart, recent activity feed |
| **Users & Workers** | View all users, search by name/email/role, view detailed profile modals, suspend/activate accounts, delete accounts |
| **Job Postings** | Browse all job posts with client info, category, budget, and status |
| **Placed Bids** | Inspect all bids across the platform with worker and job details |
| **Worker Portfolios** | View and moderate all worker portfolio entries with image previews |
| **Transactions** | Monitor all invoices and payment statuses |
| **Reviews** | Read all client reviews, view attached proof images, delete inappropriate reviews |
| **Support Chat** | Real-time support chat with any user; unread badge count in sidebar; auto-reply on first message |

---

## 🏛️ Architecture

```
HireNear-Mobile-App/
│
├── mobile/          # Expo (React Native) — iOS & Android App
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Client/      # 13 client-facing screens
│   │   │   └── Worker/      # 13 worker-facing screens
│   │   ├── navigation/      # Stack + Bottom Tab navigators
│   │   ├── services/        # API service helpers
│   │   ├── components/      # Reusable UI components
│   │   └── utils/           # Utility functions
│   ├── assets/              # App icon, splash screen
│   └── app.json             # Expo config (bundle ID, permissions, etc.)
│
├── server/          # Node.js + Express REST API
│   ├── index.js             # App entry point; HTTP server + Socket.io
│   └── src/
│       ├── models/          # 9 Mongoose schemas
│       ├── controllers/     # 9 controller modules
│       ├── routes/          # 10 route files
│       ├── middleware/      # JWT auth + admin guard
│       ├── config/          # DB connection + Socket handler
│       └── utils/           # Shared helpers
│
└── admin/           # Vite + React — Web Admin Dashboard
    └── src/
        ├── pages/           # AdminLogin, AdminDashboard
        ├── components/      # 10 tab/modal components
        ├── context/         # Auth context
        ├── services/        # API service layer
        └── utils/           # Config, helpers
```

---

## 🗄️ Data Models

```
User           — Clients, Workers & Admins (role-based, geo-indexed, OTP, account status)
JobPost        — Client job listings (geo-indexed, category, budget, images, status)
Bid            — Worker bids per job (price, message, estimated time, distance, attachments)
Booking        — Created on bid acceptance (links Job ↔ Bid ↔ Client ↔ Worker)
Invoice        — Worker-generated (itemised, payment slip URL, status: pending/verifying/paid/rejected)
PortfolioItem  — Worker past work (title, description, images, location)
Review         — Post-job ratings (star rating, comment, proof images)
Message        — Direct in-app chat messages between Client ↔ Worker
SupportMessage — Admin ↔ User live support chat (with auto-reply on first contact)
```

---

## 🌐 API Endpoints

| Prefix | Module | Notes |
|---|---|---|
| `/api/auth` | Authentication | Register, OTP verify, login, forgot/reset password, profile update |
| `/api/jobs` | Jobs | CRUD, nearby geo search, status management |
| `/api/bids` | Bids | Submit, edit, withdraw, accept, reject |
| `/api/bookings` | Bookings | Create, fetch by worker/client, status update |
| `/api/invoices` | Invoices | Create, view, upload payment slip, reject payment slip |
| `/api/portfolio` | Portfolios | Worker portfolio CRUD with Cloudinary image uploads |
| `/api/reviews` | Reviews | Submit, view, worker review history |
| `/api/messages` | Messages | Direct chat message history |
| `/api/support` | Support Chat | User–Admin support messages, unread counts |
| `/api/admin` | Admin | Full platform data access, user management, dashboard overview |

---

## 🔌 Real-time Features (Socket.io)

HireNear uses Socket.io for two real-time channels:

- **Direct Chat** — Clients and Workers can exchange messages instantly via a shared chat room
- **Support Chat** — Users contact admins in real-time; the admin dashboard displays live unread badge counts and receives incoming messages instantly
- **Auto-reply** — The first message a user sends to support triggers an automated welcome reply after 1.5 seconds

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | React Native 0.81.5, Expo ~54, React 19 |
| **Navigation** | React Navigation 7 (Native Stack + Bottom Tabs) |
| **Styling** | NativeWind (TailwindCSS for React Native) |
| **State / Storage** | AsyncStorage, React local state |
| **Maps & Location** | `react-native-maps`, `expo-location` |
| **Real-time** | Socket.io Client 4.8 |
| **File Handling** | `expo-image-picker`, `expo-document-picker`, `expo-file-system` |
| **PDF / Sharing** | `expo-print`, `expo-sharing` |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB (via Mongoose 9) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **File Storage** | Cloudinary (profile images, job images, portfolio images, payment slips) |
| **SMS Gateway** | Text.lk API (OTP delivery) |
| **Real-time Server** | Socket.io 4.8 |
| **Admin Dashboard** | React 19, Vite 8, TailwindCSS |
| **Admin Charts** | Recharts |
| **Admin Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** or **yarn**
- **Expo CLI** — `npm install -g expo-cli`
- **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Cloudinary** account (free tier is sufficient)
- **Text.lk** account for SMS OTP (optional in dev mode — the server auto-verifies users if SMS keys are absent)

---

### 1. Clone the Repository

```bash
git clone https://github.com/SadeshRaj/HireNear-Mobile-App.git
cd HireNear-Mobile-App
```

---

### 2. Backend Setup (`/server`)

```bash
cd server
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Fill in your values in `.env`:

```env
PORT=4000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hirenear
JWT_SECRET=your_super_secret_jwt_key

# SMS OTP Gateway (Text.lk) — leave blank for dev-mode auto-verification
TEXTLK_API_TOKEN=your_textlk_token
TEXTLK_SENDER_ID=HireNear

# Your local network IP (for mobile device to reach the server)
LOCAL_IP=192.168.1.xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the development server:

```bash
npm run dev
```

The server will print your local network IP on startup:
```
Server running on port 4000
Local Network URL: http://192.168.x.xxx:4000
```

---

### 3. Mobile App Setup (`/mobile`)

```bash
cd ../mobile
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Set your API URL to the server's local network address:

```env
# Use your actual local IP from the server startup log above
EXPO_PUBLIC_API_URL=http://192.168.x.xxx:4000/api
```

> **Android Emulator?** Use `http://10.0.2.2:4000/api` instead (the default fallback in `config.js`)

Start the Expo development server:

```bash
npm start
# Then scan the QR code with Expo Go (iOS/Android) or press 'a' for Android emulator
```

---

### 4. Admin Dashboard Setup (`/admin`)

```bash
cd ../admin
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://192.168.x.xxx:4000/api
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Log in with your Admin user credentials (create an Admin user in MongoDB directly or via a seed script).

---

## 📱 App Screens

### Client Flow
```
Login / Register (OTP) → Client Dashboard (Home)
  ├── Browse Worker Profiles & Map
  ├── Create Job Post (title, budget, location, images)
  ├── My Job Posts → View Bids → Accept Bid → Booking Created
  ├── Booking Details → View Invoice → Upload Payment Slip
  ├── Invoice Details (verifying / paid / rejected) → Re-upload if rejected
  ├── Add Review (after job completion)
  └── Messages (Chat List → Chat Screen)
       └── Support Chat (Admin)
```

### Worker Flow
```
Login / Register (OTP) → Worker Dashboard
  ├── Browse Jobs Tab (nearby GPS or all open jobs, filters)
  │     └── Job Detail → Submit Bid (price, message, time, attachments)
  ├── My Bids Tab (pending / accepted / rejected / withdrawn)
  │     └── Edit Bid / Withdraw Bid
  ├── Active Jobs Tab (badge count) → Worker Booking Details
  │     └── Create Invoice → Generate & Share Invoice PDF
  ├── Messages Tab (Chat List → Chat Screen)
  │     └── Support Chat (Admin)
  ├── Earnings Tab (total earnings summary)
  └── Worker Portfolio (add / edit / delete project entries with images)
```

---

## 🔒 Security Notes

- All protected routes require a valid **Bearer JWT** in the `Authorization` header
- Suspended accounts are blocked at the **middleware level** — every API request is rejected with HTTP 403
- Passwords are hashed with **bcryptjs** (salt rounds: 10) — plain-text passwords are never stored
- OTPs expire automatically after **5 minutes** (via MongoDB TTL index on `expireAt`)
- Password reset OTPs expire after **10 minutes**
- The admin dashboard uses a separate token (`adminToken`) stored in `localStorage`

---

## 📸 Image Storage

All user-uploaded images are stored in **Cloudinary**, organised into folders:

| Folder | Contents |
|---|---|
| `profile_images/` | User profile photos |
| `job_images/` | Client job post images |
| `portfolio/` | Worker portfolio project images |
| `payment_slips/` | Client payment proof uploads |

---

## 📋 Job Categories

HireNear supports the following job categories out of the box:

`Plumbing` · `Electrical` · `Cleaning` · `Repairs` · `Carpentry` · `Painting` · `Landscaping` · `Other`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **SadeshRaj**

*HireNear — Hire smart. Hire near.*

</div>