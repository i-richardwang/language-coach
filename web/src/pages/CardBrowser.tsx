import { useEffect, useState } from "react";
import { api, type Card as CardType, type Stats } from "@/api";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type View = "all" | "favorites" | "hidden";

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "favorites", label: "收藏" },
  { key: "hidden", label: "已隐藏" },
];

export default function CardBrowser() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [view, setView] = useState<View>("all");
  const [filter, setFilter] = useState({ type: "", q: "" });
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    setLoading(true);
    const params: Record<string, string> = { view };
    if (filter.type) params.type = filter.type;
    if (filter.q) params.q = filter.q;
    const [c, s] = await Promise.all([api.cards(params), api.stats()]);
    setCards(c);
    setStats(s);
    setLoading(false);
  };

  useEffect(() => {
    api.types().then(setTypes);
  }, []);

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.type, view]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards();
  };

  const handleFavorite = async (id: number, value: boolean) => {
    await api.favorite(id, value);
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: value } : c)),
    );
  };

  const handleHide = async (id: number, value: boolean) => {
    await api.hide(id, value);
    if (view === "all" && value) {
      // hidden cards leave the "all" view
      setCards((prev) => prev.filter((c) => c.id !== id));
    } else if (view === "hidden" && !value) {
      // unhidden cards leave the "hidden" view
      setCards((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, hidden: value } : c)),
      );
    }
  };

  return (
    <div>
      {/* Stats bar */}
      {stats && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="brutal-border brutal-shadow-sm bg-white px-4 py-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold">{stats.totalCards}</span>
            <span className="text-xs text-muted-foreground">cards</span>
          </div>
          <div className="brutal-border brutal-shadow-sm bg-white px-4 py-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold">{stats.totalSessions}</span>
            <span className="text-xs text-muted-foreground">sessions</span>
          </div>
          <div className="brutal-border brutal-shadow-sm bg-white px-3 py-2 flex items-baseline gap-1 text-sm">
            <span className="font-bold">{stats.favoriteCount}</span>
            <span className="text-muted-foreground">★ 收藏</span>
          </div>
          <div className="brutal-border brutal-shadow-sm bg-white px-3 py-2 flex items-baseline gap-1 text-sm">
            <span className="font-bold">{stats.hiddenCount}</span>
            <span className="text-muted-foreground">🙈 隐藏</span>
          </div>
          {Object.entries(stats.byType).map(([t, n]) => (
            <div
              key={t}
              className="brutal-border brutal-shadow-sm bg-white px-3 py-2 flex items-baseline gap-1 text-sm"
            >
              <span className="font-bold">{n}</span>
              <span className="text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* View tabs + filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1">
          {VIEWS.map((v) => (
            <Button
              key={v.key}
              size="sm"
              variant={view === v.key ? "default" : "outline"}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </Button>
          ))}
        </div>

        <Select
          value={filter.type || undefined}
          onValueChange={(v) =>
            setFilter((f) => ({ ...f, type: v === "__all__" ? "" : (v ?? "") }))
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部类型</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            type="text"
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder="搜索词汇或表达..."
            className="w-[220px]"
          />
          <Button type="submit" variant="default" className="shrink-0">
            Go
          </Button>
        </form>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-bold text-xl">
          Loading...
        </div>
      ) : cards.length === 0 ? (
        <div className="content-card p-12 text-center">
          <p className="text-xl font-bold mb-2">
            {view === "favorites"
              ? "还没有收藏的卡片"
              : view === "hidden"
                ? "没有已隐藏的卡片"
                : "没有卡片"}
          </p>
          <p className="text-muted-foreground text-sm">
            {view === "all"
              ? "运行 extract → analyze → push 来生成卡片"
              : "点击卡片上的按钮可以管理收藏和隐藏"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
