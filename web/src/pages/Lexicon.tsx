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
      <div className="text-center py-20 text-muted-foreground font-bold text-xl">
        Loading...
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
            Vocab ({data.vocab.length})
          </Button>
          <Button
            variant={tab === "patterns" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("patterns")}
          >
            Patterns ({data.patterns.length})
          </Button>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <span className="font-bold">{data.cardTotal}</span>&nbsp;cards total
        </Badge>
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
                  <Badge variant="secondary" className="bg-yellow text-foreground font-bold w-8 h-6 justify-center">
                    {v.count}
                  </Badge>
                  <span className="font-semibold text-lg">{v.word}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {v.sessions.length} session(s)
                </span>
              </button>

              {expanded === v.word && v.examples.length > 0 && (
                <div className="px-5 pb-4 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Examples
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
            <div className="p-8 text-center text-muted-foreground">
              No vocab data yet
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
                <Badge variant="secondary" className="bg-lime text-foreground font-bold w-8 h-6 justify-center">
                  {p.count}
                </Badge>
                <span className="font-mono text-sm">
                  {p.pattern}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {p.sessions.length} session(s)
              </span>
            </div>
          ))}

          {data.patterns.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No pattern data yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
