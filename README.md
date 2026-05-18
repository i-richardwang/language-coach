# language-coach

从 Claude Code 本地 transcripts 中提取语言学习素材，提升中文表达水平和词汇量。

## 思路

利用与 AI 对话时的一个常见现象：用户表达模糊 → AI 复述精准。这些复述刚好踩在"想得到但说不出"的边界，是最有效的语言学习素材。

## 管道

```
1. 提取（确定性脚本）
   扫 ~/.claude/projects/<proj>/<session>.jsonl
   → 输出 data/transcripts-extracted/<sessionId>.md（Markdown 对话脚本）

2. 分析（Agent / LLM）
   读一个 session 的对话脚本，按"值得学习"标准挑卡片
   → 输出 data/cards/<sessionId>.json

3. 聚合（确定性脚本）
   合并所有 cards/*.json
   → 输出 data/cards.md（浏览/复习）
   → 输出 data/lexicon.json（词汇/句式频次索引）
```

## 设计要点

- **粒度**：一个 session 处理一次，Agent 看完整对话再挑卡片
- **增量**：state.json 记录 mtime，session 被追加时重处理整个文件
- **卡片四类**：复述澄清 / 精准用词 / 结构化表达 / 概念命名
- **允许 0 卡片**：多数 session 没学习价值，不强求产出
- **单 session 上限 5 张**：避免稀释

## 目录

- `scripts/` — 提取和聚合脚本（确定性，无 LLM 调用）
- `prompts/` — 给 Agent 的提示词模板
- `data/transcripts-extracted/` — 提取出的对话脚本（Markdown）
- `data/cards/` — Agent 产出的卡片（每 session 一份 JSON）
- `data/cards.md` — 聚合后的卡片流
- `data/lexicon.json` — 词汇/句式索引
- `data/state.json` — 处理状态（去重/增量）

## 卡片字段

```json
{
  "id": "<session_id>-<index>",
  "type": "复述澄清 | 精准用词 | 结构化表达 | 概念命名",
  "user_said": "用户原话",
  "ai_phrased": "AI 的精准表达",
  "takeaway": {
    "vocab": ["关键词1", "关键词2"],
    "pattern": "可迁移的句式描述"
  },
  "context_hint": "帮助回忆场景的一句话",
  "source_ref": {"jsonl_line": 7, "timestamp": "..."}
}
```
