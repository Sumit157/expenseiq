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
let barChart = null;
let activePeriod = "monthly"; // "daily" | "weekly" | "monthly"
const seenIds = new Set();
let toastTimer = null;

// ---- Palette (matches style.css) ----
const ACCENT = "#e9a13b";
const INK = "#efe9de";
const MUTED = "#8a847a";
const GRID = "rgba(239, 233, 222, 0.06)";
const BAR_NEUTRAL = "rgba(239, 233, 222, 0.18)";
const BAR_NEUTRAL_HOVER = "rgba(239, 233, 222, 0.3)";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

// ---- Initialization ----
document.addEventListener("DOMContentLoaded", () => {
  if (user) {
    const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("user-avatar").textContent = initials;
    document.getElementById("user-name").textContent = user.name.split(" ")[0];
  }
  document.getElementById("date").value = new Date().toISOString().split("T")[0];

  initSpendingToggle();
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

// ============================
//   ICONS (line set, 1.5 stroke)
// ============================
const ICON_ALERT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
const ICON_CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_TRASH = '<svg width="16" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';

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
    showToast("error", "Could not load expenses");
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

  if (!amount || amount <= 0) return showToast("error", "Enter a valid amount");
  if (!category) return showToast("error", "Select a category");
  if (!date) return showToast("error", "Pick a date");
  if (!description) return showToast("error", "Add a description");

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
    showToast("success", "Expense added");
  } catch (err) {
    console.error(err);
    showToast("error", "Failed to add expense");
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
      seenIds.delete(id);
      renderAll();
      showToast("success", "Expense deleted");
    } catch (err) {
      console.error(err);
      if (card) card.classList.remove("deleting");
      showToast("error", "Failed to delete");
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
  document.getElementById("total-count").textContent =
    `${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}`;

  // Top category
  const cats = Object.entries(getCategoryTotals()).sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) {
    const [topCat, topAmt] = cats[0];
    const share = total > 0 ? Math.round((topAmt / total) * 100) : 0;
    document.getElementById("top-category").textContent = topCat;
    document.getElementById("top-amount").textContent = `${share}% of total`;
  } else {
    document.getElementById("top-category").textContent = "—";
    document.getElementById("top-amount").textContent = "No expenses yet";
  }

  // This month vs last month
  const now = new Date();
  const monthTotal = sumBetween(
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 1)
  );
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevTotal = sumBetween(
    prevDate,
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const prevLabel = prevDate.toLocaleString("default", { month: "long" });

  document.getElementById("month-amount").textContent = `₹${formatNum(monthTotal)}`;
  if (expenses.length === 0) {
    document.getElementById("month-name").textContent = "No expenses yet";
  } else if (prevTotal > 0) {
    document.getElementById("month-name").textContent = `vs ₹${formatNum(prevTotal)} in ${prevLabel}`;
  } else {
    document.getElementById("month-name").textContent = `no spending in ${prevLabel}`;
  }
}

function sumBetween(start, end) {
  return expenses
    .filter(e => {
      const d = parseDate(e.date);
      return d >= start && d < end;
    })
    .reduce((s, e) => s + e.amount, 0);
}

// Dates arrive as "YYYY-MM-DD"; parse them as local days so bucket
// boundaries and month totals never shift across time zones.
function parseDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function renderExpenseList() {
  const list = document.getElementById("expense-list");
  const empty = document.getElementById("empty-state");
  const badge = document.getElementById("expense-badge");

  badge.textContent = String(expenses.length);

  if (expenses.length === 0) {
    list.innerHTML = "";
    seenIds.clear();
    empty.classList.remove("hidden");
    empty.classList.add("flex");
    return;
  }
  empty.classList.add("hidden");
  empty.classList.remove("flex");

  list.innerHTML = expenses.map((e, i) => {
    const isNew = !seenIds.has(e._id);
    seenIds.add(e._id);
    const delay = isNew && i < 6 ? ` style="animation-delay:${i * 40}ms"` : "";
    const enter = isNew ? " row-enter" : "";
    return `
    <div class="ledger-row${enter}" data-id="${e._id}"${delay}>
      <div class="row-main">
        <p class="row-title">${escHtml(e.description)}</p>
        <p class="row-meta">${escHtml(e.category)} · ${formatDate(e.date)}</p>
      </div>
      <span class="row-amount">₹${formatNum(e.amount)}</span>
      <button class="icon-btn" onclick="deleteExpense('${e._id}')" title="Delete" aria-label="Delete ${escHtml(e.description)}">
        ${ICON_TRASH}
      </button>
    </div>`;
  }).join("");
}

