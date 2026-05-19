import type { Card as CardType } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_STYLES: Record<string, string> = {
  "复述澄清": "card-paraphrase",
  "精准用词": "card-wording",
  "结构化表达": "card-structure",
  "概念命名": "card-naming",
};

const TYPE_EMOJI: Record<string, string> = {
  "复述澄清": "🔄",
  "精准用词": "🎯",
  "结构化表达": "🧱",
  "概念命名": "🏷️",
};

const TYPE_ACCENT: Record<string, string> = {
  "复述澄清": "border-coral",
  "精准用词": "border-teal",
  "结构化表达": "border-yellow",
  "概念命名": "border-purple",
};

interface CardProps {
  card: CardType;
  onReview?: (id: number, status: string) => void;
  compact?: boolean;
}

export default function Card({ card, onReview, compact }: CardProps) {
  const style = TYPE_STYLES[card.type] || "";
  const accent = TYPE_ACCENT[card.type] || "border-ink/20";

  return (
    <article
      className={`content-card ${style} ${compact ? "p-4" : "p-5"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
          {TYPE_EMOJI[card.type] || "📝"} {card.type}
        </Badge>
        {card.contextHint && (
          <span className="text-xs text-muted-foreground font-mono">
            {card.contextHint}
          </span>
        )}
      </div>

      {/* User said */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          你说
        </div>
        <p className="text-[15px] leading-relaxed text-foreground/60">
          "{card.userSaid}"
        </p>
      </div>

      {/* AI phrased */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          可以说
        </div>
        <p className={`text-[17px] leading-relaxed font-semibold text-foreground pl-3 border-l-3 ${accent}`}>
          "{card.aiPhrased}"
        </p>
      </div>

      {/* Takeaway */}
      {(card.vocab.length > 0 || card.pattern) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.vocab.map((v) => (
            <Badge key={v} variant="secondary" className="bg-yellow text-foreground font-bold">
              {v}
            </Badge>
          ))}
          {card.pattern && (
            <Badge variant="secondary" className="bg-lime text-foreground font-mono">
              {card.pattern}
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      {onReview && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          {card.reviewStatus !== "learned" && (
            <Button
              size="sm"
              variant="default"
              className="bg-teal text-white"
              onClick={() => onReview(card.id, "learned")}
            >
              ✓ 掌握
            </Button>
          )}
          {card.reviewStatus !== "learning" && (
            <Button
              size="sm"
              variant="secondary"
              className="bg-yellow text-foreground"
              onClick={() => onReview(card.id, "learning")}
            >
              ↻ 再看
            </Button>
          )}
          {card.reviewStatus !== "skipped" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReview(card.id, "skipped")}
            >
              ✕ 跳过
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
