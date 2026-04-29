from __future__ import annotations

import re
from typing import Any


TASK_KEYWORDS = [
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
]

IDEA_KEYWORDS = [
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
]

WORRY_KEYWORDS = [
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
]


def clamp(n: int, low: int, high: int) -> int:
    return max(low, min(high, n))


def _matches_any_keyword(line: str, keywords: list[str]) -> bool:
    s = line.lower()
    for kw in keywords:
        k = kw.lower()
        if " " in k:
            if k in s:
                return True
        else:
            if re.search(rf"\b{re.escape(k)}\b", s):
                return True
    return False


def categorize(raw_text: str) -> dict[str, Any]:
    tasks: list[str] = []
    ideas: list[str] = []
    worries: list[str] = []
    notes: list[str] = []

    for raw_line in (raw_text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if _matches_any_keyword(line, TASK_KEYWORDS):
            tasks.append(line)
        elif _matches_any_keyword(line, IDEA_KEYWORDS):
            ideas.append(line)
        elif _matches_any_keyword(line, WORRY_KEYWORDS):
            worries.append(line)
        else:
            notes.append(line)

    score = clamp(50 + len(ideas) * 15 + len(notes) * 10 - len(worries) * 20 - len(tasks) * 5, 0, 100)
    return {
        "tasks": tasks,
        "ideas": ideas,
        "worries": worries,
        "notes": notes,
        "clarity_score": score,
    }
