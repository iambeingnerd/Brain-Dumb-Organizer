(() => {
  const $ = (id) => document.getElementById(id);

  function colorFor(score) {
    if (score <= 30) return { stroke: "#f43f5e", label: "Heavy fog" };
    if (score <= 60) return { stroke: "#fbbf24", label: "Clearing up" };
    if (score <= 85) return { stroke: "#00f5d4", label: "Focused" };
    return { stroke: "#22c55e", label: "Crystal clear" };
  }

  function animateScore(targetScore) {
    const arc = $("scoreArc");
    const num = $("scoreNum");
    const value = $("scoreValue");
    const label = $("scoreLabel");
    if (!arc || !num) return;

    const score = Math.max(0, Math.min(100, Number(targetScore) || 0));
    const { stroke, label: lbl } = colorFor(score);

    const r = 48;
    const C = 2 * Math.PI * r;
    arc.style.stroke = stroke;
    arc.style.strokeDasharray = `${C}`;
    arc.style.strokeDashoffset = `${C}`;

    const duration = 1200;
    const t0 = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      const e = easeOutCubic(p);
      const current = Math.round(score * e);
      const offset = C * (1 - current / 100);
      arc.style.strokeDashoffset = `${offset}`;
      num.textContent = `${current}`;
      if (value) value.textContent = `${current} / 100`;
      if (label) label.textContent = lbl;
      if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  window.animateScore = animateScore;
})();

