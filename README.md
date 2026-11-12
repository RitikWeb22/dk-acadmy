# DK Academy — JEE & BITSAT Online Coaching Platform

> **Premier coaching institute platform for IIT-JEE (Main & Advanced) and BITSAT Mathematics & Sciences**, founded by Dharmendra Kumar (DK Sir).

---

## 🌟 Architecture Overview

This repository houses the **production backend engine and unified web deployment** for DK Academy. The application uses a single-process architecture where the high-performance Express/Node.js server handles:
1. **RESTful APIs & WebSockets** (`/api/*`, Live Classrooms, Real-time Test Session autosaves).
2. **Production Client UI Distribution** (Serving the pre-compiled, optimized React single-page application from `backend/public/`).
3. **Examination Simulation Engine** (Authentic NTA CBT Exam Simulator with Section A MCQs and Section B Numerical input with virtual on-screen keypad).

```
                      ┌─────────────────────────────────────────┐
                      │            Client Request               │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │    Express Application (Port 5000)      │
                      ├────────────────────┬────────────────────┤
                      │                    │                    │
                      ▼                    ▼                    ▼
           ┌──────────────────────┐ ┌──────────────┐ ┌──────────────────────┐
           │   /api/v1 Routes     │ │  Socket.IO   │ │ Static SPA Fallback  │
           │ (Auth, Tests, CMS,   │ │ (Live Room,  │ │  (backend/public/    │
           │  Payments, Doubts)   │ │  Autosave)   │ │   index.html & assets│
           └──────────┬───────────┘ └──────┬───────┘ └──────────────────────┘
                      │                    │
                      ▼                    ▼
           ┌───────────────────────────────────────┐
           │        MongoDB Atlas Database         │
           └───────────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

- **CBT Mock Examination Engine**:
  - Full-fidelity JEE Main & Advanced patterns with sectional timers, question status palettes, and marking schemes.
  - Section A (Single/Multi Correct MCQs) & Section B (Integer / Numerical Value Questions with on-screen virtual keypad).
  - Instant auto-evaluation, detailed analytics, percentile calculations, and step-by-step mathematical solution derivations.
- **Universal Math & Equation Parser**:
  - Word (`.docx`) and PDF question ingestion with automated OMML/MathML/LaTeX conversion.
  - Full KaTeX rendering support across questions, options, and solution derivations.
- **Courses & Live Interactive Sessions**:
  - Live classes powered by WebSockets / LiveKit.
  - Recorded video lectures with secure playback and progress tracking.
- **E-Commerce & Payments**:
  - Razorpay payment gateway integration with cryptographic webhook validation.
  - Dynamic promotional coupons and discount rules.
- **Administrative CMS & Analytics**:
  - Test Series Builder with bulk question import and AI repair capabilities.
  - DPP (Daily Practice Problems) & PYQ (Previous Year Questions) catalog management.
  - Student performance tracking, attendance logs, and fee slips.

---

## 📂 Project Structure

```
.
├── backend/
│   ├── src/                       # TypeScript Source Code
│   │   ├── config/                # Database, Cloudinary, Razorpay configurations
│   │   ├── controllers/           # API request handlers
│   │   ├── middlewares/           # Auth (JWT), Rate limiting, Multer upload
│   │   ├── models/                # Mongoose database schemas
│   │   ├── routes/                # Express API routes
│   │   ├── services/              # Business logic (Video, Math import, Payments)
│   │   ├── sockets/               # Real-time WebSocket handlers
│   │   ├── utils/                 # LaTeX validator, Equation parsers, Locks
│   │   ├── app.ts                 # Express application setup & static routing
│   │   └── server.ts              # Server bootstrap and database connection
│   ├── dist/                      # Compiled production JavaScript (tsc target)
│   ├── public/                    # Production React UI distribution
│   │   ├── assets/                # Minified JS, CSS, and font bundles
│   │   ├── images/                # Static icons, branding, and graphics
│   │   ├── videos/                # Web-optimized video assets
│   │   └── index.html             # Single Page Application entry point
│   ├── package.json               # Backend dependencies & runtime scripts
│   └── tsconfig.json              # TypeScript compiler configuration
├── server.js                      # Root entry point for Hostinger / Passenger
├── ecosystem.config.cjs           # PM2 cluster configuration for VPS
├── package.json                   # Root package configuration
└── README.md                      # Project documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` directory with the following configuration:

```env
# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://dkacademyjee.com

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dk_academy?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Media Storage (Cloudinary - Optional / Local Fallback)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Repair Service (Optional)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🛠️ Local Development & Running

### Prerequisites
- Node.js `v20.x` or `v22.x` (LTS)
- npm `v10.x` or higher
- MongoDB instance (Local or MongoDB Atlas)

### Setup & Startup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Build TypeScript Backend**:
   ```bash
   npm run build
   ```

3. **Start the Production Server**:
   ```bash
   npm start
   ```

The application will be live at `http://localhost:5000` (serving both APIs on `/api` and the full UI at `/`).

---

## 🌐 Hostinger Deployment Guide

1. **Git Integration**:
   - In Hostinger hPanel, go to **Advanced &rarr; Git**.
   - Connect repository: `https://github.com/RitikWeb22/dk-acadmy.git` (Branch: `main`).
2. **Node.js Configuration**:
   - **Node.js Version**: `20.x` or `22.x`
   - **Application Mode**: `Production`
   - **Application Root**: `public_html` (or `public_html/backend`)
   - **Application Startup File**: `server.js` (or `backend/dist/server.js`)
3. **Environment Variables**:
   - Add your `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_*` keys in the Hostinger Node.js Environment panel.
4. **Deploy**:
   - Hostinger will pull the repository and run the Node.js application directly.

---

## 📄 License & Ownership

Copyright © 2026 **DK Academy**. All Rights Reserved.  
Unauthorized copying, modification, or distribution of this software is strictly prohibited.
