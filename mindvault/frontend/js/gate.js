(() => {
  const $ = (id) => document.getElementById(id);

  const form = $("gateForm");
  const modeHint = $("modeHint");
  const gateId = $("gateId");
  const gatePassword = $("gatePassword");
  const gateConfirm = $("gateConfirm");
  const confirmWrap = $("confirmWrap");

  const idErr = $("gateIdErr");
  const pwErr = $("gatePasswordErr");
  const cfErr = $("gateConfirmErr");
  const globalErr = $("gateGlobal");
  const resetHint = $("resetHint");

  const LS_ID = "mindvault_gate_id";
  const LS_HASH = "mindvault_gate_hash";
  const SS_OK = "mindvault_gate_ok";

  function qparam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch {
      return null;
    }
  }

  function clearErrors() {
    [idErr, pwErr, cfErr, globalErr].forEach((x) => x && (x.textContent = ""));
  }

  function hasGate() {
    return Boolean(localStorage.getItem(LS_ID) && localStorage.getItem(LS_HASH));
  }

  async function sha256Base64(text) {
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    const bytes = new Uint8Array(digest);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function setModeCreate() {
    confirmWrap.style.display = "block";
    modeHint.textContent = "Create a local ID + password to unlock the dashboard on this device.";
    resetHint.textContent = "";
  }

  function setModeLogin() {
    confirmWrap.style.display = "none";
    const id = localStorage.getItem(LS_ID) || "your ID";
    modeHint.textContent = `Enter your local ID + password to unlock the dashboard. (ID: ${id})`;
    resetHint.innerHTML =
      `Forgot it? <button type="button" id="resetGate" class="btn secondary" style="padding:10px 12px; margin-left:8px">Reset</button>`;
    const btn = $("resetGate");
    if (btn) {
      btn.addEventListener("click", () => {
        localStorage.removeItem(LS_ID);
        localStorage.removeItem(LS_HASH);
        sessionStorage.removeItem(SS_OK);
        window.location.reload();
      });
    }
  }

  async function createGate(id, password, confirm) {
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (password !== confirm) throw new Error("Passwords do not match.");
    const hash = await sha256Base64(`${id}::${password}`);
    localStorage.setItem(LS_ID, id);
    localStorage.setItem(LS_HASH, hash);
    sessionStorage.setItem(SS_OK, "1");
  }

  async function verifyGate(id, password) {
    const storedId = localStorage.getItem(LS_ID);
    const storedHash = localStorage.getItem(LS_HASH);
    if (!storedId || !storedHash) throw new Error("No local gate is set.");
    const hash = await sha256Base64(`${id}::${password}`);
    if (storedId !== id || storedHash !== hash) throw new Error("Invalid local ID or password.");
    sessionStorage.setItem(SS_OK, "1");
  }

  function goNext() {
    const next = qparam("next") || "dashboard.html";
    window.location.href = `./${next.replace(/^\.?\//, "")}`;
  }

  // init
  if (hasGate()) setModeLogin();
  else setModeCreate();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const id = (gateId.value || "").trim();
    const pw = gatePassword.value || "";
    const cf = gateConfirm ? gateConfirm.value || "" : "";

    let ok = true;
    if (!id) {
      idErr.textContent = "Local ID is required.";
      ok = false;
    } else if (id.length < 3 || id.length > 32) {
      idErr.textContent = "Local ID must be 3–32 characters.";
      ok = false;
    }
    if (!pw) {
      pwErr.textContent = "Password is required.";
      ok = false;
    }
    if (!ok) return;

    try {
      if (hasGate()) await verifyGate(id, pw);
      else await createGate(id, pw, cf);
      goNext();
    } catch (err) {
      globalErr.textContent = err?.message || "Couldn’t unlock dashboard.";
    }
  });
})();

