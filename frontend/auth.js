// ============================
//  ExpenseIQ — auth.js
// ============================

const API_BASE = "https://your-backend.onrender.com"; // 🔗 Change after deploy

// Redirect to dashboard if already logged in
if (localStorage.getItem("token")) {
  window.location.href = "index.html";
}

// ---- Tab Switching ----
function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("login-form").classList.toggle("hidden", !isLogin);
  document.getElementById("signup-form").classList.toggle("hidden", isLogin);
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-signup").classList.toggle("active", !isLogin);
  hideBanner();
}

// ---- Password Visibility ----
function togglePassword(fieldId, btn) {
  const field = document.getElementById(fieldId);
  field.type = field.type === "password" ? "text" : "password";
  btn.textContent = field.type === "password" ? "👁" : "🙈";
}

// ---- Password Strength Hints ----
document.addEventListener("DOMContentLoaded", () => {
  const pwdField = document.getElementById("signup-password");
  if (pwdField) {
    pwdField.addEventListener("input", () => {
      const v = pwdField.value;
      setHint("hint-len-dot", v.length >= 8);
      setHint("hint-num-dot", /\d/.test(v));
    });
  }
});

function setHint(dotId, pass) {
  const dot = document.getElementById(dotId);
  if (!dot) return;
  dot.style.background = pass ? "#10b981" : "rgba(255,255,255,0.1)";
  dot.style.boxShadow = pass ? "0 0 6px rgba(16,185,129,0.5)" : "none";
}

// ---- Banner Helpers ----
function showBanner(type, msg) {
  const b = document.getElementById("auth-banner");
  b.classList.remove("hidden");
  b.className = b.className.replace(/bg-\S+|text-\S+|border-\S+/g, "");
  if (type === "error") {
    b.className += " mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400";
    b.innerHTML = `<span>❌</span><span>${msg}</span>`;
  } else {
    b.className += " mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    b.innerHTML = `<span>✅</span><span>${msg}</span>`;
  }
}
function hideBanner() {
  document.getElementById("auth-banner").classList.add("hidden");
}

// ---- Set button loading ----
function setLoading(prefix, loading) {
  const btn = document.getElementById(`${prefix}-btn`);
  const txt = document.getElementById(`${prefix}-btn-text`);
  const ldr = document.getElementById(`${prefix}-btn-loader`);
  btn.disabled = loading;
  txt.style.display = loading ? "none" : "inline";
  ldr.classList.toggle("hidden", !loading);
  ldr.classList.toggle("flex", loading);
}

// ============================
//  HANDLE LOGIN
// ============================
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) return showBanner("error", "Please fill in all fields.");

  setLoading("login", true);
  hideBanner();
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Save token + user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showBanner("success", "Welcome back! Redirecting...");
    setTimeout(() => window.location.href = "index.html", 800);
  } catch (err) {
    showBanner("error", err.message);
  } finally {
    setLoading("login", false);
  }
}

// ============================
//  HANDLE SIGNUP
// ============================
async function handleSignup() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!name || !email || !password || !confirm)
    return showBanner("error", "Please fill in all fields.");
  if (password.length < 8)
    return showBanner("error", "Password must be at least 8 characters.");
  if (!/\d/.test(password))
    return showBanner("error", "Password must contain at least one number.");
  if (password !== confirm)
    return showBanner("error", "Passwords do not match.");

  setLoading("signup", true);
  hideBanner();
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    showBanner("success", "Account created! Signing you in...");

    // Auto-login after signup
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setTimeout(() => window.location.href = "index.html", 800);
  } catch (err) {
    showBanner("error", err.message);
  } finally {
    setLoading("signup", false);
  }
}

// Allow Enter key on inputs
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const loginVisible = !document.getElementById("login-form").classList.contains("hidden");
  if (loginVisible) handleLogin();
  else handleSignup();
});
