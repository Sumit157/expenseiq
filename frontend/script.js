// ============================
//   ExpenseIQ — script.js (with Auth & Multi-Period Charts)
// ============================

const API_BASE = "https://expenseiq-u03u.onrender.com"; 

// ---- Auth Guard ----
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");
if (!token || !user) {
  window.location.href = "auth.html";
}

// ---- State ----
let expenses = [];
let pieChart = null;
let barChart = null;
let activePeriod = "monthly"; // "daily" | "weekly" | "monthly"

// ---- Initialization ----
document.addEventListener("DOMContentLoaded", () => {
  if (user) {
    const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("user-avatar").textContent = initials;
    document.getElementById("user-name").textContent = user.name.split(" ")[0];
  }
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  
  initSpendingToggle(); // Wire up the new period buttons
  fetchExpenses();
});

function initSpendingToggle() {
  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activePeriod = btn.dataset.period;
      document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderBarChart();
    });
  });
}

// ---- Auth Headers Helper ----
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

// ---- Logout ----
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "auth.html";
}

const CAT_EMOJI = {
  Food: "🍔", Travel: "✈️", Shopping: "🛍️",
  Entertainment: "🎮", Health: "💊", Bills: "📄",
  Education: "📚", Other: "📦"
};

const CHART_COLORS = [
  "#7c3aed", "#06b6d4", "#f59e0b", "#10b981",
  "#f472b6", "#60a5fa", "#34d399", "#94a3b8"
];

// ============================
//   API CALLS
// ============================

async function fetchExpenses() {
  showLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/expenses`, { headers: authHeaders() });
    if (res.status === 401) return logout();
    if (!res.ok) throw new Error("Failed to fetch");
    expenses = await res.json();
    renderAll();
  } catch (err) {
    console.error(err);
    showToast("⚠️", "Could not load expenses.");
    expenses = [];
    renderAll();
  } finally {
    showLoading(false);
  }
}

async function addExpense() {
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value.trim();

  if (!amount || amount <= 0) return showToast("⚠️", "Enter a valid amount.");
  if (!category) return showToast("⚠️", "Select a category.");
  if (!date) return showToast("⚠️", "Pick a date.");
  if (!description) return showToast("⚠️", "Add a description.");

  setBtnLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/expenses`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ amount, category, date, description })
    });
    if (res.status === 401) return logout();
    if (!res.ok) throw new Error("Failed to add");
    const newExpense = await res.json();
    expenses.unshift(newExpense);
    renderAll();
    clearForm();
    showToast("✅", "Expense added!");
  } catch (err) {
    console.error(err);
    showToast("❌", "Failed to add expense.");
  } finally {
    setBtnLoading(false);
  }
}

async function deleteExpense(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) card.classList.add("deleting");

  setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (res.status === 401) return logout();
      if (!res.ok) throw new Error("Failed to delete");
      expenses = expenses.filter(e => e._id !== id);
      renderAll();
      showToast("🗑️", "Expense deleted.");
    } catch (err) {
      console.error(err);
      if (card) card.classList.remove("deleting");
      showToast("❌", "Failed to delete.");
    }
  }, 280);
}

// ============================
//   RENDER LOGIC
// ============================

function renderAll() {
  renderStats();
  renderExpenseList();
  renderCharts();
}

function renderStats() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById("total-amount").textContent = `₹${formatNum(total)}`;
  document.getElementById("total-count").textContent = `${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}`;

  const catTotals = getCategoryTotals();
  const cats = Object.entries(catTotals);
  if (cats.length > 0) {
    cats.sort((a, b) => b[1] - a[1]);
    const [topCat, topAmt] = cats[0];
    document.getElementById("top-category").textContent = `${CAT_EMOJI[topCat] || "📦"} ${topCat}`;
    document.getElementById("top-amount").textContent = `₹${formatNum(topAmt)} spent`;
  } else {
    document.getElementById("top-category").textContent = "—";
    document.getElementById("top-amount").textContent = "No data";
  }

  const now = new Date();
  const monthTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, e) => s + e.amount, 0);
  document.getElementById("month-amount").textContent = `₹${formatNum(monthTotal)}`;
  document.getElementById("month-name").textContent = now.toLocaleString("default", { month: "long", year: "numeric" });
}

