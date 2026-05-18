import type { Card as CardType } from "../api";

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
        <span className="brutal-border brutal-shadow-sm bg-white px-2 py-0.5 text-xs font-bold font-[family-name:var(--font-mono)] uppercase tracking-wider">
          {TYPE_EMOJI[card.type] || "📝"} {card.type}
        </span>
        {card.contextHint && (
          <span className="text-xs text-ink/40 font-[family-name:var(--font-mono)]">
            {card.contextHint}
          </span>
        )}
      </div>

      {/* User said */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-1.5">
          你说
        </div>
        <p className="text-[15px] leading-relaxed text-ink/60">
          "{card.userSaid}"
        </p>
      </div>

      {/* AI phrased */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-1.5">
          可以说
        </div>
        <p className={`text-[17px] leading-relaxed font-semibold text-ink pl-3 border-l-3 ${accent}`}>
          "{card.aiPhrased}"
        </p>
      </div>

      {/* Takeaway */}
      {(card.vocab.length > 0 || card.pattern) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.vocab.map((v) => (
            <span
              key={v}
              className="brutal-border brutal-shadow-sm bg-yellow px-2 py-0.5 text-xs font-bold"
            >
              {v}
            </span>
          ))}
          {card.pattern && (
            <span className="brutal-border brutal-shadow-sm bg-lime px-2 py-0.5 text-xs font-[family-name:var(--font-mono)]">
              {card.pattern}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {onReview && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-ink/8">
          {card.reviewStatus !== "learned" && (
            <button
              onClick={() => onReview(card.id, "learned")}
              className="brutal-btn bg-teal text-white text-xs"
            >
              ✓ 掌握
            </button>
          )}
          {card.reviewStatus !== "learning" && (
            <button
              onClick={() => onReview(card.id, "learning")}
              className="brutal-btn bg-yellow text-ink text-xs"
            >
              ↻ 再看
            </button>
          )}
          {card.reviewStatus !== "skipped" && (
            <button
              onClick={() => onReview(card.id, "skipped")}
              className="brutal-btn bg-white text-ink/50 text-xs"
            >
              ✕ 跳过
            </button>
          )}
        </div>
      )}
    </article>
  );
}
