# 💰 ExpenseIQ v2 — Smart Expense Tracker with Authentication

Multi-user expense tracker with JWT authentication and bcrypt-encrypted passwords.

---

## 🔐 Security Overview

| Feature | Implementation |
|---|---|
| Password storage | bcrypt (12 salt rounds) — industry standard |
| Authentication | JWT (JSON Web Tokens) — 7-day expiry |
| Route protection | Middleware checks every API request |
| Data isolation | Every query filters by `userId` — users only see their own data |
| Password never returned | `toJSON()` override strips password from all responses |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Charts | Chart.js |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Hosting | Vercel (frontend) + Render (backend) |

---

## 📁 Folder Structure

```
project/
├── frontend/
│   ├── auth.html       ← Login / Signup page
│   ├── auth.js         ← Auth logic (signup, login, token storage)
│   ├── index.html      ← Dashboard (protected, redirects if not logged in)
│   ├── script.js       ← CRUD with Authorization header on every request
│   └── style.css       ← Glassmorphism dark theme
│
└── backend/
    ├── server.js               ← Express entry point
    ├── package.json
    ├── .env.example            ← Copy to .env
    ├── middleware/
    │   └── auth.js             ← JWT verify middleware
    ├── models/
    │   ├── User.js             ← User schema + bcrypt hashing
    │   └── Expense.js          ← Expense schema with userId link
    └── routes/
        ├── auth.js             ← POST /signup  POST /login
        └── expenses.js         ← GET / POST / DELETE (all protected)
```

---

## 🚀 DEPLOYMENT — Step by Step

### ✅ STEP 1 — MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Sign up free
2. Create free **M0 Cluster**
3. **Database Access** → Add user (username + password)
4. **Network Access** → Add `0.0.0.0/0` (allow all IPs for Render)
5. **Connect** → **Drivers** → Copy connection string:
   ```
   mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/expenseiq?retryWrites=true&w=majority
   ```

---

### ✅ STEP 2 — Generate a JWT Secret

Run this in your terminal to get a strong random secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output — you'll need it in Step 3.

---

### ✅ STEP 3 — Deploy Backend to Render

1. Push project to GitHub
2. [render.com](https://render.com) → New → **Web Service**
3. Connect repo → Set **Root Directory** to `backend`
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Environment Variables** → Add all three:
   ```
   MONGO_URI     = mongodb+srv://...
   JWT_SECRET    = (your generated secret from Step 2)
   JWT_EXPIRES_IN = 7d
   ```
6. Deploy → copy your URL (e.g. `https://expenseiq-api.onrender.com`)

---

### ✅ STEP 4 — Update Frontend API URL

Open **both** `frontend/auth.js` and `frontend/script.js`.
Change line 3 (or line 7) in each:

```js
// Change this in BOTH files:
const API_BASE = "https://expenseiq-api.onrender.com";
```

---

### ✅ STEP 5 — Deploy Frontend to Vercel

1. [vercel.com](https://vercel.com) → New Project → Import repo
2. Set **Root Directory** to `frontend`
3. No build command needed
4. Deploy → Done! 🎉

The app opens at `auth.html` by default. Update your Vercel project settings if needed:
- **Output Directory**: `frontend`

---

## 🏃 Run Locally

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
node server.js
# → http://localhost:5000

# Frontend
# Open frontend/auth.html in browser
# (or use VS Code Live Server)
# Set API_BASE = "http://localhost:5000" in auth.js and script.js
```

---

## 🔌 API Reference

### Auth (Public)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | /api/auth/signup | `{name, email, password}` | Create account |
| POST | /api/auth/login | `{email, password}` | Sign in, get token |

**Response from both:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "John", "email": "john@example.com" }
}
```

### Expenses (Protected — requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/expenses | Get current user's expenses |
| POST | /api/expenses | Add expense for current user |
| DELETE | /api/expenses/:id | Delete (only if owner) |

---

## 🗄️ MongoDB Collections

### users
```js
{ name, email, password (bcrypt hash), createdAt, updatedAt }
```

### expenses
```js
{ userId (ref→User), amount, category, date, description, createdAt, updatedAt }
```

---

## 🔒 How the Auth Flow Works

```
1. User signs up → password hashed by bcrypt (12 rounds) → saved to DB
2. User logs in → bcrypt.compare(input, hash) → if match, JWT issued
3. JWT stored in localStorage → sent as "Authorization: Bearer <token>" header
4. Every API request → auth middleware verifies JWT → attaches req.user
5. Expense queries always filter by req.user._id → complete data isolation
6. User A can never read/delete User B's expenses
```

---

Built with ❤️ — Vanilla JS, Express, MongoDB, JWT + bcrypt
