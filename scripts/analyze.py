#!/usr/bin/env python3
"""
analyze.py — 调用 pi CLI 把每个 session 的对话脚本分析成语言学习卡片。

用法:
  analyze.py                              # 处理 state 里所有已提取但未分析的 session
  analyze.py <md_path>...                 # 指定一个或多个 transcript markdown 文件
  analyze.py --force                      # 重跑所有(忽略 analyzed_mtime)
  analyze.py --dry-run                    # 只列出会处理什么
  analyze.py --model <pattern>            # 覆盖 pi 默认模型(如 sonnet:high)
  analyze.py --limit <N>                  # 最多处理 N 个,便于试跑

依赖: pi (npm: @earendil-works/pi-coding-agent),并配置好 API key。
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
EXTRACTED_DIR = DATA_DIR / "transcripts-extracted"
CARDS_DIR = DATA_DIR / "cards"
STATE_PATH = DATA_DIR / "state.json"
PROMPT_TEMPLATE = PROJECT_ROOT / "prompts" / "analyze.md"

DEFAULT_TIMEOUT_SEC = 180

JSON_CODE_FENCE = re.compile(
    r"```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```", re.DOTALL
)


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except json.JSONDecodeError:
            pass
    return {}


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2))


def parse_json_output(raw: str) -> list[dict]:
    """从 pi 输出中提取 JSON 数组。容忍代码块包裹和前后空白。"""
    raw = raw.strip()
    if not raw:
        raise ValueError("pi 返回为空")

    # 1. 直接尝试
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            return [parsed]
    except json.JSONDecodeError:
        pass

    # 2. 尝试从 ```json...``` 代码块抓
    m = JSON_CODE_FENCE.search(raw)
    if m:
        try:
            parsed = json.loads(m.group(1))
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                return [parsed]
        except json.JSONDecodeError:
            pass

    # 3. 尝试找首个 [ 到末尾 ]
    start = raw.find("[")
    end = raw.rfind("]")
    if start != -1 and end > start:
        try:
            parsed = json.loads(raw[start : end + 1])
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass

    raise ValueError(f"无法从 pi 输出解析出 JSON: {raw[:200]!r}")


def build_prompt(template: str, transcript: str) -> str:
    if "{{TRANSCRIPT}}" not in template:
        raise ValueError("prompts/analyze.md 缺少 {{TRANSCRIPT}} 占位符")
    return template.replace("{{TRANSCRIPT}}", transcript)


def call_pi(prompt: str, model: str | None, timeout: int) -> str:
    cmd = ["pi", "-p", "--no-tools", "--no-session"]
    if model:
        cmd += ["--model", model]
    cmd.append(prompt)
    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=timeout
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"pi 返回非 0 ({result.returncode}): {result.stderr.strip()[:300]}"
        )
    return result.stdout


def find_session_meta(state: dict, md_path: Path) -> tuple[str, dict | None]:
    """根据 markdown 文件名(<sid>.md)找到 state 里对应条目。"""
    session_id = md_path.stem
    return session_id, state.get(session_id)


def needs_analysis(meta: dict | None, force: bool) -> bool:
    """已提取且 (从未分析过 / 转录文件 mtime 变了 / --force)。"""
    if force:
        return True
    if not meta:
        return False
    if not meta.get("output"):
        return False
    analyzed_mtime = meta.get("analyzed_mtime")
    if analyzed_mtime is None:
        return True
    return analyzed_mtime != meta.get("transcript_mtime")


def collect_targets(
    explicit_paths: list[Path], state: dict, force: bool
) -> list[Path]:
    if explicit_paths:
        expanded: list[Path] = []
        for p in explicit_paths:
            if not p.exists():
                print(f"  ! not found: {p}", file=sys.stderr)
                continue
            if p.is_dir():
                expanded.extend(sorted(p.glob("*.md")))
            elif p.suffix == ".md":
                expanded.append(p)
            else:
                print(f"  ! 跳过(非 .md): {p}", file=sys.stderr)
        return sorted(set(expanded))

    # 默认: 扫 state 找已提取但需要分析的
    targets: list[Path] = []
    for sid, meta in state.items():
        out = meta.get("output")
        if not out:
            continue
        if needs_analysis(meta, force):
            targets.append(Path(out))
    return sorted(targets)


def process(
    md_path: Path,
    state: dict,
    template: str,
    *,
    model: str | None,
    timeout: int,
    dry_run: bool,
) -> tuple[str, str]:
    """返回 (status, detail)。status: analyzed/empty/skipped/error/would-analyze"""
    session_id, meta = find_session_meta(state, md_path)
    if meta is None:
        return "error", "state 中无此 session,先跑 extract.py"

    if dry_run:
        return "would-analyze", ""

    transcript = md_path.read_text()
    prompt = build_prompt(template, transcript)

    try:
        raw = call_pi(prompt, model=model, timeout=timeout)
    except subprocess.TimeoutExpired:
        meta["analysis_error"] = f"timeout({timeout}s)"
        meta["analyzed_at"] = datetime.now(timezone.utc).isoformat()
        return "error", f"timeout({timeout}s)"
    except RuntimeError as e:
        meta["analysis_error"] = str(e)
        meta["analyzed_at"] = datetime.now(timezone.utc).isoformat()
        return "error", str(e)

    try:
        cards = parse_json_output(raw)
    except ValueError as e:
        meta["analysis_error"] = str(e)
        meta["analyzed_at"] = datetime.now(timezone.utc).isoformat()
        return "error", str(e)

    # 写卡片文件
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CARDS_DIR / f"{session_id}.json"
    out_path.write_text(
        json.dumps(
            {
                "session_id": session_id,
                "source_path": meta.get("source"),
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "model": model or "(pi default)",
                "card_count": len(cards),
                "cards": cards,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    # 更新 state
    meta["analyzed_at"] = datetime.now(timezone.utc).isoformat()
    meta["analyzed_mtime"] = meta.get("transcript_mtime")
    meta["card_count"] = len(cards)
    meta["card_output"] = str(out_path)
    meta.pop("analysis_error", None)

    if len(cards) == 0:
        return "empty", "0 cards"
    return "analyzed", f"{len(cards)} cards"


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument(
        "paths", nargs="*", type=Path,
        help="transcript markdown 文件(默认: 处理 state 中所有需要分析的)",
    )
    ap.add_argument("--force", action="store_true", help="重跑,忽略增量")
    ap.add_argument("--dry-run", action="store_true", help="只列出会处理什么")
    ap.add_argument("--model", default=None, help="覆盖 pi 默认模型(如 sonnet:high)")
    ap.add_argument(
        "--timeout", type=int, default=DEFAULT_TIMEOUT_SEC,
        help=f"每次 pi 调用超时(秒,默认 {DEFAULT_TIMEOUT_SEC})",
    )
    ap.add_argument("--limit", type=int, default=None, help="最多处理 N 个")
    args = ap.parse_args()

    if not PROMPT_TEMPLATE.exists():
        print(f"error: 缺少提示词模板 {PROMPT_TEMPLATE}", file=sys.stderr)
        return 2
    template = PROMPT_TEMPLATE.read_text()

    state = load_state()
    targets = collect_targets(args.paths, state, args.force)
    if args.limit:
        targets = targets[: args.limit]

    if not targets:
        print("没有需要分析的 session(state.json 中所有已提取的都分析过了)")
        return 0

    print(f"待处理: {len(targets)} 个 session")
    if args.dry_run:
        for p in targets:
            print(f"  [would-analyze] {p.name}")
        return 0

    stats = {"analyzed": 0, "empty": 0, "error": 0}
    for i, md_path in enumerate(targets, 1):
        print(f"  [{i}/{len(targets)}] {md_path.name} ...", end=" ", flush=True)
        status, detail = process(
            md_path, state, template,
            model=args.model, timeout=args.timeout, dry_run=False,
        )
        stats[status if status in stats else "error"] += 1
        if status == "error":
            print(f"ERROR — {detail}")
        else:
            print(f"{status} ({detail})")
        # 每个 session 处理完立即保存,防中断丢失
        save_state(state)

    print()
    print(f"analyzed={stats['analyzed']}  empty={stats['empty']}  error={stats['error']}")
    print(f"cards: {CARDS_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
