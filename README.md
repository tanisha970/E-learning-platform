# 🎓 LearnHub — Full-Stack E-Learning Platform

A production-ready e-learning platform built with the **MERN stack**, featuring JWT authentication, Razorpay payments, role-based dashboards, video lessons, progress tracking, and MCQ quizzes.

## 📌 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#️-setup--installation)
- [Demo Credentials](#-demo-credentials)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Security](#-security-features)
- [Architecture Notes](#-architecture-notes)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure login & registration with token-based auth
- 👥 **Role-Based Access** — Separate Admin and Student dashboards
- 💳 **Razorpay Integration** — Full payment flow with HMAC signature verification
- 📹 **Video Lessons** — Content locked to enrolled users only
- 📊 **Progress Tracking** — Per-video completion tracking with auto-complete at 100%
- 🧠 **MCQ Quizzes** — Create, take, and submit quizzes per course
- 📈 **Analytics Dashboard** — Admin stats and student learning summaries
- 🌐 **Deployment Ready** — Configured for Vercel (FE), Render (BE), MongoDB Atlas

---

## 🚀 Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | React.js, Tailwind CSS, React Router |
| Backend    | Node.js, Express.js                  |
| Database   | MongoDB, Mongoose                    |
| Auth       | JWT (JSON Web Tokens), bcryptjs      |
| Payments   | Razorpay (Test Mode)                 |
| Deployment | Vercel (FE), Render (BE), MongoDB Atlas |

---

## 📁 Project Structure

```
elearning/
├── backend/
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js       # Register, login, getMe
│   │   ├── courseController.js     # CRUD for courses
│   │   ├── enrollmentController.js # Enroll, progress tracking
│   │   ├── paymentController.js    # Razorpay order + verify
│   │   ├── dashboardController.js  # Admin + user stats
│   │   └── quizController.js       # Quiz CRUD + submit
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect + adminOnly
│   │   └── errorHandler.js         # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── Payment.js
│   │   └── Quiz.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── quizRoutes.js
│   ├── server.js                   # Express app entry point
│   ├── seed.js                     # Sample data seeder
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html              # Razorpay script included here
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── Footer.jsx
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   └── UIComponents.jsx  # Spinner, Badge, StatCard, EmptyState
    │   │   └── course/
    │   │       └── CourseCard.jsx
    │   ├── context/
    │   │   └── AuthContext.js      # Global auth state
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── CoursesPage.jsx
    │   │   ├── CourseDetailPage.jsx
    │   │   ├── UserDashboardPage.jsx
    │   │   ├── AdminDashboardPage.jsx
    │   │   ├── CourseFormPage.jsx
    │   │   └── QuizPage.jsx
    │   ├── utils/
    │   │   └── api.js              # Axios instance with interceptors
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier)
- Razorpay account (test mode)

---

### 1. Clone the Repository

```bash
git clone https://github.com/tanisha970/E-learning-platform.git
cd E-learning-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/elearning
JWT_SECRET=your_very_secret_key_at_least_32_chars
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=http://localhost:3000
```

```bash
# Optional: seed sample data
node seed.js

# Start the development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

```bash
npm start
```

App runs at: `http://localhost:3000`

---

## 🔑 Demo Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@learnhub.com     | admin123    |
| Student | student@learnhub.com   | student123  |

---

## 🌐 API Endpoints

### Auth

| Method | Endpoint               | Access  | Description        |
|--------|------------------------|---------|--------------------|
| POST   | /api/auth/register     | Public  | Register new user  |
| POST   | /api/auth/login        | Public  | Login + get token  |
| GET    | /api/auth/me           | Private | Get current user   |
| GET    | /api/auth/students     | Admin   | Get all students   |
| DELETE | /api/auth/students/:id | Admin   | Delete a student   |

### Courses

| Method | Endpoint               | Access | Description             |
|--------|------------------------|--------|-------------------------|
| GET    | /api/courses           | Public | List all courses        |
| GET    | /api/courses/:id       | Public | Course details          |
| POST   | /api/courses           | Admin  | Create course           |
| PUT    | /api/courses/:id       | Admin  | Update course           |
| DELETE | /api/courses/:id       | Admin  | Delete course           |
| GET    | /api/courses/admin/all | Admin  | All courses (incl. unpublished) |

### Enrollments

| Method | Endpoint                             | Access  | Description           |
|--------|--------------------------------------|---------|-----------------------|
| POST   | /api/enrollments                     | Student | Enroll in a course    |
| GET    | /api/enrollments/my                  | Student | My enrolled courses   |
| PUT    | /api/enrollments/:courseId/progress  | Student | Mark video complete   |
| GET    | /api/enrollments/course/:id          | Admin   | View course students  |

### Payments (Razorpay)

| Method | Endpoint                    | Access  | Description            |
|--------|-----------------------------|---------|------------------------|
| POST   | /api/payments/create-order  | Student | Create Razorpay order  |
| POST   | /api/payments/verify        | Student | Verify + enroll user   |
| GET    | /api/payments/my            | Student | Payment history        |

### Dashboard

| Method | Endpoint              | Access  | Description     |
|--------|-----------------------|---------|-----------------|
| GET    | /api/dashboard/admin  | Admin   | Full analytics  |
| GET    | /api/dashboard/user   | Student | Student stats   |

### Quiz

| Method | Endpoint                       | Access  | Description     |
|--------|--------------------------------|---------|-----------------|
| GET    | /api/quizzes/:courseId         | Student | Get quiz        |
| POST   | /api/quizzes/:courseId/submit  | Student | Submit answers  |
| POST   | /api/quizzes/:courseId         | Admin   | Create quiz     |

---

## 🚢 Deployment

### Backend → Render.com

1. Push backend folder to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add all environment variables from `.env`

### Frontend → Vercel

1. Push frontend folder to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com/api`
4. Deploy!

### Database → MongoDB Atlas

1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist all IPs (`0.0.0.0/0`) for Render compatibility
4. Copy the connection string to `MONGO_URI`

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- **JWT tokens** with 7-day expiry
- Razorpay payments verified server-side using **HMAC-SHA256**
- Admin routes protected with role-based middleware
- Video content hidden from non-enrolled users
- **CORS** configured to allow only the frontend origin

---

## 🏗️ Architecture Notes

### MVC Pattern (Backend)
Models → Controllers → Routes keeps business logic cleanly separated from routing.

### Payment Flow (3 Steps)
1. Frontend calls `/create-order` → Razorpay order created server-side
2. Razorpay checkout opens in browser → User completes payment
3. Frontend receives `handler` response → Calls `/verify` → Server validates HMAC signature → User enrolled

### Progress Tracking
- Each video has a MongoDB `_id`
- `Enrollment` stores `completedVideos: [ObjectId]`
- Progress % = `(completedVideos.length / totalVideos) * 100`
- Automatically marked complete at 100%

### Auth Design
- **Context API** for global auth state (no Redux needed at this scale)
- **Axios interceptors** for automatic token attachment and 401 redirect handling
- **Compound index** on Enrollment `(user + course)` prevents duplicate enrollments
- JWT chosen over sessions for stateless, scalable, mobile-friendly architecture

---

## 👩‍💻 Author

**Tanisha** — BTech CSE @ Graphic Era Hill University  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/tanisha-rikhari-37bb72320/)
[![GitHub](https://img.shields.io/badge/GitHub-tanisha970-181717?style=flat-square&logo=github)](https://github.com/tanisha970)
[![Gmail](https://img.shields.io/badge/Email-rikharitanuu@gmail.com-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:rikharitanuu@gmail.com)

---

> *"Code. Create. Iterate."*
