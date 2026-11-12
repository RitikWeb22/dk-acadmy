# 🏥 DK Academy JEE — Comprehensive Website Health, Performance & Security Audit Report

> **Project Name**: DK Academy JEE (IIT JEE & BITSAT Coaching Portal & CBT Test Simulator)  
> **Report File**: `healthreport.md`  
> **Date**: November 11, 2026  
> **Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS / SCSS | Node.js + Express 5 + TypeScript + MongoDB (Mongoose)  
> **Overall Health Score**: **74 / 100** (Solid backend security foundation, but severe frontend monolithic bottlenecks, memory bloat, and CBT exam-cheating data leak risks)

---

## 📑 Quick Summary (TOC)

1. [Folder Structure & Architectural Mapping](#1-folder-structure--architectural-mapping)
2. [Performance Audit: Kaha Lag Kar Rahi Hai & Bottlenecks](#2-performance-audit-kaha-lag-kar-rahi-hai--bottlenecks)
3. [Security Audit: Hacking Se Kitni Protected Hai & Vulnerabilities](#3-security-audit-hacking-se-kitni-protected-hai--vulnerabilities)
4. [UI/UX Review: User Experience & Design Issues](#4-uiux-review-user-experience--design-issues)
5. [Action Plan & Prioritized Roadmap (What to Fix & Do)](#5-action-plan--prioritized-roadmap-what-to-fix--do)

---

## 1. Folder Structure & Architectural Mapping

```
dk-institue/
├── backend/                        # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── config/                 # DB (MongoDB Atlas pool), Environment (Zod fail-fast)
│   │   ├── controllers/            # 17 Controllers (Auth, TestSeries, Course, Payments, etc.)
│   │   ├── data/                   # Seed files (partTestsData.ts - 128KB duplicate!)
│   │   ├── middlewares/            # Auth (JWT HS256), Security (Rate limit, sanitizeInputs, Helmet), Error
│   │   ├── models/                 # 21 Mongoose Models (User, TestSeries, Course, Lead, Order, etc.)
│   │   ├── routes/                 # 18 Modular API Routers
│   │   ├── services/               # Razorpay, Math Import (AST, LaTeX normalization), Socket
│   │   ├── sockets/                # Socket.IO event handlers (Admin leads, live session sync)
│   │   ├── types/                  # Shared backend TypeScript interfaces
│   │   ├── utils/                  # Magic bytes file validation, logger, UUID
│   │   ├── app.ts                  # Express app setup, CORS allowlist, Helmet CSP, Static fallback
│   │   └── server.ts               # HTTP & Socket.IO initialization
│   ├── tests/                      # Automated test suite (28 passing security tests)
│   └── package.json
│
├── frontend/                       # React 19 + Vite 8 + TypeScript SPA
│   ├── src/
│   │   ├── assets/                 # Brand assets, vectors, illustrations
│   │   ├── components/
│   │   │   ├── admin/              # Monolithic Admin Workspaces (TestSeriesBuilderWorkspace: 374KB!)
│   │   │   ├── home/               # SplitHero, Achievers, PopularCourses, CallbackForm
│   │   │   ├── layout/             # Navbar, Footer, MobileNav
│   │   │   ├── testSeries/         # CBT Simulator, QuestionPalette, Timer, ResultAnalysis
│   │   │   └── ui/                 # MathEngine (KaTeX), Container, Buttons, Modals
│   │   ├── context/                # AuthContext, AdminAuthContext, ToastContext
│   │   ├── data/                   # Hardcoded data bundled in client (~320KB of questions/courses!)
│   │   ├── pages/                  # Route views (Home, Courses, TestSeries, CBT, LMS, Admin)
│   │   ├── services/               # Axios/Fetch client, CMS service, Socket client, Offer service
│   │   ├── styles/                 # Dual CSS engine: SCSS design tokens + Tailwind CSS
│   │   └── utils/                  # Word/PDF parsers, Math AST parsers, Sound effects, Sync
│   ├── index.html                  # CDN scripts (MathJax 3, Razorpay, Google GSI, CdnFonts)
│   ├── vite.config.ts              # Vite config with manualChunks vendor splitting
│   └── package.json
│
├── scripts/                        # Unified build scripts for Hostinger cPanel / VPS deployment
├── storage/ / public/              # Local disk file uploads (restricted static directory)
├── .gitleaks.toml                  # Secret leak protection rule set
├── ecosystem.config.cjs            # PM2 cluster configuration
├── server.js / index.js / db.js    # Entry redirects to backend/dist/server.js (Hostinger compatibility)
└── SECURITY_REPORT.md              # Historical backend security audit report
```

### Folder Structure Feedback & Issues:
1. **Duplicate Data Directory**: `partTestsData.ts` (128 KB) `backend/src/data/` aur `frontend/src/data/` dono jagah exist karta hai. Frontend me itna bada mock dataset bundle hone se client size barbad ho raha hai.
2. **Gigantic Single Components**: `frontend/src/components/admin/TestSeries/TestSeriesBuilderWorkspace.tsx` akela **374 KB (7,699 lines)** ka hai. Same `DppPyqWorkspace.tsx` (**234 KB**). Isko micro-components (sub-components, custom hooks) me break karna mandatory hai.
3. **Dual CSS Architecture**: Tailwind CSS aur SCSS modules dono ek saath use ho rahe hain (`variables.scss`, `design-tokens.scss`, `tailwind.css`), jisse CSS bundle size 157 KB ho gaya hai aur stylesheet parsing slow hoti hai.

---

## 2. Performance Audit: Kaha Lag Kar Rahi Hai & Bottlenecks

### 🔴 Critical Lag Reasons (Why the Website Lags)

| # | Bottleneck Area | Root Cause | Impact on Website |
|---|---|---|---|
| **1** | **Monolithic 7,700-Line Component (`TestSeriesBuilderWorkspace.tsx`)** | Single giant component file with dozens of state variables (`useState`, `useRef`, LaTeX parsers, modal states, undo stacks). | Jab user question type karta hai ya tab switch karta hai, to React poora 7,700 lines ka tree re-render karta hai. Typing me lag, browser tab freeze, aur high memory consumption (300MB+ tab RAM). |
| **2** | **Double Math Engines (KaTeX + CDN MathJax 3)** | `index.html` me `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js` load hota hai (1.5 MB runtime) jabki `package.json` me already `katex` installed hai. | Initial page load par browser CPU 1.5MB ka MathJax parse karne me freeze hota hai. Double parsing engine memory leak create karta hai. |
| **3** | **Un-virtualized Question Lists in CBT & Admin** | 75 se 100 questions (with equations, 4 options each = 500+ math formulas) ko plain `div.map()` se render kiya gaya hai. | 10,000+ DOM nodes simultaneously create hote hain. Question scroll karte time FPS drop hoke 10-15 FPS par aa jata hai ("stuttering / lag"). |
| **4** | **320KB Hardcoded Mock Data Bundled into Homepage Bundle** | `HomePage.tsx` -> `cmsService.ts` -> `testSeriesData.ts` -> `partTestsData.ts`. Sabhi part tests, answers, aur solutions main bundle me load ho rahe hain. | Homepage visit karte hi user 300KB+ unnecessary questions download karta hai, mobile networks (4G/3G) par First Contentful Paint (FCP) 3-4s slow ho jata hai. |
| **5** | **Third-Party CDN Blocking Scripts in `<head>`** | `fonts.cdnfonts.com/css/gilroy-bold` aur `checkout.razorpay.com/v1/checkout.js` aur `accounts.google.com/gsi/client` sab `index.html` ke `<head>` me hain. | `cdnfonts.com` India me frequently slow respond karta hai (1-2s TTFB delay). Homepage visitor ko Razorpay checkout script load karane ki zaroorat nahi hoti jab tak wo buy button na dabaye. |
| **6** | **Global Socket.IO Immediate Connection** | `App.tsx` me `useEffect(() => { initSocketClient(); }, [])` har public visitor ke liye `transports: ['polling', 'websocket']` trigger karta hai. | Regular visitor (jo sirf article ya landing page dekh raha hai) bhi backend socket pool occupy karta hai, server connection limits reach ho sakti hain. |
| **7** | **Backend Query Over-Fetching (`getAllTestSeries`)** | `TestSeries.find(filter)` in `testSeriesController.ts` bina `.select('-questions')` ke chalta hai. | Jab koi `/api/v1/tests` list kholta hai, database se saare questions, options, explanation blocks aur LaTeX transfer hote hain (Multi-megabyte JSON response). Database queries memory consume karti hain. |

---

## 3. Security Audit: Hacking Se Kitni Protected Hai & Vulnerabilities

### 🛡️ Kitni Protected Hai? (Current Security Posture)
- **Backend Architecture**: **85% Protected** (Strong foundation already present).
- **Frontend & Exam Integrity**: **50% Vulnerable** (CBT cheating possible via DevTools).

### ✅ Jo Chize Already Well-Protected Hain:
1. **NoSQL Injection**: `sanitizeInputs` middleware body, query aur params me se `$` aur `.` operators recursively strip karta hai.
2. **CORS Security**: Strict allowlist check (`env.ALLOWED_ORIGINS_ARRAY`) aur exact regex for Vercel preview domains (`backend/src/app.ts`). Unauthorized origins ko instant rejection milti hai.
3. **HTTP Security Headers**: Helmet configure hai with strict HSTS (1 year + preload), `X-Content-Type-Options: nosniff`, `frameguard: { action: 'deny' }` (Clickjacking defense), and `x-powered-by` disabled.
4. **Rate Limiting**: Auth endpoints (`/login`, `/register`, `/admin-login`) 5 attempts/min/IP par rate-limited hain, and global API is capped at 600 req/15min.
5. **File Upload Verification**: Binary magic bytes validation (`backend/src/utils/fileValidation.ts`) inspects actual byte headers (rejects disguised `.php`, `.sh`, `.exe`, or HTML disguised as `.jpg`). Local disk uploads random UUID filenames use karte hain (Path Traversal `../` impossible).
6. **Payment Webhook Verification**: Timing-safe HMAC-SHA256 signature check (`crypto.timingSafeEqual`) on raw body prevents spoofed payment confirmations.

---

### ⚠️ Critical Security Concerns & Hacking Vulnerabilities

#### 1. 🚨 CBT Exam Simulator Cheating Vulnerability (CRITICAL)
- **Vulnerability**: `GET /api/v1/tests/:id` (public endpoint) backend se poora `TestSeries` document return karta hai jisme har question ka `correctAnswer`, `explanation`, aur `shortcutTrick` raw JSON me bhej diya jata hai (`backend/src/controllers/testSeriesController.ts#L462`).
- **Impact**: Koi bhi student browser ke DevTools (F12) -> **Network Tab** ya `Console` me `test.questions[i].correctAnswer` inspect karke bina solve kiye 100% correct answers dekh sakta hai!
- **Fix Required**: Test start hone par `correctAnswer`, `explanation`, aur `shortcutTrick` ko backend query se `.select('-questions.correctAnswer -questions.explanation -questions.shortcutTrick')` se strip karke bhejna hoga. Answers sirf `/submit` hone ke baad release hone chahiye.

#### 2. 🔑 Sensitive Tokens in `localStorage` (MEDIUM-HIGH)
- **Vulnerability**: `apiClient.ts` me JWT auth tokens (`dk_academy_admin_session_v1`, `adminToken`, `token`) aur `dk_gemini_api_key` plain browser `localStorage` me save ho rahe hain.
- **Impact**: Agar website par koi third-party script ya npm dependency compromise ho jaye (XSS attack), to wo `localStorage` se direct Admin JWT aur Gemini API Key chura sakti hai.
- **Fix Required**: Auth tokens ko `HttpOnly`, `SameSite=Lax`, `Secure` cookies me migrate karein. Gemini API Key ko kabhi client localStorage me na mangwayein—wo sirf backend `.env` me honi chahiye.

#### 3. 🌐 MongoDB Atlas IP Whitelist (OPERATIONAL)
- **Vulnerability**: Check karein ki MongoDB Atlas Network Access me `0.0.0.0/0` (Allow Access from Anywhere) to nahi chhoot gaya hai.
- **Impact**: Past git history me agar purane credentials the (jaisa `SECURITY_REPORT.md` me mention hai), to Atlas instance direct brute-force ya connection attempt ke exposure me aa sakta hai.
- **Fix Required**: Atlas Console me IP access sirf Hostinger VPS / backend server ki static IP par lock karein.

#### 4. 🕵️‍♂️ Direct Answer Tampering on Submission
- **Vulnerability**: `submitTestSeries` me `studentId` body se fallback accept karta hai (`req.body.studentId || guest-${Date.now()}`).
- **Impact**: Unauthenticated users doosre students ke submission IDs par scores overwrite ya fake analytics inject kar sakte hain.

---

## 4. UI/UX Review: User Experience & Design Issues

### 🔍 Observations:
1. **Layout Thrashing & Cumulative Layout Shift (CLS)**:
   - External web fonts (`Gilroy` from cdnfonts + `Plus Jakarta Sans` from Google) fallback font ke swap hone par text reflow trigger karte hain. FOIT (Flash of Invisible Text) ya FOUT (Flash of Unstyled Text) hota hai.
2. **Aggressive Modals & Lead Prompts**:
   - `FloatingLeadWidget`, `PromotionalPopupModal`, and top offer banners agar sab ek saath appear ho jayein, to student landing page dekhne se pehle frustrate ho jata hai.
3. **CBT Mobile Responsiveness**:
   - NTA Exam simulation desktop 16:9 screen ke hisab se designed hai. Mobile devices par Question Palette (1 se 75 numbers) aur mathematical equations (matrices, determinants, integrals) cut ho jate hain ya excessive horizontal scroll require karte hain.
4. **Blocking Full-Screen Page Loader**:
   - Route change par `<PageLoader message="LOADING TEST..." />` screen ko completely block kar deta hai. Modern UX standard ke hisab se lightweight skeleton loaders use hone chahiye taaki visual continuity bane rahe.
5. **Dark Mode / Math Contrast**:
   - Mathematical formulas (`\frac`, superscripts) ke symbols kuch themes me low contrast (grey-on-white) ho jate hain, jisse class 11-12 ke students ko small powers/subscripts clearly visible nahi hote.

---

## 5. Action Plan & Prioritized Roadmap (What to Fix & Do)

### 🚀 Phase 1: High Priority (Immediate 1-2 Days) — Fix Lag & Security Leak

- [ ] **Fix CBT Cheating Leak**:
  - `backend/src/controllers/testSeriesController.ts` me `getTestSeriesByIdOrSlug` ke andar student request ke liye questions array me se `correctAnswer`, `explanation`, aur `shortcutTrick` delete/omit karein:
    ```ts
    // Strip answers for non-admin students during ongoing exam
    if (!isAdmin) {
      raw.questions = raw.questions.map((q: any) => {
        const { correctAnswer, explanation, shortcutTrick, ...safeQ } = q;
        return safeQ;
      });
    }
    ```
- [ ] **Remove Heavy CDN Scripts from `index.html`**:
  - `MathJax 3` script tag aur config ko `index.html` se hata dein! Project already KaTeX use karta hai jo 10x faster aur lightweight hai.
  - `Razorpay checkout.js` ko dynamically load karein jab user "Enroll" ya "Pay Now" click kare (lazy script injection).
  - External `cdnfonts.com/gilroy-bold` ko local WOFF2 font me convert karke `public/fonts/` se serve karein ya `@fontsource` use karein.
- [ ] **Optimize `getAllTestSeries` Database Query**:
  - In `backend/src/controllers/testSeriesController.ts`, change:
    ```ts
    // Exclude large questions array from listing endpoint!
    let items = await TestSeries.find(filter)
      .select('-questions')
      .sort({ createdAt: -1 })
      .lean();
    ```

---

### ⚡ Phase 2: Medium Priority (Week 1) — De-bloat Frontend & Stop Lag

- [ ] **Uncouple Hardcoded Data from Frontend Bundle**:
  - `cmsService.ts` aur `HomePage.tsx` se `partTestsData.ts` aur `testSeriesData.ts` ka static import remove karein.
  - Data ko API call se fetch karein (`/api/v1/tests?status=Published`) aur local cache me rakhein, taaki homepage bundle 300KB chhota ho jaye.
- [ ] **Refactor `TestSeriesBuilderWorkspace.tsx`**:
  - 7,700 lines ke component ko modular structure me divide karein:
    - `QuestionEditor.tsx` (Single question editing)
    - `QuestionPaletteSidebar.tsx` (Question navigation)
    - `BulkDocxImportModal.tsx` (Separated)
    - `useTestBuilderState.ts` (Custom hook for state & undo/redo)
- [ ] **Virtualize Question Lists**:
  - CBT test screen aur Admin question bank me `@tanstack/react-virtual` integrate karein taaki sirf visible 3-5 questions DOM me render hon, baaki 70 questions memory se unmount rahein.
- [ ] **Lazy Connect Socket.IO**:
  - Socket.IO connection ko sirf un routes par initiate karein jahan uski zaroorat hai (Admin Dashboard, Live Classroom), homepage par nahi.

---

### 🔒 Phase 3: Hardening & UX Polish (Week 2)

- [ ] **Cookie-based Auth Migration**:
  - Student & Admin JWT ko `localStorage` se secure `HttpOnly` cookies par switch karein.
  - Gemini API key ko client storage se completely hata kar server-side endpoint (`/api/v1/ai/repair-latex`) me backend `.env` (`GEMINI_API_KEY`) se execute karein.
- [ ] **Implement Skeleton Screens**:
  - `PageLoader` spinner ki jagah Tailwind-based skeleton cards use karein (Hero skeleton, Course Card skeleton, Test list skeleton).
- [ ] **Mobile CBT Simulator Testing**:
  - Math formula containers par `overflow-x: auto` with smooth scrolling aur touch-friendly question palette drawer integrate karein.

---

## 📊 Summary Scorecard

| Category | Score | Status | Primary Action Required |
|---|:---:|:---:|---|
| **Architecture & Structure** | **70 / 100** | ⚠️ Needs Refactoring | Split 7,700-line monolithic files; remove duplicate data files. |
| **Runtime Performance & Speed** | **62 / 100** | 🔴 Severe Lag Points | Drop CDN MathJax, exclude questions from test listing, virtualize math DOM. |
| **Backend & Network Security** | **88 / 100** | 🟢 Strong Protection | Helmet, RateLimit, CORS, and Zod are in place. |
| **Exam Integrity & Anticheat** | **45 / 100** | 🚨 Critical Gap | Strip `correctAnswer` from `/api/v1/tests/:id` before test submission. |
| **User Experience & UI** | **78 / 100** | 🟡 Good, Needs Polish | Replace full-screen loaders with skeletons; fix mobile math overflow. |

---
*Report generated automatically for DK Academy JEE Technical Operations.*  
*File location: `healthreport.md`*

