#!/usr/bin/env python3
"""
extract.py — 从 Claude Code 本地 transcripts 提取对话脚本。

用法:
  extract.py <path>...                 # path 可以是单个 .jsonl 文件 或 项目目录
  extract.py --all                     # 扫 ~/.claude/projects/ 下所有项目
  extract.py <path>... --since 7d      # 只处理 mtime 在 7 天内的 session
  extract.py <path>... --since 2026-05-01
  extract.py <path>... --force         # 忽略增量,强制重处理
  extract.py <path>... --dry-run       # 只列出会处理什么,不写文件

输出: data/transcripts-extracted/<sessionId>.md
状态: data/state.json (mtime-based 增量)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUT_DIR = DATA_DIR / "transcripts-extracted"
STATE_PATH = DATA_DIR / "state.json"
PROJECTS_ROOT = Path.home() / ".claude" / "projects"

SYSTEM_TAG_PATTERN = re.compile(
    r"<(system-reminder|command-name|command-message|command-args|"
    r"local-command-stdout|local-command-stderr|user-prompt-submit-hook|"
    r"session-start-hook)>.*?</\1>",
    re.DOTALL,
)
CAVEAT_PATTERN = re.compile(
    r"Caveat: The messages below were generated.*?(?=\n\n|\Z)", re.DOTALL
)


# ---------- 文本清洗 ----------

def clean_user_text(text: str) -> str:
    text = SYSTEM_TAG_PATTERN.sub("", text)
    text = CAVEAT_PATTERN.sub("", text)
    return text.strip()


def extract_user_text(message: dict) -> str:
    content = message.get("content")
    if isinstance(content, str):
        return clean_user_text(content)
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return clean_user_text("\n".join(parts))
    return ""


def extract_assistant_text(message: dict) -> str:
    content = message.get("content")
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "\n".join(parts).strip()
    return ""


def parse_session(jsonl_path: Path) -> list[dict]:
    messages: list[dict] = []
    with jsonl_path.open() as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            t = obj.get("type")
            if t == "user":
                text = extract_user_text(obj.get("message", {}))
                if text:
                    messages.append({"role": "user", "text": text, "line": i})
            elif t == "assistant":
                text = extract_assistant_text(obj.get("message", {}))
                if text:
                    messages.append({"role": "assistant", "text": text, "line": i})
    return messages


def render_markdown(session_id: str, source_path: Path, messages: list[dict]) -> str:
    lines = [
        f"# Session {session_id}",
        "",
        f"- source: `{source_path}`",
        f"- extracted_at: {datetime.now(timezone.utc).isoformat()}",
        f"- message_count: {len(messages)}",
        "",
        "---",
        "",
    ]
    for msg in messages:
        role_label = "用户" if msg["role"] == "user" else "Claude"
        lines.append(f"### {role_label} (L{msg['line']})")
        lines.append("")
        lines.append(msg["text"])
        lines.append("")
    return "\n".join(lines)


# ---------- 状态 ----------

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


# ---------- 参数解析 ----------

DURATION_RE = re.compile(r"^(\d+)\s*([dhwm])$", re.IGNORECASE)

def parse_since(s: str) -> float:
    """
    解析 --since,返回 unix 时间戳(早于此值的 session 被过滤掉)。
    支持:
      - 相对: 7d / 24h / 2w / 1m  (m=月,按 30 天计算)
      - 绝对: 2026-05-01 / 2026-05-01T12:00
    """
    m = DURATION_RE.match(s.strip())
    if m:
        n, unit = int(m.group(1)), m.group(2).lower()
        mult = {"h": 3600, "d": 86400, "w": 86400 * 7, "m": 86400 * 30}[unit]
        return (datetime.now(timezone.utc) - timedelta(seconds=n * mult)).timestamp()
    # 绝对日期
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except ValueError:
            continue
    raise argparse.ArgumentTypeError(
        f"--since 不能解析: {s!r}  (支持: 7d/24h/2w/1m 或 2026-05-01)"
    )


def collect_jsonl_files(paths: list[Path]) -> list[Path]:
    """从混合的 file/dir 路径里展开成 jsonl 文件列表。"""
    files: list[Path] = []
    for p in paths:
        if not p.exists():
            print(f"  ! not found: {p}", file=sys.stderr)
            continue
        if p.is_file() and p.suffix == ".jsonl":
            files.append(p)
        elif p.is_dir():
            files.extend(sorted(p.glob("*.jsonl")))
        else:
            print(f"  ! 跳过(不是 .jsonl 或目录): {p}", file=sys.stderr)
    # 去重
    return sorted(set(files))


# ---------- 处理 ----------

def process_session(jsonl_path: Path, state: dict, force: bool, dry_run: bool) -> str:
    session_id = jsonl_path.stem
    mtime = jsonl_path.stat().st_mtime

    prev = state.get(session_id)
    if not force and prev and prev.get("transcript_mtime") == mtime:
        return "skipped"

    if dry_run:
        return "would-update"

    messages = parse_session(jsonl_path)
    if not messages:
        state[session_id] = {
            "transcript_mtime": mtime,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "message_count": 0,
            "source": str(jsonl_path),
            "output": None,
        }
        return "empty"

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{session_id}.md"
    out_path.write_text(render_markdown(session_id, jsonl_path, messages))

    state[session_id] = {
        "transcript_mtime": mtime,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "message_count": len(messages),
        "source": str(jsonl_path),
        "output": str(out_path),
    }
    return "updated"


# ---------- 入口 ----------

def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument(
        "paths", nargs="*", type=Path,
        help="一个或多个 .jsonl 文件 或 项目目录",
    )
    ap.add_argument(
        "--all", action="store_true",
        help=f"扫 {PROJECTS_ROOT} 下所有项目目录(谨慎)",
    )
    ap.add_argument(
        "--since", type=parse_since, default=None, metavar="DURATION_OR_DATE",
        help="只处理 mtime 在此时间之后的 session(例 7d / 2026-05-01)",
    )
    ap.add_argument("--force", action="store_true", help="忽略增量,强制重处理")
    ap.add_argument("--dry-run", action="store_true", help="只列出会处理什么,不写文件")
    args = ap.parse_args()

    # 收集路径
    if args.all:
        if args.paths:
            print("error: --all 不能和具体路径同用", file=sys.stderr)
            return 2
        if not PROJECTS_ROOT.is_dir():
            print(f"error: {PROJECTS_ROOT} 不存在", file=sys.stderr)
            return 2
        paths = [p for p in PROJECTS_ROOT.iterdir() if p.is_dir()]
    else:
        if not args.paths:
            ap.print_usage(sys.stderr)
            print(
                "error: 需要至少指定一个路径,或用 --all 扫所有项目",
                file=sys.stderr,
            )
            return 2
        paths = args.paths

    jsonl_files = collect_jsonl_files(paths)
    if not jsonl_files:
        print("没有找到 .jsonl 文件", file=sys.stderr)
        return 1

    # 时间窗口过滤
    if args.since is not None:
        before = len(jsonl_files)
        jsonl_files = [f for f in jsonl_files if f.stat().st_mtime >= args.since]
        since_str = datetime.fromtimestamp(args.since, timezone.utc).isoformat()
        print(f"--since {since_str}: {before} → {len(jsonl_files)} 个 session")

    state = load_state()
    stats = {"updated": 0, "skipped": 0, "empty": 0, "would-update": 0}

    for j in jsonl_files:
        result = process_session(j, state, args.force, args.dry_run)
        stats[result] += 1
        if result != "skipped":
            print(f"  [{result:12s}] {j.name}")

    if not args.dry_run:
        save_state(state)

    print()
    total = sum(stats.values())
    summary = f"total={total}"
    for k in ("updated", "would-update", "empty", "skipped"):
        if stats[k]:
            summary += f"  {k}={stats[k]}"
    print(summary)
    if args.dry_run:
        print("(dry-run: 未写入任何文件)")
    else:
        print(f"output: {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
