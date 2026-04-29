(() => {
  const TASK_KEYWORDS = [
    "submit",
    "finish",
    "complete",
    "do",
    "buy",
    "call",
    "send",
    "deadline",
    "remind",
    "need to",
    "have to",
    "must",
    "pay",
    "fix",
    "update",
    "check",
  ];

  const IDEA_KEYWORDS = [
    "what if",
    "idea",
    "maybe",
    "could",
    "imagine",
    "try",
    "experiment",
    "build",
    "create",
    "invent",
    "consider",
    "propose",
    "think about",
    "design",
  ];

  const WORRY_KEYWORDS = [
    "worried",
    "stress",
    "afraid",
    "scared",
    "nervous",
    "anxious",
    "fear",
    "problem",
    "fail",
    "bad",
    "upset",
    "can't",
    "won't",
    "hate",
    "overwhelmed",
    "panic",
  ];

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function matchesAny(line, keywords) {
    const s = String(line || "").toLowerCase();
    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (k.includes(" ")) {
        if (s.includes(k)) return true;
      } else {
        const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
        if (re.test(s)) return true;
      }
    }
    return false;
  }

  function categorize(rawText) {
    const tasks = [];
    const ideas = [];
    const worries = [];
    const notes = [];

    const lines = String(rawText || "").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (matchesAny(line, TASK_KEYWORDS)) tasks.push(line);
      else if (matchesAny(line, IDEA_KEYWORDS)) ideas.push(line);
      else if (matchesAny(line, WORRY_KEYWORDS)) worries.push(line);
      else notes.push(line);
    }

    const clarity_score = clamp(50 + ideas.length * 15 + notes.length * 10 - worries.length * 20 - tasks.length * 5, 0, 100);
    return { tasks, ideas, worries, notes, clarity_score };
  }

  window.MindVaultCategorizer = { categorize };
})();

