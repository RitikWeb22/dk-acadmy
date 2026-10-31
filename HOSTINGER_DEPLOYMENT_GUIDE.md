# DK Academy — Complete Hostinger Step-by-Step Deployment Guide

This guide walks you through taking the **DK Academy JEE & BITSAT Coaching Portal** live on Hostinger using the **Unified Full-Stack Deployment Architecture** (Express serves both APIs and the React frontend from `backend/public`).

---

## 🌟 Why This Unified Architecture Is the Best Choice for Hostinger
1. **Single Node.js Process**: Only 1 server process runs (`node dist/server.js`), using less RAM and CPU.
2. **Zero CORS Issues**: The React frontend and Express backend run on the exact same domain and port (`https://yourdomain.com`), eliminating cross-origin errors.
3. **Single Git Deployment**: You only need to deploy one repository — Hostinger runs the backend, and the frontend is rendered automatically at the root URL `/` and all sub-routes (`/courses`, `/login`, `/dashboard`, `/admin`).

---

## 📋 Pre-Flight Checklist
Before you begin in your Hostinger dashboard:
- [x] Code committed and ready to push to GitHub: `https://github.com/RitikWeb22/dk-acadmy.git`
- [x] Frontend compiled into `backend/public/` (handled automatically by `npm run build`)
- [ ] MongoDB Atlas connection string ready (`MONGO_URI`)
- [ ] Razorpay API Key ID, Key Secret, and Webhook Secret ready
- [ ] Domain name chosen in Hostinger (e.g., `dkacademy.in` or a free Hostinger subdomain)

---

## 🚀 Step-by-Step Deployment on Hostinger

### STEP 1: Select Your Domain in Hostinger
1. In your **Hostinger hPanel**, go to **Websites** &rarr; **Add Website** (or complete the onboarding flow).
2. Choose **Use an Existing Domain** or select the domain you purchased with your unlimited plan.
3. Finish the domain setup. Ensure DNS points to Hostinger (default Hostinger nameservers).

---

### STEP 2: Configure Git Deployment in Hostinger
1. In **hPanel**, go to your website dashboard and search for **Git** (under the **Advanced** section).
2. Fill in the deployment details:
   - **Repository**: `https://github.com/RitikWeb22/dk-acadmy.git`
   - **Branch**: `main`
   - **Install in directory**: Leave empty or enter `public_html`
3. Click **Create**. Hostinger will pull the latest code from GitHub.
4. *(Optional & Recommended)*: Copy the **Webhook URL** provided by Hostinger and paste it into GitHub (**Repository Settings** &rarr; **Webhooks**). Every time you run `git push`, Hostinger will automatically pull the newest code!

---

### STEP 3: Setup Node.js in Hostinger
1. In **hPanel**, navigate to **Node.js** (under the **Advanced** or **Hosting** menu).
2. Click **Create Application** (or configure existing):
   - **Node.js Version**: Select **`20.x`** or **`22.x`** (LTS).
   - **Application Mode**: **`Production`**
   - **Application Root**: 
     - If you deploy the entire repo: `/home/uXXXXX/public_html` (or `/home/uXXXXX/public_html/backend` if isolating backend).
   - **Application Startup File**: 
     - If root: `backend/dist/server.js`
     - If Application Root is set to `backend`: `dist/server.js`
   - **Application URL**: Select your domain (e.g. `https://yourdomain.com`).

---

### STEP 4: Add Environment Variables in Hostinger
In the Hostinger **Node.js Environment Variables** panel (or create a `.env` file inside the `backend` folder via Hostinger File Manager), configure the following values:

```env
# Application Environment
NODE_ENV=production
PORT=3000

# MongoDB Database Connection
MONGO_URI=mongodb+srv://<db_user>:<db_password>@cluster0.xxxxx.mongodb.net/dk_academy?retryWrites=true&w=majority

# JWT Authentication Secret (Generate a 64+ char random hex string)
JWT_SECRET=c8e7f1a9b2d3c4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b

# Razorpay Production or Test Credentials
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Domain Configuration (Use your actual live domain)
CLIENT_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

> **Security Note**: Never commit `.env` into GitHub. Always set these variables inside Hostinger's secure environment settings or in a server-side `.env` file.

---

### STEP 5: Build and Install Dependencies
You can trigger the build using Hostinger's **Web Terminal / SSH** (or Node.js dashboard "Run NPM Install" button):

1. Open **SSH / Terminal** in Hostinger hPanel.
2. Navigate to your project directory:
   ```bash
   cd ~/public_html
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install --omit=dev
   npm run build
   ```
4. If you ever update the frontend, run the unified build from the root folder:
   ```bash
   npm run build
   ```
   *This automatically builds the React frontend with Vite, copies all assets into `backend/public/`, and compiles TypeScript.*

---

### STEP 6: Start the Application & Enable SSL
1. Go back to **hPanel &rarr; Node.js Manager**.
2. Click **Start** (or **Restart**).
3. The status indicator will turn **Green (Running)**.
4. Go to **Security &rarr; SSL** in hPanel:
   - Click **Install SSL** (Free Let's Encrypt certificate).
   - Turn ON **Force HTTPS**.

---

### STEP 7: Verify Everything Is Live!
1. Open your browser and visit: `https://yourdomain.com`
   - You should see the **DK Academy JEE Homepage** loaded instantly.
2. Check backend health probe:
   - Visit: `https://yourdomain.com/api/v1/health`
   - Response: `{"status":"healthy","timestamp":"..."}`
3. Test key user workflows:
   - Browse courses (`/courses`)
   - Test login / register (`/login`, `/signup`)
   - Admin panel (`/admin/login`)
   - Live Socket.IO connection and payment checkout

---

## 🛠 Troubleshooting & Quick Fixes

| Problem | Cause | Solution |
|---|---|---|
| **503 Service Unavailable** | Node.js process failed to start or crashed on boot | Check Node.js log in Hostinger: usually caused by a missing required variable in `.env` (e.g. `JWT_SECRET` or `MONGO_URI`). |
| **Blank White Screen on `/courses` or `/dashboard`** | Static index.html fallback missing | Ensure `backend/public/index.html` exists. Run `npm run build` so Vite dist is synced to `backend/public`. |
| **Razorpay Payment Fails Signature Check** | Mismatched secret or currency | Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` match the Razorpay dashboard mode (Test or Live). |
| **MongoDB Network Timeout** | Atlas IP Allowlist blocking Hostinger | In MongoDB Atlas &rarr; Network Access, add Hostinger's server IP (or temporarily `0.0.0.0/0` during initial testing). |

---

## 📦 Local One-Command Build Script Reference

To build both frontend and backend locally before pushing:
```bash
# From repository root:
npm run build

# Push to GitHub:
git add .
git commit -m "feat: sync frontend dist and backend for Hostinger live deployment"
git push origin main
```
Hostinger Git integration will pull the commit, restart Node.js, and your website will be live in seconds!
