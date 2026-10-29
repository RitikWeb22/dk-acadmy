# DK Academy JEE & BITSAT — Backend API Server

High-performance, scalable Node.js + Express + TypeScript backend server for DK Academy JEE & BITSAT coaching platform.

## 🚀 Installed Core Technologies & Packages

- **Runtime & Framework**: `Node.js`, `Express.js`
- **Database ODM**: `Mongoose` (MongoDB)
- **Authentication & Security**: `jsonwebtoken` (JWT), `bcryptjs`, `cors`
- **Real-Time Communication**: `socket.io` (WebSockets for live announcements, test notifications, and lead desks)
- **Media Uploads**: `cloudinary` (Course assets, PDFs, thumbnails)
- **Payment Processing**: `razorpay` (Course enrollments & test series subscriptions)
- **Configuration & Utilities**: `dotenv`, `uuid`, `tsx` (live TypeScript development runner)

---

## 📁 Project Architecture

```
backend/
├── .env                  # Active environment variables
├── .env.example          # Template configuration
├── package.json          # Dependencies & dev scripts
├── tsconfig.json         # TypeScript configuration
└── src/
    ├── config/           # Database, Cloudinary & Razorpay configurations
    │   ├── db.ts
    │   ├── cloudinary.ts
    │   └── razorpay.ts
    ├── controllers/      # Route request/response controllers
    │   └── authController.ts
    ├── middlewares/      # JWT protection, RBAC & error handlers
    │   ├── authMiddleware.ts
    │   └── errorMiddleware.ts
    ├── models/           # Mongoose schemas (User, Course with chapter curriculum)
    │   ├── User.ts
    │   └── Course.ts
    ├── routes/           # Express API routers
    │   ├── apiRoutes.ts
    │   └── authRoutes.ts
    ├── sockets/          # Socket.IO connection & room handlers
    │   └── socket.ts
    ├── app.ts            # Express app configuration & middlewares
    └── server.ts         # Server bootstrapper & Socket.IO initialization
```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Runtime mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `MONGO_URI` | MongoDB Connection URI | `mongodb://localhost:27017/dk_academy_jee` |
| `JWT_SECRET` | Secret key for signing tokens | Configured in `.env` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Key ID | Configured in `.env` |
| `RAZORPAY_KEY_SECRET`| Razorpay Merchant Secret | Configured in `.env` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Configured in `.env` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Configured in `.env` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Configured in `.env` |

---

## 🏃 Getting Started

### 1. Run Development Server (with hot reloading)
```bash
npm run dev
```

### 2. Build for Production
```bash
npm run build
```

### 3. Run Production Build
```bash
npm run start
```

---

## 📡 Base API Endpoints

- **Health Check**: `GET /api/v1/health`
- **Register User**: `POST /api/v1/auth/register`
- **Login User**: `POST /api/v1/auth/login`
- **Current User Profile**: `GET /api/v1/auth/me` (Requires `Authorization: Bearer <token>`)
