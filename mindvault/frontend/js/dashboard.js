(() => {
  const $ = (id) => document.getElementById(id);

  // Local dashboard gate (separate from app account login).
  // If not unlocked this session, redirect to gate page.
  if (sessionStorage.getItem("mindvault_gate_ok") !== "1") {
    window.location.href = "./gate.html?next=dashboard.html";
    return;
  }

  const dumpInput = $("dumpInput");
  const wordCount = $("wordCount");
  const lineCount = $("lineCount");
  const organizeBtn = $("organizeBtn");
  const clearBtn = $("clearBtn");
  const orgSpin = $("orgSpin");

  const tasksList = $("tasksList");
  const ideasList = $("ideasList");
  const worriesList = $("worriesList");
  const notesList = $("notesList");
  const tasksCount = $("tasksCount");
  const ideasCount = $("ideasCount");
  const worriesCount = $("worriesCount");
  const notesCount = $("notesCount");

  const historyTitle = $("historyTitle");
  const historyList = $("historyList");
  const searchInput = $("searchInput");

  const navUsername = $("navUsername");
  const avatar = $("avatar");
  const logoutBtn = $("logoutBtn");
  const themeToggle = $("themeToggle");
  const themeLabel = $("themeLabel");
  const pageLoader = $("pageLoader");
  const loaderSub = $("loaderSub");

  const modalBackdrop = $("modalBackdrop");
  const cancelDelete = $("cancelDelete");
  const confirmDelete = $("confirmDelete");
  let pendingDeleteId = null;

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

  async function checkAuth() {
    try {
      setPageLoading(true, "Unlocking your vault…");
      const out = await api("/api/auth/me");
      const user = out.user;
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          username: user.username || (user.email ? user.email.split("@")[0] : "User"),
        })
      );
      applyUserUI(user.username || (user.email ? user.email.split("@")[0] : "User"));
      return user;
    } catch (err) {
      sessionStorage.removeItem("user");
      window.location.href = "./index.html";
      return null;
    } finally {
      setPageLoading(false);
    }
  }

  function applyUserUI(username) {
    navUsername.textContent = username || "User";
    const letter = (username || "U").trim().slice(0, 1).toUpperCase() || "U";
    avatar.textContent = letter;
  }

  async function logout() {
    try {
      setPageLoading(true, "Signing you out…");
      await api("/api/auth/logout", { method: "POST" });
    } catch (_) {
      // ignore
    } finally {
      sessionStorage.removeItem("user");
      window.location.href = "./index.html";
    }
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

    const count = Math.floor(Math.max(52, Math.min(110, (w * h) / 20000)));
    const nodes = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.30,
      vy: (Math.random() - 0.5) * 0.30,
      r: 1 + Math.random() * 1.8,
    }));

    function tick() {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        if (pointer.active) {
          const dxp = n.x - pointer.x;
          const dyp = n.y - pointer.y;
          const d2p = dxp * dxp + dyp * dyp;
          const maxp = 190 * 190;
          if (d2p < maxp) {
            const d = Math.sqrt(d2p) || 1;
            const push = (1 - d2p / maxp) * 0.6;
            n.vx += (dxp / d) * push * 0.03;
            n.vy += (dyp / d) * push * 0.03;
          }
        }

        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.985;
        n.vy *= 0.985;
        if (n.x < -30) n.x = w + 30;
        if (n.x > w + 30) n.x = -30;
        if (n.y < -30) n.y = h + 30;
        if (n.y > h + 30) n.y = -30;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const max = 170 * 170;
          if (d2 < max) {
            const t = 1 - d2 / max;
            ctx.strokeStyle = `rgba(0,245,212,${0.065 * t})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = "rgba(255,255,255,.14)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function computeCounts(text) {
    const raw = (text || "").trim();
    if (!raw) return { words: 0, lines: 0 };
    const lines = raw.split("\n").filter((l) => l.trim().length > 0).length;
    const words = raw.split(/\s+/).filter(Boolean).length;
    return { words, lines };
  }

  function updateCounts() {
    const { words, lines } = computeCounts(dumpInput.value);
    wordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;
    lineCount.textContent = `${lines} line${lines === 1 ? "" : "s"}`;
  }

  function setOrganizeLoading(on) {
    organizeBtn.disabled = on;
    orgSpin.style.display = on ? "inline-block" : "none";
  }

  function shimmerTextarea() {
    dumpInput.classList.add("glow");
    setTimeout(() => dumpInput.classList.remove("glow"), 650);
  }

  function clearCategories() {
    const empty = `<div class="empty">Nothing here yet</div>`;
    tasksList.innerHTML = empty;
    ideasList.innerHTML = empty;
    worriesList.innerHTML = empty;
    notesList.innerHTML = empty;
    tasksCount.textContent = "0";
    ideasCount.textContent = "0";
    worriesCount.textContent = "0";
    notesCount.textContent = "0";
    $("scoreValue").textContent = "—";
    $("scoreLabel").textContent = "Waiting for your dump…";
    if (window.animateScore) window.animateScore(0);
  }

  function renderList(container, items) {
    if (!items || items.length === 0) {
      container.innerHTML = `<div class="empty">Nothing here yet</div>`;
      return;
    }
    container.innerHTML = "";
    items.forEach((t, idx) => {
      const div = document.createElement("div");
      div.className = "item";
      div.style.animationDelay = `${Math.min(0.35, idx * 0.05)}s`;
      div.textContent = t;
      container.appendChild(div);
    });
  }

  function renderCategories(dump) {
    const t = dump.tasks || [];
    const i = dump.ideas || [];
    const w = dump.worries || [];
    const n = dump.notes || [];

    tasksCount.textContent = `${t.length}`;
    ideasCount.textContent = `${i.length}`;
    worriesCount.textContent = `${w.length}`;
    notesCount.textContent = `${n.length}`;

    renderList(tasksList, t);
    renderList(ideasList, i);
    renderList(worriesList, w);
    renderList(notesList, n);

    if (window.animateScore) window.animateScore(dump.clarity_score);
  }

  function scorePillClass(score) {
    if (score <= 30) return "low";
    if (score <= 60) return "mid";
    if (score <= 85) return "good";
    return "great";
  }

  function escapeHtml(s) {
    return (s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function timeAgo(dateString) {
    const d = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (Number.isNaN(diff)) return "Just now";
    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }

  function renderHistorySkeleton() {
    historyList.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const div = document.createElement("div");
      div.className = "skeleton";
      historyList.appendChild(div);
    }
  }

  async function loadHistory(search = "") {
    renderHistorySkeleton();
    setPageLoading(true, "Loading past dumps…");
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api(`/api/dumps${qs}`);
      const dumps = res.dumps || [];
      historyTitle.textContent = `Past Dumps (${dumps.length})`;
      historyList.innerHTML = "";

      if (dumps.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = search
          ? "No dumps match your search."
          : "No dumps yet — your organized history will appear here.";
        historyList.appendChild(empty);
        return;
      }

      for (const d of dumps) {
        const card = document.createElement("div");
        card.className = "hist-card";
        card.dataset.id = String(d.id);

        const preview = (d.raw_text || "").replace(/\s+/g, " ").trim().slice(0, 80);
        const score = Number(d.clarity_score || 0);
        const pillClass = scorePillClass(score);

        card.innerHTML = `
        <div class="hist-top">
          <div>
            <div class="hist-time">${escapeHtml(timeAgo(d.created_at))}</div>
            <div class="hist-preview">${escapeHtml(preview || "—")}${(d.raw_text || "").length > 80 ? "…" : ""}</div>
          </div>
          <button class="trash" type="button" aria-label="Delete dump">🗑️</button>
        </div>
        <div class="hist-meta">
          <div class="mini-badges">
            <span>📌 ${d.tasks?.length ?? 0} tasks</span>
            <span>· 💡 ${d.ideas?.length ?? 0} ideas</span>
            <span>· 😟 ${d.worries?.length ?? 0} worries</span>
            <span>· 📝 ${d.notes?.length ?? 0} notes</span>
          </div>
          <div class="pill ${pillClass}">${score}</div>
        </div>
        <div class="accordion" id="acc-${d.id}">
          <div class="cats" style="margin-top:10px">
            <div class="glass cat-card accent-tasks">
              <div class="cat-head">
                <div class="cat-title">📌 Tasks</div>
                <div class="badge">${d.tasks?.length ?? 0}</div>
              </div>
              <div class="list" id="acc-tasks-${d.id}"></div>
            </div>
            <div class="glass cat-card accent-ideas">
              <div class="cat-head">
                <div class="cat-title">💡 Ideas</div>
                <div class="badge">${d.ideas?.length ?? 0}</div>
              </div>
              <div class="list" id="acc-ideas-${d.id}"></div>
            </div>
            <div class="glass cat-card accent-worries">
              <div class="cat-head">
                <div class="cat-title">😟 Worries</div>
                <div class="badge">${d.worries?.length ?? 0}</div>
              </div>
              <div class="list" id="acc-worries-${d.id}"></div>
            </div>
            <div class="glass cat-card accent-notes">
              <div class="cat-head">
                <div class="cat-title">📝 Notes</div>
                <div class="badge">${d.notes?.length ?? 0}</div>
              </div>
              <div class="list" id="acc-notes-${d.id}"></div>
            </div>
          </div>
        </div>
      `;

        const trash = card.querySelector(".trash");
        trash.addEventListener("click", (e) => {
          e.stopPropagation();
          showDeleteModal(d.id);
        });

        card.addEventListener("click", async () => {
          await expandHistoryCard(d.id, card);
        });

        historyList.appendChild(card);
      }
    } catch (err) {
      historyTitle.textContent = "Past Dumps";
      historyList.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = err?.message ? `Couldn’t load history: ${err.message}` : "Couldn’t load history right now.";
      historyList.appendChild(empty);
    } finally {
      setPageLoading(false);
    }
  }

  function renderAccordionLists(dump) {
    const id = dump.id;
    const t = dump.tasks || [];
    const i = dump.ideas || [];
    const w = dump.worries || [];
    const n = dump.notes || [];
    const tEl = $(`acc-tasks-${id}`);
    const iEl = $(`acc-ideas-${id}`);
    const wEl = $(`acc-worries-${id}`);
    const nEl = $(`acc-notes-${id}`);
    if (!tEl || !iEl || !wEl || !nEl) return;

    const fill = (el, arr) => {
      if (!arr || arr.length === 0) {
        el.innerHTML = `<div class="empty">Nothing here yet</div>`;
        return;
      }
      el.innerHTML = arr.map((x) => `<div class="item" style="opacity:1;transform:none;animation:none">${escapeHtml(x)}</div>`).join("");
    };

    fill(tEl, t);
    fill(iEl, i);
    fill(wEl, w);
    fill(nEl, n);
  }

  async function expandHistoryCard(id, cardEl) {
    const already = cardEl.classList.contains("expanded");
    // Collapse others for a clean feel.
    document.querySelectorAll(".hist-card.expanded").forEach((c) => {
      if (c !== cardEl) c.classList.remove("expanded");
    });
    if (already) {
      cardEl.classList.remove("expanded");
      return;
    }
    cardEl.classList.add("expanded");
    const acc = $(`acc-${id}`);
    if (!acc) return;

    // If already rendered once, don't refetch.
    if (acc.dataset.loaded === "true") return;

    acc.innerHTML = `<div class="empty">Loading…</div>`;
    setPageLoading(true, "Fetching dump details…");
    try {
      const res = await api(`/api/dumps/${encodeURIComponent(id)}`);
      const dump = res.dump;
      // Restore accordion template by re-triggering history reload would be heavy; instead just set loaded content.
      // We'll render a compact view if template was replaced.
      acc.innerHTML = `
      <div class="cats" style="margin-top:10px">
        <div class="glass cat-card accent-tasks">
          <div class="cat-head"><div class="cat-title">📌 Tasks</div><div class="badge">${dump.tasks?.length ?? 0}</div></div>
          <div class="list" id="acc-tasks-${dump.id}"></div>
        </div>
        <div class="glass cat-card accent-ideas">
          <div class="cat-head"><div class="cat-title">💡 Ideas</div><div class="badge">${dump.ideas?.length ?? 0}</div></div>
          <div class="list" id="acc-ideas-${dump.id}"></div>
        </div>
        <div class="glass cat-card accent-worries">
          <div class="cat-head"><div class="cat-title">😟 Worries</div><div class="badge">${dump.worries?.length ?? 0}</div></div>
          <div class="list" id="acc-worries-${dump.id}"></div>
        </div>
        <div class="glass cat-card accent-notes">
          <div class="cat-head"><div class="cat-title">📝 Notes</div><div class="badge">${dump.notes?.length ?? 0}</div></div>
          <div class="list" id="acc-notes-${dump.id}"></div>
        </div>
      </div>
    `;
      renderAccordionLists(dump);
      acc.dataset.loaded = "true";
    } catch (err) {
      acc.innerHTML = `<div class="empty">${escapeHtml(err?.message || "Couldn’t load dump details.")}</div>`;
      cardEl.classList.remove("expanded");
    } finally {
      setPageLoading(false);
    }
  }

  function showDeleteModal(id) {
    pendingDeleteId = id;
    modalBackdrop.style.display = "flex";
    modalBackdrop.setAttribute("aria-hidden", "false");
  }

  function hideDeleteModal() {
    pendingDeleteId = null;
    modalBackdrop.style.display = "none";
    modalBackdrop.setAttribute("aria-hidden", "true");
  }

  async function deleteDump(id) {
    await api(`/api/dumps/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async function organizeDump() {
    const raw = (dumpInput.value || "").trim();
    if (!raw) {
      shimmerTextarea();
      dumpInput.focus();
      return;
    }

    setOrganizeLoading(true);
    shimmerTextarea();

    try {
      setPageLoading(true, "Organizing your mind…");
      const cat = window.MindVaultCategorizer?.categorize ? window.MindVaultCategorizer.categorize(raw) : null;
      if (!cat) throw new Error("Categorizer not loaded.");

      const res = await api("/api/dumps", { method: "POST", body: { raw_text: raw } });
      const dump = res.dump;
      renderCategories(dump);
      await loadHistory(searchInput.value.trim());
    } catch (err) {
      // Soft-fail UI
      $("scoreValue").textContent = "—";
      $("scoreLabel").textContent = err.message || "Couldn’t organize right now.";
    } finally {
      setOrganizeLoading(false);
      setPageLoading(false);
    }
  }

  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  dumpInput.addEventListener("input", () => {
    updateCounts();
    // auto-expand
    dumpInput.style.height = "auto";
    dumpInput.style.height = `${Math.min(420, dumpInput.scrollHeight)}px`;
  });

  organizeBtn.addEventListener("click", organizeDump);
  clearBtn.addEventListener("click", () => {
    dumpInput.value = "";
    dumpInput.style.height = "auto";
    updateCounts();
    clearCategories();
  });

  logoutBtn.addEventListener("click", logout);

  searchInput.addEventListener(
    "input",
    debounce(async () => {
      await loadHistory(searchInput.value.trim());
    }, 300)
  );

  cancelDelete.addEventListener("click", hideDeleteModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) hideDeleteModal();
  });
  confirmDelete.addEventListener("click", async () => {
    if (!pendingDeleteId) return hideDeleteModal();
    try {
      setPageLoading(true, "Deleting dump…");
      await deleteDump(pendingDeleteId);
      hideDeleteModal();
      await loadHistory(searchInput.value.trim());
    } catch (_) {
      hideDeleteModal();
    } finally {
      setPageLoading(false);
    }
  });

  // Startup
  (async () => {
    applyTheme(getTheme());
    document.body.classList.add("ready");
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
    startNeuralBackground();
    clearCategories();
    updateCounts();
    await checkAuth();
    await loadHistory("");
  })();
})();

