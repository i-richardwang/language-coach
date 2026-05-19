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

export default function CardBrowser() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [filter, setFilter] = useState({ type: "", status: "", q: "" });
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter.type) params.type = filter.type;
    if (filter.status) params.status = filter.status;
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
  }, [filter.type, filter.status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards();
  };

  const handleReview = async (id: number, status: string) => {
    await api.review(id, status);
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, reviewStatus: status } : c)),
    );
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

      {/* Filter bar — flat row, all controls aligned at h-8 */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3 mb-6 flex-wrap"
      >
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

        <Select
          value={filter.status || undefined}
          onValueChange={(v) =>
            setFilter((f) => ({
              ...f,
              status: v === "__all__" ? "" : (v ?? ""),
            }))
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="learned">Learned</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
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
        </div>
      </form>

      {/* Card grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-bold text-xl">
          Loading...
        </div>
      ) : cards.length === 0 ? (
        <div className="content-card p-12 text-center">
          <p className="text-xl font-bold mb-2">没有卡片</p>
          <p className="text-muted-foreground text-sm">
            运行 extract → analyze → push 来生成卡片
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c) => (
            <Card key={c.id} card={c} onReview={handleReview} />
          ))}
        </div>
      )}
    </div>
  );
}
