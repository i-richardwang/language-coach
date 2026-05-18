import { useEffect, useState } from "react";
import { api, type Lexicon as LexiconType } from "../api";

export default function Lexicon() {
  const [data, setData] = useState<LexiconType | null>(null);
  const [tab, setTab] = useState<"vocab" | "patterns">("vocab");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.lexicon().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="text-center py-20 text-ink/40 font-bold text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("vocab")}
            className={`brutal-btn text-sm ${
              tab === "vocab" ? "bg-ink text-cream" : "bg-cream"
            }`}
          >
            词汇 ({data.vocab.length})
          </button>
          <button
            onClick={() => setTab("patterns")}
            className={`brutal-btn text-sm ${
              tab === "patterns" ? "bg-ink text-cream" : "bg-cream"
            }`}
          >
            句式 ({data.patterns.length})
          </button>
        </div>
        <div className="brutal-border brutal-shadow-sm bg-white px-3 py-1.5 text-sm">
          共 <span className="font-bold">{data.cardTotal}</span> 张卡片
        </div>
      </div>

      {/* Vocab list */}
      {tab === "vocab" && (
        <div className="content-card divide-y divide-ink/6 overflow-hidden">
          {data.vocab.map((v) => (
            <div key={v.word}>
              <button
                onClick={() =>
                  setExpanded(expanded === v.word ? null : v.word)
                }
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-ink/2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="brutal-border brutal-shadow-sm bg-yellow w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                    {v.count}
                  </span>
                  <span className="font-semibold text-lg">{v.word}</span>
                </div>
                <span className="text-xs text-ink/35 font-[family-name:var(--font-mono)]">
                  {v.sessions.length} session(s)
                </span>
              </button>

              {expanded === v.word && v.examples.length > 0 && (
                <div className="px-5 pb-4 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">
                    例句
                  </p>
                  {v.examples.map((ex, i) => (
                    <p
                      key={i}
                      className="text-sm text-ink/60 mb-1.5 pl-3 border-l-2 border-ink/12 leading-relaxed"
                    >
                      {ex}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {data.vocab.length === 0 && (
            <div className="p-8 text-center text-ink/40">
              暂无词汇数据
            </div>
          )}
        </div>
      )}

      {/* Patterns list */}
      {tab === "patterns" && (
        <div className="content-card divide-y divide-ink/6 overflow-hidden">
          {data.patterns.map((p) => (
            <div
              key={p.pattern}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-ink/2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="brutal-border brutal-shadow-sm bg-lime w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                  {p.count}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-sm">
                  {p.pattern}
                </span>
              </div>
              <span className="text-xs text-ink/35 font-[family-name:var(--font-mono)]">
                {p.sessions.length} session(s)
              </span>
            </div>
          ))}

          {data.patterns.length === 0 && (
            <div className="p-8 text-center text-ink/40">
              暂无句式数据
            </div>
          )}
        </div>
      )}
    </div>
  );
}
