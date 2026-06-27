# 🎓 LearnHub — Full-Stack E-Learning Platform

A production-ready e-learning platform built with the MERN stack, featuring JWT authentication, Razorpay payments, role-based dashboards, video lessons, progress tracking, and MCQ quizzes.

---

## 🚀 Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Frontend    | React.js, Tailwind CSS, React Router |
| Backend     | Node.js, Express.js                  |
| Database    | MongoDB, Mongoose                    |
| Auth        | JWT (JSON Web Tokens), bcryptjs      |
| Payments    | Razorpay (Test Mode)                 |
| Deployment  | Vercel (FE), Render (BE), MongoDB Atlas |

---

## 📁 Project Structure

```
elearning/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, getMe
│   │   ├── courseController.js    # CRUD for courses
│   │   ├── enrollmentController.js # Enroll, progress tracking
│   │   ├── paymentController.js   # Razorpay order + verify
│   │   ├── dashboardController.js # Admin + user stats
│   │   └── quizController.js      # Quiz CRUD + submit
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + adminOnly
│   │   └── errorHandler.js        # Global error handler
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
│   ├── server.js                  # Express app entry point
│   ├── seed.js                    # Sample data seeder
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html             # Razorpay script included here
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
    │   │   └── AuthContext.js     # Global auth state
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
    │   │   └── api.js             # Axios instance with interceptors
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

### 1. Clone & Setup Backend

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
# Seed sample data (optional but recommended)
node seed.js

# Start development server
npm run dev
```

### 2. Setup Frontend

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

App runs on: `http://localhost:3000`

---

## 🔑 Demo Credentials

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@learnhub.com       | admin123   |
| Student | student@learnhub.com     | student123 |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint            | Access  | Description        |
|--------|---------------------|---------|--------------------|
| POST   | /api/auth/register  | Public  | Register new user  |
| POST   | /api/auth/login     | Public  | Login + get token  |
| GET    | /api/auth/me        | Private | Get current user   |
| GET    | /api/auth/students  | Admin   | Get all students   |
| DELETE | /api/auth/students/:id | Admin | Delete student  |

### Courses
| Method | Endpoint                  | Access  | Description           |
|--------|---------------------------|---------|-----------------------|
| GET    | /api/courses              | Public  | List all courses      |
| GET    | /api/courses/:id          | Public  | Course details        |
| POST   | /api/courses              | Admin   | Create course         |
| PUT    | /api/courses/:id          | Admin   | Update course         |
| DELETE | /api/courses/:id          | Admin   | Delete course         |
| GET    | /api/courses/admin/all    | Admin   | All courses (unpubl.) |

### Enrollments
| Method | Endpoint                           | Access  | Description           |
|--------|------------------------------------|---------|-----------------------|
| POST   | /api/enrollments                   | Student | Enroll in course      |
| GET    | /api/enrollments/my                | Student | My enrolled courses   |
| PUT    | /api/enrollments/:courseId/progress| Student | Mark video complete   |
| GET    | /api/enrollments/course/:id        | Admin   | Course students       |

### Payments (Razorpay)
| Method | Endpoint                      | Access  | Description          |
|--------|-------------------------------|---------|----------------------|
| POST   | /api/payments/create-order    | Student | Create Razorpay order|
| POST   | /api/payments/verify          | Student | Verify + enroll      |
| GET    | /api/payments/my              | Student | Payment history      |

### Dashboard
| Method | Endpoint              | Access  | Description           |
|--------|-----------------------|---------|-----------------------|
| GET    | /api/dashboard/admin  | Admin   | Full analytics        |
| GET    | /api/dashboard/user   | Student | Student stats         |

### Quiz
| Method | Endpoint                         | Access  | Description    |
|--------|----------------------------------|---------|----------------|
| GET    | /api/quizzes/:courseId           | Student | Get quiz       |
| POST   | /api/quizzes/:courseId/submit    | Student | Submit answers |
| POST   | /api/quizzes/:courseId           | Admin   | Create quiz    |

---

## 🚢 Deployment

### Backend → Render.com

1. Push backend to GitHub
2. Create a new Web Service on Render
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add all environment variables from `.env`

### Frontend → Vercel

1. Push frontend to GitHub
2. Import project on Vercel
3. Set environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com/api`
4. Deploy!

### Database → MongoDB Atlas

1. Create free M0 cluster
2. Create database user
3. Whitelist all IPs (0.0.0.0/0) for Render compatibility
4. Copy connection string to `MONGO_URI`

---

## 🔒 Security Features

- **Passwords** hashed with bcryptjs (salt rounds: 10)
- **JWT** tokens with expiry (7 days)
- **Razorpay signature** verified server-side using HMAC-SHA256
- **Admin routes** protected with role middleware
- **Video content** hidden from non-enrolled users
- **CORS** configured to allow only frontend origin

---

## 💡 Interview Talking Points

### Architecture Decisions
- **MVC pattern** on backend: Models → Controllers → Routes
- **Context API** for global auth state (no Redux needed at this scale)
- **Axios interceptors** for automatic token attachment and 401 handling
- **Compound index** on Enrollment (user + course) prevents duplicate enrollments

### Payment Flow (3 Steps)
1. Frontend calls `/create-order` → Razorpay order created
2. Razorpay checkout opens in browser → User pays
3. Razorpay calls `handler` → Frontend sends to `/verify` → Server validates HMAC signature → Enroll user

### Progress Tracking Logic
- Each video has a MongoDB `_id`
- Enrollment stores `completedVideos: [ObjectId]`
- Progress % = (completedVideos.length / totalVideos) * 100
- Auto-marks complete at 100%

### Why JWT over Sessions?
- **Stateless** — no server-side session storage needed
- **Scalable** — works across multiple server instances
- **Mobile-friendly** — stored in localStorage, sent as Bearer token
