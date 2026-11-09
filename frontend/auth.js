// ============================
//  ExpenseIQ — auth.js
// ============================

const API_BASE = "https://expenseiq-u03u.onrender.com"; // Change after deploy

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
const ICON_EYE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EYE_OFF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>';

function togglePassword(fieldId, btn) {
  const field = document.getElementById(fieldId);
  const showing = field.type === "text";
  field.type = showing ? "password" : "text";
  btn.innerHTML = showing ? ICON_EYE : ICON_EYE_OFF;
  btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
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
  dot.style.background = pass ? "#4cc38a" : "rgba(239, 233, 222, 0.16)";
}

// ---- Banner Helpers ----
const ICON_ALERT_SM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
const ICON_CHECK_SM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';

function showBanner(type, msg) {
  const b = document.getElementById("auth-banner");
  b.classList.remove("hidden");
  b.className = "banner " + (type === "error" ? "banner-error" : "banner-success");
  b.innerHTML = `${type === "error" ? ICON_ALERT_SM : ICON_CHECK_SM}<span>${msg}</span>`;
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

  if (!email || !password) return showBanner("error", "Fill in all fields");

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

    showBanner("success", "Signed in, redirecting");
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
    return showBanner("error", "Fill in all fields");
  if (password.length < 8)
    return showBanner("error", "Password must be at least 8 characters");
  if (!/\d/.test(password))
    return showBanner("error", "Password must contain at least one number");
  if (password !== confirm)
    return showBanner("error", "Passwords do not match");

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

    showBanner("success", "Account created, signing you in");

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
