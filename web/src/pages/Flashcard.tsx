import { useCallback, useEffect, useState } from "react";
import { api, type Card } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_ACCENT: Record<string, string> = {
  "复述澄清": "border-coral bg-coral/6",
  "精准用词": "border-teal bg-teal/6",
  "结构化表达": "border-yellow bg-yellow/6",
  "概念命名": "border-purple bg-purple/6",
};

export default function Flashcard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cards({ status: "new" }).then((c) => {
      if (c.length === 0) {
        api.cards().then((all) => {
          setCards(all);
          setLoading(false);
        });
      } else {
        setCards(c);
        setLoading(false);
      }
    });
  }, []);

  const current = cards[index];
  const total = cards.length;
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  const next = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  }, [cards.length]);

  const handleReview = async (status: string) => {
    if (!current) return;
    await api.review(current.id, status);
    setCards((prev) =>
      prev.map((c) =>
        c.id === current.id ? { ...c, reviewStatus: status } : c,
      ),
    );
    next();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
        else next();
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")
        setIndex((i) => {
          setFlipped(false);
          return Math.max(i - 1, 0);
        });
      if (flipped && e.key === "1") handleReview("learned");
      if (flipped && e.key === "2") handleReview("learning");
      if (flipped && e.key === "3") handleReview("skipped");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, current, next]);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground font-bold text-xl">
        Loading...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="content-card p-12 text-center max-w-lg mx-auto">
        <p className="text-2xl font-bold mb-2">全部看完了!</p>
        <p className="text-muted-foreground">没有更多卡片了</p>
      </div>
    );
  }

  const accent = TYPE_ACCENT[current.type] || "border-input bg-muted/50";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold mb-1 font-mono">
          <span>
            {index + 1} / {total}
          </span>
          <span>{current.type}</span>
        </div>
        <div className="border border-border bg-card h-3 rounded-sm overflow-hidden">
          <div
            className="h-full bg-foreground rounded-sm transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className="content-card p-8 min-h-[320px] flex flex-col justify-center cursor-pointer select-none"
      >
        {/* Context hint */}
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 text-center">
          {current.contextHint}
        </div>

        {/* Front: userSaid */}
        <div className="text-center mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            你说
          </p>
          <p className="text-xl leading-relaxed text-foreground/60">
            "{current.userSaid}"
          </p>
        </div>

        {/* Back: aiPhrased (revealed) */}
        {flipped ? (
          <div className="text-center animate-[fadeUp_200ms_ease-out]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              可以说
            </p>
            <p className={`text-xl font-semibold leading-relaxed border-2 rounded-md ${accent} p-5 inline-block`}>
              "{current.aiPhrased}"
            </p>

            {(current.vocab.length > 0 || current.pattern) && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-5">
                {current.vocab.map((v) => (
                  <Badge key={v} variant="secondary" className="bg-yellow text-foreground font-bold">
                    {v}
                  </Badge>
                ))}
                {current.pattern && (
                  <Badge variant="secondary" className="bg-lime text-foreground font-mono">
                    {current.pattern}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground/50 text-sm mt-4">
            点击翻转 · space / enter
          </p>
        )}
      </div>

      {/* Actions */}
      {flipped && (
        <div className="flex gap-3 mt-5 justify-center animate-[fadeUp_150ms_ease-out]">
          <Button
            onClick={() => handleReview("learned")}
            className="bg-teal text-white flex-1 max-w-[140px]"
          >
            ✓ 掌握 <kbd className="ml-1 text-[10px] opacity-70">1</kbd>
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleReview("learning")}
            className="bg-yellow text-foreground flex-1 max-w-[140px]"
          >
            ↻ 再看 <kbd className="ml-1 text-[10px] opacity-70">2</kbd>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleReview("skipped")}
            className="flex-1 max-w-[140px]"
          >
            ✕ 跳过 <kbd className="ml-1 text-[10px] opacity-70">3</kbd>
          </Button>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="text-center mt-6 text-[10px] text-muted-foreground/50 font-mono">
        ← prev · space flip · → next · 1/2/3 review
      </div>
    </div>
  );
}
