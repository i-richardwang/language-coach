#!/usr/bin/env python3
"""
aggregate.py — 把所有 session 的卡片 JSON 聚合成可浏览的 markdown 和词汇索引。

输入: data/cards/<sessionId>.json
输出:
  data/cards.md       — 所有卡片,按时间倒序的浏览流
  data/lexicon.json   — 词汇/句式的频次索引
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
CARDS_DIR = DATA_DIR / "cards"
STATE_PATH = DATA_DIR / "state.json"
CARDS_MD = DATA_DIR / "cards.md"
LEXICON_JSON = DATA_DIR / "lexicon.json"


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except json.JSONDecodeError:
            pass
    return {}


def load_all_cards() -> list[dict]:
    """读所有 cards/*.json,展开成扁平的卡片列表,附带 session 元信息。"""
    if not CARDS_DIR.exists():
        return []
    state = load_state()
    cards = []
    for cf in sorted(CARDS_DIR.glob("*.json")):
        try:
            data = json.loads(cf.read_text())
        except json.JSONDecodeError:
            print(f"skip unreadable: {cf.name}")
            continue
        session_id = data.get("session_id", cf.stem)
        processed_at = data.get("processed_at", "")
        # session mtime 用作排序依据,反映对话真正发生的时间
        transcript_mtime = state.get(session_id, {}).get("transcript_mtime", 0)
        for i, card in enumerate(data.get("cards", []), 1):
            card_with_meta = dict(card)
            card_with_meta["_session_id"] = session_id
            card_with_meta["_card_index"] = i
            card_with_meta["_processed_at"] = processed_at
            card_with_meta["_transcript_mtime"] = transcript_mtime
            cards.append(card_with_meta)
    return cards


def render_cards_md(cards: list[dict]) -> str:
    """按 transcript_mtime 倒序输出。"""
    cards_sorted = sorted(
        cards, key=lambda c: c.get("_transcript_mtime", 0), reverse=True
    )
    lines = [
        "# 语言学习卡片",
        "",
        f"- 卡片总数: **{len(cards_sorted)}**",
        f"- 生成时间: {datetime.now(timezone.utc).isoformat()}",
        "",
        "---",
        "",
    ]
    for c in cards_sorted:
        sid = c.get("_session_id", "")
        idx = c.get("_card_index", "")
        mtime = c.get("_transcript_mtime", 0)
        mtime_str = (
            datetime.fromtimestamp(mtime, timezone.utc).strftime("%Y-%m-%d")
            if mtime else "?"
        )
        ctype = c.get("type", "?")
        hint = c.get("context_hint", "")
        sref = c.get("source_ref", {}) or {}
        u_line = sref.get("user_line", "?")
        a_line = sref.get("ai_line", "?")

        lines.append(f"## [{ctype}] {hint}")
        lines.append("")
        lines.append(f"- session: `{sid[:8]}` · card #{idx} · {mtime_str} · L{u_line}→L{a_line}")
        lines.append("")
        lines.append(f"**你说**: {c.get('user_said', '')}")
        lines.append("")
        lines.append(f"**可以说**: {c.get('ai_phrased', '')}")
        lines.append("")
        takeaway = c.get("takeaway", {}) or {}
        vocab = takeaway.get("vocab") or []
        pattern = takeaway.get("pattern") or ""
        if vocab:
            lines.append(f"- 词汇: {' · '.join(f'`{v}`' for v in vocab)}")
        if pattern:
            lines.append(f"- 句式: {pattern}")
        lines.append("")
        lines.append("---")
        lines.append("")
    return "\n".join(lines)


def build_lexicon(cards: list[dict]) -> dict:
    """统计词汇和句式频次。返回:
    {
      "vocab": {"词": {"count": n, "sessions": [...], "examples": [...]}},
      "pattern": {"句式": {"count": n, "sessions": [...]}}
    }
    """
    vocab_data: dict = defaultdict(lambda: {"count": 0, "sessions": set(), "examples": []})
    pattern_data: dict = defaultdict(lambda: {"count": 0, "sessions": set()})

    for c in cards:
        sid = c.get("_session_id", "")
        takeaway = c.get("takeaway", {}) or {}
        for v in (takeaway.get("vocab") or []):
            v = v.strip()
            if not v:
                continue
            d = vocab_data[v]
            d["count"] += 1
            d["sessions"].add(sid)
            ex = c.get("ai_phrased", "")
            if ex and len(d["examples"]) < 3:
                d["examples"].append(ex)
        pattern = (takeaway.get("pattern") or "").strip()
        if pattern:
            d = pattern_data[pattern]
            d["count"] += 1
            d["sessions"].add(sid)

    def finalize(data: dict) -> dict:
        result = {}
        for k, v in data.items():
            entry = dict(v)
            entry["sessions"] = sorted(entry["sessions"])
            result[k] = entry
        # 按 count 倒序
        return dict(sorted(result.items(), key=lambda kv: kv[1]["count"], reverse=True))

    return {
        "vocab": finalize(vocab_data),
        "pattern": finalize(pattern_data),
        "card_total": len(cards),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    cards = load_all_cards()
    if not cards:
        print("no cards found in data/cards/")
        return 0

    CARDS_MD.write_text(render_cards_md(cards))
    LEXICON_JSON.write_text(
        json.dumps(build_lexicon(cards), ensure_ascii=False, indent=2)
    )
    print(f"cards: {len(cards)}")
    print(f"  -> {CARDS_MD}")
    print(f"  -> {LEXICON_JSON}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