function renderExpenseList() {
  const list = document.getElementById("expense-list");
  const empty = document.getElementById("empty-state");
  const badge = document.getElementById("expense-badge");

  badge.textContent = `${expenses.length} item${expenses.length !== 1 ? "s" : ""}`;

  if (expenses.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    empty.classList.add("flex");
    return;
  }
  empty.classList.add("hidden");
  empty.classList.remove("flex");

  list.innerHTML = expenses.map((e, i) => `
    <div class="expense-card" data-id="${e._id}" style="animation-delay:${i * 40}ms">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style="background:rgba(255,255,255,0.05)">
            ${CAT_EMOJI[e.category] || "📦"}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">${escHtml(e.description)}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="cat-badge cat-${e.category}">${e.category}</span>
              <span class="text-xs text-white/30" style="font-family:'JetBrains Mono',monospace">${formatDate(e.date)}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-base font-bold text-white" style="font-family:'JetBrains Mono',monospace">₹${formatNum(e.amount)}</span>
          <button class="delete-btn" onclick="deleteExpense('${e._id}')" title="Delete">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// ============================
//   CHARTS LOGIC
// ============================

function renderCharts() {
  renderPieChart();
  renderBarChart();
}

function renderPieChart() {
  const catTotals = getCategoryTotals();
  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);
  const isEmpty = labels.length === 0;
  document.getElementById("pie-empty").style.display = isEmpty ? "flex" : "none";
  const ctx = document.getElementById("pie-chart").getContext("2d");
  if (pieChart) pieChart.destroy();
  if (isEmpty) return;
  pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: CHART_COLORS.map(c => c + "cc"), borderColor: CHART_COLORS, borderWidth: 1.5, hoverOffset: 8 }]
    },
    options: {
      responsive: true, maintainAspectRatio: true, cutout: "65%",
      plugins: {
        legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.5)", font: { size: 11, family: "Space Grotesk" }, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ₹${formatNum(ctx.parsed)}` }, backgroundColor: "rgba(0,0,0,0.8)", titleColor: "rgba(255,255,255,0.9)", bodyColor: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }
      }
    }
  });
}

function renderBarChart() {
  let data, labels;

  if (activePeriod === "daily")      { ({ labels, data } = getDailyTotals());  }
  else if (activePeriod === "weekly")  { ({ labels, data } = getWeeklyTotals()); }
  else                                 { ({ labels, data } = getMonthlyTotals()); }

  const isEmpty = labels.length === 0;
  document.getElementById("bar-empty").style.display = isEmpty ? "flex" : "none";

  const ctx = document.getElementById("bar-chart").getContext("2d");
  if (barChart) barChart.destroy();
  if (isEmpty) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(124,58,237,0.8)");
  gradient.addColorStop(1, "rgba(6,182,212,0.2)");

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Spending (₹)",
        data,
        backgroundColor: gradient,
        borderColor: "rgba(124,58,237,0.9)",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ₹${formatNum(ctx.parsed.y)}` },
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "rgba(255,255,255,0.9)",
          bodyColor: "rgba(255,255,255,0.7)",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "rgba(255,255,255,0.4)", font: { size: 11, family: "Space Grotesk" }, maxRotation: 45 }
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "rgba(255,255,255,0.4)",
            font: { size: 11, family: "JetBrains Mono" },
            callback: v => `₹${formatNum(v)}`
          }
        }
      }
    }
  });
}

// ============================
//   HELPERS & DATA PROCESSING
// ============================

function getDailyTotals() {
  const today = new Date();
  const result = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    result[key] = 0;
  }
  expenses.forEach(e => {
    const d = new Date(e.date);
    const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 30) {
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (key in result) result[key] += e.amount;
    }
  });
  return { labels: Object.keys(result), data: Object.values(result) };
}

function getWeeklyTotals() {
  const today = new Date();
  const result = {};
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7 - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const label = `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    result[label] = { total: 0, start: weekStart, end: weekEnd };
  }
  expenses.forEach(e => {
    const d = new Date(e.date);
    for (const [label, bucket] of Object.entries(result)) {
      if (d >= bucket.start && d <= bucket.end) {
        bucket.total += e.amount;
        break;
      }
    }
  });
  return { labels: Object.keys(result), data: Object.values(result).map(b => b.total) };
}

function getMonthlyTotals() {
  const months = {};
  expenses.forEach(e => {
    const d = new Date(e.date);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    months[key] = (months[key] || 0) + e.amount;
  });
  const sorted = {};
  Object.keys(months).sort((a, b) => new Date("1 " + a) - new Date("1 " + b)).forEach(k => sorted[k] = months[k]);
  return { labels: Object.keys(sorted), data: Object.values(sorted) };
}

function getCategoryTotals() {
  return expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
}

function showLoading(show) { document.getElementById("loading").style.display = show ? "flex" : "none"; }

function setBtnLoading(loading) {
  const btn = document.getElementById("add-btn");
  const txt = document.getElementById("btn-text");
  const ldr = document.getElementById("btn-loader");
  btn.disabled = loading;
  txt.style.display = loading ? "none" : "inline";
  ldr.classList.toggle("hidden", !loading);
  ldr.classList.toggle("flex", loading);
}

function clearForm() {
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
  document.getElementById("description").value = "";
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
}

function showToast(icon, msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-icon").textContent = icon;
  document.getElementById("toast-msg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function formatNum(n) {
  if (n >= 100000) return (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return parseFloat(n.toFixed(2)).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}