// ============================
//   CHARTS LOGIC
// ============================

function renderCharts() {
  renderCategoryList();
  renderBarChart();
}

function renderCategoryList() {
  const totals = getCategoryTotals();
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById("cat-list");
  const empty = document.getElementById("cat-empty");

  if (entries.length === 0) {
    list.innerHTML = "";
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const max = entries[0][1];

  list.innerHTML = entries.map(([name, value], i) => {
    const share = total > 0 ? Math.round((value / total) * 100) : 0;
    const width = Math.max(4, (value / max) * 100);
    return `
      <div class="cat-row${i === 0 ? " is-top" : ""}">
        <div class="cat-head">
          <span class="cat-name">${escHtml(name)}</span>
          <span class="cat-value">₹${formatNum(value)} · ${share}%</span>
        </div>
        <div class="cat-track"><div class="cat-fill" style="width:${width}%"></div></div>
      </div>`;
  }).join("");
}

function renderBarChart() {
  let data, labels;

  if (activePeriod === "daily")       ({ labels, data } = getDailyTotals());
  else if (activePeriod === "weekly") ({ labels, data } = getWeeklyTotals());
  else                                ({ labels, data } = getMonthlyTotals());

  const isEmpty = labels.length === 0;
  document.getElementById("bar-empty").style.display = isEmpty ? "flex" : "none";

  const ctx = document.getElementById("bar-chart").getContext("2d");
  if (barChart) barChart.destroy();
  if (isEmpty) return;

  // One accent: the current period. Everything else sits in a neutral step.
  const fill = labels.map((_, i) =>
    i === labels.length - 1 ? ACCENT : BAR_NEUTRAL
  );
  const hover = labels.map((_, i) =>
    i === labels.length - 1 ? ACCENT : BAR_NEUTRAL_HOVER
  );

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Spending",
        data,
        backgroundColor: fill,
        hoverBackgroundColor: hover,
        borderRadius: 3,
        borderSkipped: false,
        maxBarThickness: 56,
        categoryPercentage: 0.7,
        barPercentage: 0.9
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: "#262421",
          borderColor: "rgba(239, 233, 222, 0.12)",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          titleColor: INK,
          bodyColor: "#aaa398",
          titleFont: { family: MONO, size: 12, weight: "500" },
          bodyFont: { family: MONO, size: 12 },
          callbacks: { label: ctx => `₹${formatNum(ctx.parsed.y)}` }
        }
      },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: MUTED,
            font: { family: MONO, size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            padding: 8
          }
        },
        y: {
          border: { display: false },
          grid: { color: GRID },
          ticks: {
            color: MUTED,
            font: { family: MONO, size: 11 },
            maxTicksLimit: 5,
            padding: 8,
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
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const result = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    result[key] = 0;
  }
  expenses.forEach(e => {
    const d = parseDate(e.date);
    const diffDays = Math.round((todayStart - d) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 30) {
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (key in result) result[key] += e.amount;
    }
  });
  return { labels: Object.keys(result), data: Object.values(result) };
}

function getWeeklyTotals() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const result = {};
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - i * 7 - todayStart.getDay());
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59, 999);
    const label = `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    result[label] = { total: 0, start: weekStart, end: weekEnd };
  }
  expenses.forEach(e => {
    const d = parseDate(e.date);
    for (const bucket of Object.values(result)) {
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
    const d = parseDate(e.date);
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

function showToast(type, msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-icon").innerHTML =
    type === "success" ? ICON_CHECK : ICON_ALERT;
  document.getElementById("toast-msg").textContent = msg;
  toast.classList.toggle("is-success", type === "success");
  toast.classList.toggle("is-error", type === "error");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// One number format across the screen: Indian grouping, no abbreviations
function formatNum(n) {
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
