# BRT Dost — Check Before You Leave
> **Real-Time Transit Verification, Crowdsourced Intelligence & Moderation Platform for Peshawar BRT (Zu Peshawar)**

BRT Dost is a production-ready, full-stack civic transit platform built for daily commuters of the **Peshawar Bus Rapid Transit (Zu Peshawar)** system in Khyber Pakhtunkhwa, Pakistan. It directly tackles the epidemic of transit misinformation by introducing a formal **Trust & Freshness Engine** that enforces one foundational rule:

> **Never present unverified passenger reports, expired advisories, or unconfirmed assumptions as live facts.**

---

## 🚏 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Key Features & System Capabilities](#-key-features--system-capabilities)
3. [The Trust & Freshness Engine (6 Information States)](#-the-trust--freshness-engine-6-information-states)
4. [Technology Stack](#-technology-stack)
5. [Directory & Project Architecture](#-directory--project-architecture)
6. [Local Installation & Setup Guide](#-local-installation--setup-guide)
7. [Environment Variables Reference](#-environment-variables-reference)
8. [Administrator Access & Evaluator Credentials](#-administrator-access--evaluator-credentials)
9. [REST API Documentation](#-rest-api-documentation)
10. [Automated Testing & Security Verification](#-automated-testing--security-verification)
11. [Production Deployment Guide (Vercel + Render + Atlas)](#-production-deployment-guide-vercel--render--atlas)
12. [Practical Demonstration Checklist](#-practical-demonstration-checklist)
13. [Known Limitations & Future Roadmap](#-known-limitations--future-roadmap)

---

## 🚌 Executive Summary & Problem Statement

Commuters using the 27 km Peshawar BRT network (spanning Chamkani to Karkhano Market with 5 corridor lines and 30+ stations) face frequent operational uncertainty:
- **Unofficial WhatsApp / Social Rumors:** False reports of route blockages or vehicle breakdowns spread rapidly without verification.
- **Outdated Notices:** A mechanical delay posted at 8:00 AM continues to mislead riders at 2:00 PM because standard apps fail to expire or refresh announcements.
- **Unchecked Assumptions:** Digital schedules assume all buses run on time unless manually flagged otherwise, leading commuters to false expectations of "Normal Service".

**BRT Dost solves this through:**
1. **Separation of Concerns:** Unverified commuter feedback is strictly isolated from authorized control-room bulletins.
2. **Temporal Decay (Freshness Window):** Verified notices automatically degrade to *Stale* after their validity window (default: 4 hours) unless re-confirmed by dispatchers.
3. **Honest Null Principle:** Routes without fresh positive confirmations default to *Unknown* instead of falsely claiming "Operational".
4. **Contradiction Detection:** Opposing reports at the same station or contradictory to active operational bulletins are flagged as *Conflicted* for staff investigation.

---

## 🌟 Key Features & System Capabilities

### Commuter Portal (Public Website)
- **Route & Station Live Search:** Instant, keyboard-navigable lookup across all 5 corridors (`ML-01`, `ER-01`, `FR-01`, `FR-02`, `FR-03`) and 19 transit stations with clear empty-state handling.
- **Dual Information Streams:** Visually segregated feeds keeping verified official bulletins separated from crowdsourced passenger reports.
- **Passenger Issue Reporting:** Mobile-friendly form to log delays, AC failures, ticketing errors, and safety issues with client- and server-side validation.
- **Verification Notice:** Explicit disclaimers inform commuters that report submission does not constitute verification.
- **Data Privacy Protection:** Personal contact numbers are strictly confidential, visible only to authorized transit administrators, and stripped from all public API endpoints.

### Administration & Operations Desk (Protected Dashboard)
- **Real-Time Operational Metrics:** Dynamic counts for Pending Reports, Conflict Flags, Verified Reports, Active Alerts, Stale Bulletins, and Monitored Corridors.
- **Report Moderation Desk:** Filter reports by status (`pending`, `under review`, `conflict_flagged`, `verified`, `rejected`), inspect full submission history, mark under review, or reject invalid submissions.
- **Verify & Promote Workflow:** Promote verified commuter reports into official public advisories with custom headlines, severity levels, and freshness windows.
- **Advisory Management Desk:** Create, edit, reconfirm, and withdraw public service alerts.
- **Historical vs Live Record Separation:** Distinguishes active advisories from expired or withdrawn historical records.

---

## 🛡️ The Trust & Freshness Engine (6 Information States)

The engine calculates information validity dynamically at query time from UTC timestamps without requiring external cron workers:

| State | Scope | UI Badge Label | Definition | Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| **`VERIFIED`** | Alerts, Reports | `Verified update` / `Confirmed operational` | Reviewed and confirmed by an authorized transit administrator. | Stores `verifiedBy` admin ID and UTC `lastConfirmedAt`. |
| **`UNVERIFIED`** | Reports | `Passenger report — not verified` | Commuter submission awaiting staff moderation. | Segregated from official feed; never displayed as confirmed facts. |
| **`STALE`** | Alerts, Routes | `Information may be outdated` | Previously confirmed update older than freshness window (> 4 hrs). | Warns riders conditions may have changed; requests staff reconfirmation. |
| **`UNKNOWN`** | Routes, Network | `No confirmed current information` | No positive confirmation received in the current freshness window. | **Honest Null**: Refuses to assume "Normal" without active data. |
| **`EXPIRED`** | Alerts | `Alert expired` | Alert has passed scheduled expiry timestamp (`expiresAt <= NOW`). | Query-time auto-expiry (`maybeAutoExpire()`); archived from active bulletins. |
| **`WITHDRAWN`** | Alerts | `Alert withdrawn` | Transit desk formally revoked the notice after issue resolved. | Preserved with audit log (`withdrawnAt`, `updatedBy`) for accountability. |

---

## 💻 Technology Stack

- **Frontend:** React 18, Vite v6.4, Tailwind CSS, Lucide Icons, React Router v6, Axios
- **Backend:** Node.js (v18+), Express.js, Helmet, CORS, Morgan, express-rate-limit, express-validator
- **Database:** MongoDB via Mongoose (with zero-configuration In-Memory MongoDB via `mongodb-memory-server` for instant evaluation)
- **Authentication:** JSON Web Tokens (JWT) in HttpOnly secure cookies + Bearer token support, bcryptjs password hashing
- **Testing:** Native Node.js test runner (`node:test`, `node:assert`) with **108 automated test cases**

---

## 📂 Directory & Project Architecture

```
BRT/
├── client/                      # React 18 Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI (RouteStationSearch, AlertCard, TrustBadge, Modal, etc.)
│   │   ├── context/             # AuthContext (JWT session state & auto-restoration)
│   │   ├── pages/               # Home, StatusPage, RoutesPage, ReportPage, AboutPage, AdminDashboard, LoginPage
│   │   ├── services/            # api.js (Centralized Axios client)
│   │   ├── index.css            # Tailwind CSS & design tokens
│   │   └── main.jsx
│   ├── vercel.json              # Vercel SPA routing rewrite rules
│   ├── vite.config.js           # Dev server config (port 5173, /api proxy to 5000)
│   └── package.json
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # db.js (Atlas + In-Memory fallback), trustConfig.js
│   │   ├── controllers/         # alertController, reportController, routeController, adminController, authController
│   │   ├── middleware/          # auth.js, validators.js, errorHandler.js
│   │   ├── models/              # Alert.js, Report.js, Route.js, Station.js, User.js
│   │   ├── routes/              # Express routers (authRoutes, alertRoutes, reportRoutes, routeRoutes, adminRoutes)
│   │   ├── services/            # trustEngine.js (Core verification algorithm)
│   │   ├── utils/               # seed.js (Peshawar BRT transit data seeder)
│   │   └── server.js            # Server entrypoint (port 5000)
│   ├── tests/
│   │   ├── trustEngine.test.js  # 94 Trust & Freshness test cases
│   │   └── securityAndAuth.test.js # 14 Security, Auth & RBAC test cases
│   └── package.json
├── render.yaml                  # Render web service deployment configuration
├── package.json                 # Monorepo root workspace scripts
├── .env.example                 # Root environment template
└── README.md                    # System documentation
```

---

## 🚀 Local Installation & Setup Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- *Optional:* MongoDB instance (if omitted, the system automatically uses an in-memory database with zero installation required).

---

### Step 1: Install Dependencies
Run from the root directory:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

---

### Step 2: Start the Backend Server
The backend automatically connects to MongoDB (or launches In-Memory MongoDB) and seeds 19 Peshawar BRT stations, 5 transit corridors, seed service alerts, and the default admin account:

```bash
cd server
npm start
```
*Backend runs on:* **`http://localhost:5000`**

To verify backend health:
```bash
curl http://localhost:5000/api/health
```

---

### Step 3: Start the Frontend Client
In a separate terminal:

```bash
cd client
npm run dev
```
*Frontend runs on:* **`http://localhost:5173`** (proxies `/api` to port 5000).

---

### Step 4: Workspace Root Commands
You can also run all tasks from the root folder:

| Command | Action |
| :--- | :--- |
| `npm run start:server` | Start backend server daemon |
| `npm run dev:client` | Launch Vite frontend in development mode |
| `npm run test:server` | Run all 108 backend tests |
| `npm run build:client` | Compile production bundle for the client |
| `npm run seed` | Re-seed transit corridors and station data |

---

## 🔐 Administrator Access & Evaluator Credentials

The system comes pre-configured with transit administration access for bootcamp evaluators:

| Portal | URL | Username | Password |
| :--- | :--- | :--- | :--- |
| **Admin Login** | `http://localhost:5173/login` | `admin` | `AdminBRT2026!` |
| **Admin Dashboard** | `http://localhost:5173/admin` | *(Requires active JWT session)* | — |

*The login page includes a one-click **"Autofill Credentials"** button for instant assessment.*

---

## 📡 REST API Documentation

### Public Endpoints
- `GET /api/health` — System health and timestamp
- `GET /api/routes` — Corridors list with dynamic Trust Engine evaluations
- `GET /api/routes/:code` — Route corridor details and station stops
- `GET /api/stations` — All 19 stations, connected routes, and facility tags
- `GET /api/alerts` — Active public alerts (with dynamic freshness calculation)
- `GET /api/reports` — Crowdsourced passenger reports (unverified stream, private contact stripped)
- `POST /api/reports` — Submit new commuter report (rate-limited, sanitized, duplicate protected)

### Authentication & Admin Endpoints
- `POST /api/auth/login` — Administrator authentication, rate-limited, sets HttpOnly cookie & returns JWT
- `POST /api/auth/logout` — Revokes session cookie
- `GET /api/auth/me` — Verify authenticated admin session
- `GET /api/admin/stats` — Metrics breakdown (reports, active alerts, stale alerts, pending queue)
- `GET /api/admin/reports` — Moderation queue (supports `?status=pending|under review|conflict_flagged|verified|rejected`)
- `PATCH /api/admin/reports/:id/review` — Review report, update status and internal moderation note
- `POST /api/admin/reports/:id/promote` — Promote passenger report into an official public bulletin
- `GET /api/admin/alerts` — All alerts (supports `?status=all|active|stale|expired|withdrawn|draft`)
- `POST /api/admin/alerts` — Publish new service advisory
- `PATCH /api/admin/alerts/:id` — Edit existing advisory
- `POST /api/admin/alerts/:id/reconfirm` — Reconfirm alert timestamp to reset freshness window
- `POST /api/admin/alerts/:id/withdraw` — Withdraw alert with audit timestamp

---

## 🧪 Automated Testing & Security Verification

### Backend Test Suite (108/108 Passing)
Run the test suite with:
```bash
cd server
npm test
```

### Breakdown of Test Suites
1. **Trust & Freshness Engine (`trustEngine.test.js` — 94 Tests):**
   - Verified alert within freshness window returns `VERIFIED` and `isFresh=true`.
   - Staleness calculation: alerts older than freshness window (>4h) transition to `STALE`.
   - Unverified commuter submissions strictly flagged as `UNVERIFIED`.
   - Query-time auto-expiry (`EXPIRED`).
   - Admin withdrawal audit preservation (`WITHDRAWN`).
   - Contradiction & conflict detection for conflicting station reports.
   - Fault-tolerant null safety (invalid date strings, null payloads).
   - Honest Null principle: unconfirmed routes return `UNKNOWN`.
2. **Security, Auth & RBAC (`securityAndAuth.test.js` — 14 Tests):**
   - Logged-out access to protected `/api/admin/*` is blocked (401).
   - Forged or expired JWTs are rejected (401).
   - Deactivated users cannot access admin actions (403).
   - Login credential failure returns safe generic message (no user enumeration).
   - Password hashes are strictly stripped from all API outputs.
   - Session restoration via `/api/auth/me`.
   - Private passenger contact numbers are stripped from public endpoints (`/api/reports`) and preserved only for authorized admins (`/api/admin/reports`).
   - Input validation rejects invalid statuses (400) and missing titles (400).
   - Promoting a report links origin report ID and updates moderation status.

---

## 🌐 Production Deployment Guide (Vercel + Render + Atlas)

### 1. Database Setup: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (`0.0.0.0/0`).
3. Obtain your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/brtdost?retryWrites=true&w=majority`.

### 2. Backend Deployment: Render
1. Connect your Git repository to [Render](https://render.com).
2. Create a new **Web Service** using `render.yaml` or manual setup:
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Health Check Path:** `/api/health`
3. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<A strong random 64-char string>`
   - `FRONTEND_URL`: `https://your-brt-dost.vercel.app`

### 3. Frontend Deployment: Vercel
1. Import your Git repository to [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable in Vercel:
   - `VITE_API_BASE_URL`: `https://your-brt-api.onrender.com/api`
4. The included `client/vercel.json` ensures all client-side routes (`/status`, `/report`, `/admin`) resolve to `index.html`.

---

## 📋 Practical Demonstration Checklist

Follow this 7-step checklist for evaluator walkthroughs:

1. **Search Route/Station:** Open `http://localhost:5173/`, type `ML-01` in the hero search box. Observe instant corridor suggestions and click to navigate.
2. **Examine Trust States:** On the Status page (`/status`), observe verified notices, stale warnings, and the Freshness Engine Diagnostic card for ML-01.
3. **Submit Passenger Report:** Navigate to `/report`, select `ER-01`, station `Saddar Cantt`, category `Overcrowding`, and submit. Verify the confirmation screen highlights that the report is **Unverified** until reviewed.
4. **Log in as Admin:** Go to `/login`, click "Autofill Credentials", and log in. You are redirected to `/admin`.
5. **Moderate & Promote Report:** In the Moderation Queue, find the submitted report. Click "Verify & Promote", select Warning severity, and publish.
6. **Verify Public Reflection:** Return to `/status`. The newly promoted bulletin appears immediately in the Active Announcements feed with `Verified update` badge and source attribution.
7. **Withdraw Advisory:** Return to `/admin`, switch to "Service Announcements Desk", and click "Withdraw" on the advisory. Confirm in the dialog. The alert is instantly removed from active announcements and archived.

---

## 🔮 Known Limitations & Future Roadmap

- **GTFS Realtime Integration:** The current MVP calculates status from verified administrative notices and crowdsourced feeds. Future phases can ingest real-time TransPeshawar automated vehicle location (AVL) telemetry feeds.
- **Urdu Localization (Full):** Station names include Urdu script; a full RTL Urdu localization toggle (`ur-PK`) is planned for post-MVP.
- **SMS / USSD Reporting:** For commuters without smartphone data packages, an SMS gateway will allow submitting reports via standard cellular text.

---

## 👥 Contributors & Civic Technology Mission

Developed for the commuters of **Peshawar, Khyber Pakhtunkhwa** to bring truth, speed, and transparency to public transit navigation.
