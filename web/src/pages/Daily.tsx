import { useCallback, useEffect, useState } from "react";
import { api, type Card as CardType } from "@/api";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";

const BATCH_SIZE = 8;

export default function Daily() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const c = await api.daily(BATCH_SIZE);
    setCards(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFavorite = async (id: number, value: boolean) => {
    await api.favorite(id, value);
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: value } : c)),
    );
  };

  const handleHide = async (id: number, value: boolean) => {
    await api.hide(id, value);
    if (value) {
      setCards((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, hidden: value } : c)),
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daily Review</h2>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {loading
              ? "loading..."
              : cards.length === 0
                ? "No cards available"
                : `${cards.length} cards · least recently viewed first`}
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          🎲 Shuffle
        </Button>
      </div>

      {/* Stream */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground font-bold text-xl">
          Loading...
        </div>
      ) : cards.length === 0 ? (
        <div className="content-card p-12 text-center">
          <p className="text-xl font-bold mb-2">Nothing to review</p>
          <p className="text-muted-foreground text-sm">
            Run rp to upload transcripts and generate cards, or unhide some hidden cards
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {cards.map((c) => (
            <Card
              key={c.id}
              card={c}
              onFavorite={handleFavorite}
              onHide={handleHide}
            />
          ))}
        </div>
      )}
    </div>
  );
}
