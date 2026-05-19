import { useEffect, useState } from "react";
import { api, type Lexicon as LexiconType } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Lexicon() {
  const [data, setData] = useState<LexiconType | null>(null);
  const [tab, setTab] = useState<"vocab" | "patterns">("vocab");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.lexicon().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant={tab === "vocab" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("vocab")}
          >
            词汇 ({data.vocab.length})
          </Button>
          <Button
            variant={tab === "patterns" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("patterns")}
          >
            句式 ({data.patterns.length})
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{data.cardTotal}</span> 张卡片
        </span>
      </div>

      {/* Vocab list */}
      {tab === "vocab" && (
        <div className="content-card divide-y divide-border overflow-hidden">
          {data.vocab.map((v) => (
            <div key={v.word}>
              <button
                onClick={() =>
                  setExpanded(expanded === v.word ? null : v.word)
                }
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-yellow text-foreground font-bold w-8 h-6 justify-center"
                  >
                    {v.count}
                  </Badge>
                  <span className="font-semibold text-base">{v.word}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {v.sessions.length} session(s)
                </span>
              </button>

              {expanded === v.word && v.examples.length > 0 && (
                <div className="px-5 pb-4 pt-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    例句
                  </p>
                  {v.examples.map((ex, i) => (
                    <p
                      key={i}
                      className="text-sm text-foreground/60 mb-1.5 pl-3 border-l-2 border-border leading-relaxed"
                    >
                      {ex}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {data.vocab.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              暂无词汇数据
            </div>
          )}
        </div>
      )}

      {/* Patterns list */}
      {tab === "patterns" && (
        <div className="content-card divide-y divide-border overflow-hidden">
          {data.patterns.map((p) => (
            <div
              key={p.pattern}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-lime text-foreground font-bold w-8 h-6 justify-center"
                >
                  {p.count}
                </Badge>
                <span className="font-mono text-sm">{p.pattern}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {p.sessions.length} session(s)
              </span>
            </div>
          ))}

          {data.patterns.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              暂无句式数据
            </div>
          )}
        </div>
      )}
    </div>
  );
}
