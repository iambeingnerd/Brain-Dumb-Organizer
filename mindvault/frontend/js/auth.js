(() => {
  const $ = (id) => document.getElementById(id);

  const tabLogin = $("tabLogin");
  const tabRegister = $("tabRegister");
  const formsInner = $("formsInner");

  const loginForm = $("loginForm");
  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginEmailErr = $("loginEmailErr");
  const loginPasswordErr = $("loginPasswordErr");
  const loginGlobalErr = $("loginGlobalErr");
  const loginBtn = $("loginBtn");
  const loginSpin = $("loginSpin");

  const registerForm = $("registerForm");
  const regUsername = $("regUsername");
  const regEmail = $("regEmail");
  const regPassword = $("regPassword");
  const regConfirm = $("regConfirm");
  const regUsernameErr = $("regUsernameErr");
  const regEmailErr = $("regEmailErr");
  const regPasswordErr = $("regPasswordErr");
  const regConfirmErr = $("regConfirmErr");
  const regGlobalErr = $("regGlobalErr");
  const regBtn = $("regBtn");
  const regSpin = $("regSpin");
  const themeToggle = $("themeToggle");
  const themeLabel = $("themeLabel");
  const pageLoader = $("pageLoader");
  const loaderSub = $("loaderSub");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function api(path, { method = "GET", body } = {}) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Request failed.");
    return data;
  }

  function getTheme() {
    const stored = localStorage.getItem("mindvault_theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    if (themeLabel) themeLabel.textContent = theme === "light" ? "Light" : "Dark";
  }

  function toggleTheme() {
    const next = (document.body.dataset.theme || "dark") === "dark" ? "light" : "dark";
    localStorage.setItem("mindvault_theme", next);
    applyTheme(next);
  }

  function setPageLoading(on, message) {
    if (!pageLoader) return;
    if (loaderSub && message) loaderSub.textContent = message;
    pageLoader.classList.toggle("show", on);
    pageLoader.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function setMode(mode) {
    const isLogin = mode === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
    tabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
    tabRegister.setAttribute("aria-selected", !isLogin ? "true" : "false");
    formsInner.dataset.mode = mode;
    clearErrors();
  }

  function clearErrors() {
    [
      loginEmailErr,
      loginPasswordErr,
      loginGlobalErr,
      regUsernameErr,
      regEmailErr,
      regPasswordErr,
      regConfirmErr,
      regGlobalErr,
    ].forEach((el) => (el.textContent = ""));
  }

  function setLoading(which, on) {
    const btn = which === "login" ? loginBtn : regBtn;
    const spin = which === "login" ? loginSpin : regSpin;
    btn.disabled = on;
    spin.style.display = on ? "inline-block" : "none";
  }

  async function register(username, email, password) {
    const out = await api("/api/auth/register", { method: "POST", body: { username, email, password } });
    return { user: out.user, token: out.token };
  }

  async function login(email, password) {
    const out = await api("/api/auth/login", { method: "POST", body: { email, password } });
    return { user: out.user, token: out.token };
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (_) {
      // ignore
    } finally {
      sessionStorage.removeItem("user");
      window.location.href = "./index.html";
    }
  }

  async function checkAlreadyLoggedIn() {
    const cached = sessionStorage.getItem("user");
    if (!cached) return;
    try {
      setPageLoading(true, "Opening your vault…");
      await api("/api/auth/me");
      window.location.href = "./dashboard.html";
    } catch (_) {
      sessionStorage.removeItem("user");
    } finally {
      setPageLoading(false);
    }
  }

  function setUserSession(user) {
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        id: user.$id || user.id,
        username: user.name || user.username || (user.email ? user.email.split("@")[0] : "User"),
      })
    );
  }

  function validateLogin() {
    clearErrors();
    let ok = true;
    const email = loginEmail.value.trim();
    const pw = loginPassword.value;

    if (!email) {
      loginEmailErr.textContent = "Email is required.";
      ok = false;
    } else if (!EMAIL_RE.test(email)) {
      loginEmailErr.textContent = "Enter a valid email.";
      ok = false;
    }
    if (!pw) {
      loginPasswordErr.textContent = "Password is required.";
      ok = false;
    }
    return ok;
  }

  function validateRegister() {
    clearErrors();
    let ok = true;
    const username = regUsername.value.trim();
    const email = regEmail.value.trim();
    const pw = regPassword.value;
    const cf = regConfirm.value;

    if (!username) {
      regUsernameErr.textContent = "Username is required.";
      ok = false;
    } else if (username.length < 3 || username.length > 20) {
      regUsernameErr.textContent = "Username must be 3–20 characters.";
      ok = false;
    }
    if (!email) {
      regEmailErr.textContent = "Email is required.";
      ok = false;
    } else if (!EMAIL_RE.test(email)) {
      regEmailErr.textContent = "Enter a valid email.";
      ok = false;
    }
    if (!pw) {
      regPasswordErr.textContent = "Password is required.";
      ok = false;
    } else if (pw.length < 6) {
      regPasswordErr.textContent = "Password must be at least 6 characters.";
      ok = false;
    }
    if (!cf) {
      regConfirmErr.textContent = "Please confirm your password.";
      ok = false;
    } else if (pw !== cf) {
      regConfirmErr.textContent = "Passwords do not match.";
      ok = false;
    }
    return ok;
  }

  function startNeuralBackground() {
    const canvas = $("neural");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let w = 0,
      h = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    function resize() {
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    });
    window.addEventListener("pointerleave", () => (pointer.active = false));

    const count = Math.floor(Math.max(42, Math.min(90, (w * h) / 22000)));
    const nodes = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1 + Math.random() * 1.6,
    }));

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      for (const n of nodes) {
        if (pointer.active) {
          const dxp = n.x - pointer.x;
          const dyp = n.y - pointer.y;
          const d2p = dxp * dxp + dyp * dyp;
          const maxp = 160 * 160;
          if (d2p < maxp) {
            const d = Math.sqrt(d2p) || 1;
            const push = (1 - d2p / maxp) * 0.55;
            n.vx += (dxp / d) * push * 0.03;
            n.vy += (dyp / d) * push * 0.03;
          }
        }

        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.985;
        n.vy *= 0.985;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      // Links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const max = 155 * 155;
          if (d2 < max) {
            const t = 1 - d2 / max;
            ctx.strokeStyle = `rgba(0,245,212,${0.07 * t})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        ctx.fillStyle = "rgba(255,255,255,.16)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading("login", true);
    loginGlobalErr.textContent = "";
    try {
      setPageLoading(true, "Verifying credentials…");
      const email = loginEmail.value.trim();
      const pw = loginPassword.value;
      const data = await login(email, pw);
      setUserSession(data.user);
      window.location.href = "./dashboard.html";
    } catch (err) {
      loginGlobalErr.textContent = err.message || "Login failed.";
    } finally {
      setLoading("login", false);
      setPageLoading(false);
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading("register", true);
    regGlobalErr.textContent = "";
    try {
      setPageLoading(true, "Creating your account…");
      const username = regUsername.value.trim();
      const email = regEmail.value.trim();
      const pw = regPassword.value;
      const data = await register(username, email, pw);
      setUserSession(data.user);
      window.location.href = "./dashboard.html";
    } catch (err) {
      regGlobalErr.textContent = err.message || "Registration failed.";
    } finally {
      setLoading("register", false);
      setPageLoading(false);
    }
  });

  // Expose logout for dashboard if needed (kept in spec).
  window.MindVaultAuth = { register, login, logout, checkAlreadyLoggedIn };

  applyTheme(getTheme());
  document.body.classList.add("ready");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  checkAlreadyLoggedIn();
  startNeuralBackground();
})();

