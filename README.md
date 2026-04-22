# 💰 ExpenseIQ — Smart Expense Tracker

A full-stack expense tracking app with beautiful dark glassmorphism UI and Chart.js analytics.

---

## 🧱 Tech Stack

| Layer     | Technology              |
|-----------|------------------------|
| Frontend  | HTML, Tailwind CSS, Vanilla JS |
| Charts    | Chart.js               |
| Backend   | Node.js + Express      |
| Database  | MongoDB Atlas          |
| Hosting   | Vercel (frontend) + Render (backend) |

---

## 📁 Folder Structure

```
project/
├── frontend/
│   ├── index.html      ← UI with Tailwind CSS + Chart.js
│   ├── style.css       ← Glassmorphism, animations, dark theme
│   └── script.js       ← Fetch API, CRUD, Charts
│
└── backend/
    ├── server.js           ← Express entry point
    ├── package.json
    ├── .env.example        ← Copy to .env
    ├── models/
    │   └── Expense.js      ← Mongoose schema
    └── routes/
        └── expenses.js     ← REST API routes
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### ✅ STEP 1 — MongoDB Atlas (Free Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Sign up free
2. Create a **Free M0 Cluster** (any region)
3. Under **Database Access** → Add a DB user (username + password)
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — required for Render)
5. Click **Connect** → **Drivers** → Copy the connection string:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add your database name: change `/?` to `/expenseiq?`

---

### ✅ STEP 2 — Deploy Backend to Render

1. Push your project to GitHub (or GitLab)
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo → Select the **backend** folder as root directory
   - Or set **Root Directory** to `backend`
4. Fill in:
   - **Name**: `expenseiq-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   ```
   MONGO_URI = mongodb+srv://youruser:yourpass@cluster0.xxxx.mongodb.net/expenseiq?retryWrites=true&w=majority
   ```
6. Click **Deploy**
7. Copy your Render URL (e.g., `https://expenseiq-api.onrender.com`)

**Note**: Free Render services sleep after 15 min. First request may be slow.

---

### ✅ STEP 3 — Update Frontend API URL

Open `frontend/script.js` and change line 7:

```js
// BEFORE:
const API_BASE = "https://your-backend.onrender.com";

// AFTER (use your actual Render URL):
const API_BASE = "https://expenseiq-api.onrender.com";
```

---

### ✅ STEP 4 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Click **Deploy** → Done! 🎉

---

## 🏃 Run Locally

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI
node server.js
# → Running on http://localhost:5000

# Frontend
# Open frontend/index.html in browser
# OR use VS Code Live Server extension
# Make sure script.js API_BASE = "http://localhost:5000"
```

---

## 🔌 API Reference

| Method | Endpoint            | Description       |
|--------|---------------------|-------------------|
| GET    | /api/expenses       | Get all expenses  |
| POST   | /api/expenses       | Add new expense   |
| DELETE | /api/expenses/:id   | Delete expense    |

### POST /api/expenses — Request Body:
```json
{
  "amount": 250,
  "category": "Food",
  "date": "2024-01-15",
  "description": "Lunch at cafe"
}
```

---

## 🗄️ MongoDB Schema

```js
{
  amount:      Number   // required, > 0
  category:    String   // enum: Food|Travel|Shopping|...
  date:        Date     // required
  description: String   // required, max 100 chars
  createdAt:   Date     // auto
  updatedAt:   Date     // auto
}
```

---

## ✨ Features

- ✅ Add / Delete expenses
- ✅ Stats: Total, Top Category, This Month
- ✅ Pie chart (category breakdown) with Chart.js
- ✅ Bar chart (monthly spending) with Chart.js
- ✅ Dark glassmorphism UI with animations
- ✅ Gradient cards with hover effects
- ✅ Toast notifications
- ✅ Loading states with animated spinner
- ✅ Fully responsive

---

## 🎨 UI Highlights

- **Glassmorphism**: `backdrop-filter: blur` + semi-transparent backgrounds
- **Animated orbs**: Soft gradient blobs in background
- **Grid overlay**: Subtle dot/line grid for depth
- **Gradient text**: CSS `background-clip: text` for colorful headings
- **Smooth animations**: Card slide-in, delete fade-out, hover transforms

---

Built with ❤️ using vanilla HTML, CSS, and JavaScript.
