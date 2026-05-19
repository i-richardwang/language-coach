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
  onFavorite?: (id: number, value: boolean) => void;
  onHide?: (id: number, value: boolean) => void;
  compact?: boolean;
}

export default function Card({ card, onFavorite, onHide, compact }: CardProps) {
  const style = TYPE_STYLES[card.type] || "";
  const accent = TYPE_ACCENT[card.type] || "border-ink/20";
  const showActions = onFavorite || onHide;

  return (
    <article
      className={`content-card ${style} ${compact ? "p-4" : "p-5"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
          {TYPE_EMOJI[card.type] || "📝"} {card.type}
        </Badge>
        <div className="flex items-center gap-2">
          {card.favorite && (
            <span className="text-xs font-mono text-coral" title="已收藏">
              ★
            </span>
          )}
          {card.contextHint && (
            <span className="text-xs text-muted-foreground font-mono">
              {card.contextHint}
            </span>
          )}
        </div>
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
      {showActions && (
        <div className="flex gap-2 mt-4 pt-3 border-t-2 border-foreground/15 items-center">
          {onFavorite && (
            <Button
              size="sm"
              variant={card.favorite ? "default" : "outline"}
              className={card.favorite ? "bg-coral text-white" : ""}
              onClick={() => onFavorite(card.id, !card.favorite)}
            >
              {card.favorite ? "★ 已收藏" : "☆ 收藏"}
            </Button>
          )}
          {onHide && (
            <Button
              size="sm"
              variant={card.hidden ? "default" : "outline"}
              className={card.hidden ? "bg-foreground text-background" : ""}
              onClick={() => onHide(card.id, !card.hidden)}
            >
              {card.hidden ? "🙈 已隐藏" : "🙈 隐藏"}
            </Button>
          )}
          {card.viewCount > 0 && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              看过 {card.viewCount} 次
            </span>
          )}
        </div>
      )}
    </article>
  );
}
