# language-coach

从 Claude Code 本地 transcripts 中提取语言学习素材。

## 思路

和 AI 对话时有一种常见时刻：你心里有一个想法，但表达得模糊或不到位；AI 理解了你的意思，用更精准的话把同一个想法说了出来。读到时的感觉是「原来可以这样说」而不是「原来是这样」——前者是表达提升，后者是知识获取。本项目只抓前者。

## 管道

```
1. 提取  scripts/extract.py
   扫 ~/.claude/projects/<proj>/<session>.jsonl
   → data/transcripts-extracted/<sessionId>.md

2. 分析  scripts/analyze.py
   调 pi CLI，用 prompts/analyze.md 分析每个 session
   → data/cards/<sessionId>.json

3. 聚合  scripts/aggregate.py
   合并所有 cards/*.json
   → data/cards.md + data/lexicon.json
```

## 用法

```bash
# 提取：指定项目目录或 .jsonl 文件
python3 scripts/extract.py ~/.claude/projects/<proj>/
python3 scripts/extract.py --all --since 7d

# 分析：默认处理所有已提取但未分析的 session
python3 scripts/analyze.py
python3 scripts/analyze.py --force --limit 10

# 聚合
python3 scripts/aggregate.py
```

## 依赖

- Python 3.10+
- [pi](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)：`npm i -g @earendil-works/pi-coding-agent`，需配置 API key

## 设计要点

- **粒度**：一个 session 处理一次，Agent 看完整对话再挑卡片
- **增量**：state.json 记录 mtime，session 被追加时重处理整个文件
- **判断标准**：这个想法在 AI 开口之前是不是已经在用户脑子里了？是→记录，不是→不记录
- **常见形态**：复述澄清 / 精准用词 / 结构化表达 / 概念命名（不限于此）
- **允许 0 卡片**：多数 session 没学习价值，不强求产出
- **单 session 上限 5 张**

## 目录

- `scripts/` — 提取、分析、聚合脚本
- `prompts/` — 分析阶段的提示词模板
- `data/` — 运行产出（gitignore，不入库）

## 卡片字段

```json
{
  "type": "复述澄清",
  "user_said": "用户原话（保留模糊感）",
  "ai_phrased": "AI 对同一件事的精准说法",
  "takeaway": {
    "vocab": ["关键词1", "关键词2"],
    "pattern": "可迁移的句式（可空）"
  },
  "context_hint": "回忆场景",
  "source_ref": {"user_line": 12, "ai_line": 14}
}
```
