/**
 * Seed the database with fictional demo data for screenshots.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-demo.ts            # insert (cleans demo data first)
 *   DATABASE_URL=... npx tsx scripts/seed-demo.ts --reset   # wipe ALL data, then insert demo
 *   DATABASE_URL=... npx tsx scripts/seed-demo.ts --clean   # remove demo data only
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const clean = process.argv.includes("--clean");
const reset = process.argv.includes("--reset");
const sql = postgres(url, { max: 1 });

const DEMO_PREFIX = "demo-";

const sessions = [
  {
    id: `${DEMO_PREFIX}code-review-chat`,
    path: "~/.claude/projects/acme-api/sessions/2026-05-12.jsonl",
    mtime: 1747036800,
  },
  {
    id: `${DEMO_PREFIX}data-pipeline-debug`,
    path: "~/.claude/projects/data-pipeline/sessions/2026-05-14.jsonl",
    mtime: 1747209600,
  },
  {
    id: `${DEMO_PREFIX}frontend-refactor`,
    path: "~/.claude/projects/dashboard-v2/sessions/2026-05-16.jsonl",
    mtime: 1747382400,
  },
  {
    id: `${DEMO_PREFIX}system-design-chat`,
    path: "~/.claude/projects/infra-planning/sessions/2026-05-17.jsonl",
    mtime: 1747468800,
  },
  {
    id: `${DEMO_PREFIX}api-integration`,
    path: "~/.claude/projects/payment-service/sessions/2026-05-18.jsonl",
    mtime: 1747555200,
  },
];

interface DemoCard {
  sessionId: string;
  cardIndex: number;
  type: string;
  userSaid: string;
  aiPhrased: string;
  vocab: string[];
  pattern: string;
  contextHint: string;
  userLine: number | null;
  aiLine: number | null;
}

const cards: DemoCard[] = [
  // Session 1: code review
  {
    sessionId: `${DEMO_PREFIX}code-review-chat`,
    cardIndex: 1,
    type: "Paraphrase",
    userSaid: "This function does too many things, it's hard to follow",
    aiPhrased: "The function violates single-responsibility — it mixes validation, transformation, and persistence in one call",
    vocab: ["single-responsibility", "separation of concerns"],
    pattern: "X violates [principle] — it mixes [A], [B], and [C]",
    contextHint: "code review",
    userLine: 24,
    aiLine: 26,
  },
  {
    sessionId: `${DEMO_PREFIX}code-review-chat`,
    cardIndex: 2,
    type: "Concept Naming",
    userSaid: "The old code and new code both exist and you pick which one runs",
    aiPhrased: "That's a feature flag — a runtime toggle that selects between the legacy and refactored code path",
    vocab: ["feature flag", "runtime toggle"],
    pattern: "",
    contextHint: "deployment strategy",
    userLine: 45,
    aiLine: 47,
  },
  {
    sessionId: `${DEMO_PREFIX}code-review-chat`,
    cardIndex: 3,
    type: "Precise Wording",
    userSaid: "The test passes but it doesn't really test anything useful",
    aiPhrased: "It's a vacuous test — it asserts implementation details rather than observable behavior",
    vocab: ["vacuous test", "observable behavior"],
    pattern: "",
    contextHint: "test quality",
    userLine: 78,
    aiLine: 80,
  },

  // Session 2: data pipeline debug
  {
    sessionId: `${DEMO_PREFIX}data-pipeline-debug`,
    cardIndex: 1,
    type: "Structured Expression",
    userSaid: "Sometimes the job runs fine, sometimes it blows up, and I can't tell why",
    aiPhrased: "The failure is non-deterministic: it depends on upstream data volume, not your code — large batches exceed the memory budget while small ones fit",
    vocab: ["non-deterministic", "memory budget"],
    pattern: "The failure is non-deterministic: it depends on [X], not [Y]",
    contextHint: "pipeline debugging",
    userLine: 12,
    aiLine: 14,
  },
  {
    sessionId: `${DEMO_PREFIX}data-pipeline-debug`,
    cardIndex: 2,
    type: "Paraphrase",
    userSaid: "The data comes in but nothing happens until the next run",
    aiPhrased: "You're describing event latency — records land in the staging table but aren't promoted until the next scheduled batch window",
    vocab: ["event latency", "batch window"],
    pattern: "[records] land in [staging] but aren't promoted until [trigger]",
    contextHint: "ETL pipeline",
    userLine: 33,
    aiLine: 35,
  },

  // Session 3: frontend refactor
  {
    sessionId: `${DEMO_PREFIX}frontend-refactor`,
    cardIndex: 1,
    type: "Precise Wording",
    userSaid: "When I click fast the UI shows stale stuff from the previous click",
    aiPhrased: "That's a race condition — the response from the first request arrives after the second, overwriting the newer state",
    vocab: ["race condition", "stale closure"],
    pattern: "The response from [request A] arrives after [request B], overwriting the newer state",
    contextHint: "async UI bug",
    userLine: 56,
    aiLine: 58,
  },
  {
    sessionId: `${DEMO_PREFIX}frontend-refactor`,
    cardIndex: 2,
    type: "Concept Naming",
    userSaid: "I keep copying the same fetch-and-set-state logic into every component",
    aiPhrased: "That's a custom hook — extract the shared fetch-state-error cycle into useQuery or a project-specific hook",
    vocab: ["custom hook", "fetch-state-error cycle"],
    pattern: "",
    contextHint: "React patterns",
    userLine: 89,
    aiLine: 91,
  },
  {
    sessionId: `${DEMO_PREFIX}frontend-refactor`,
    cardIndex: 3,
    type: "Structured Expression",
    userSaid: "The component re-renders all the time even when the data didn't change",
    aiPhrased: "The parent passes a new object reference on every render. The child sees a different prop each time and re-renders — memoize the value or lift it out of the render path",
    vocab: ["referential equality", "memoize"],
    pattern: "[parent] passes a new reference → [child] sees a different prop → re-renders",
    contextHint: "React performance",
    userLine: 102,
    aiLine: 104,
  },

  // Session 4: system design
  {
    sessionId: `${DEMO_PREFIX}system-design-chat`,
    cardIndex: 1,
    type: "Paraphrase",
    userSaid: "We need the system to handle it when one part goes down without everything breaking",
    aiPhrased: "You want graceful degradation — the system continues serving reduced functionality instead of failing entirely when a dependency is unavailable",
    vocab: ["graceful degradation", "partial availability"],
    pattern: "The system continues serving [reduced scope] instead of failing entirely when [dependency] is unavailable",
    contextHint: "system resilience",
    userLine: 15,
    aiLine: 17,
  },
  {
    sessionId: `${DEMO_PREFIX}system-design-chat`,
    cardIndex: 2,
    type: "Precise Wording",
    userSaid: "The service is getting slower as more people use it",
    aiPhrased: "Latency scales linearly with load — you need horizontal scaling or request coalescing to keep p99 stable",
    vocab: ["horizontal scaling", "request coalescing", "p99"],
    pattern: "[metric] scales linearly with [load] — [strategy] to keep [target] stable",
    contextHint: "scaling discussion",
    userLine: 42,
    aiLine: 44,
  },

  // Session 5: API integration
  {
    sessionId: `${DEMO_PREFIX}api-integration`,
    cardIndex: 1,
    type: "Concept Naming",
    userSaid: "I want to slowly move traffic to the new endpoint without switching everyone at once",
    aiPhrased: "That's a canary deployment — route a small percentage of traffic to the new version, monitor error rates, then gradually increase",
    vocab: ["canary deployment", "traffic shifting"],
    pattern: "Route [small %] to [new version], monitor [metric], then gradually increase",
    contextHint: "rollout strategy",
    userLine: 8,
    aiLine: 10,
  },
  {
    sessionId: `${DEMO_PREFIX}api-integration`,
    cardIndex: 2,
    type: "Structured Expression",
    userSaid: "The retry keeps hammering the server when it's already struggling",
    aiPhrased: "Without backoff, retries amplify the overload — exponential backoff with jitter spreads the retry storm across time",
    vocab: ["exponential backoff", "jitter", "retry storm"],
    pattern: "Without [strategy], [action] amplifies [problem] — [solution] spreads [load] across [dimension]",
    contextHint: "API resilience",
    userLine: 31,
    aiLine: 33,
  },
];

interface CardState {
  cardIndex: number;
  sessionId: string;
  viewCount: number;
  favorite: boolean;
  hidden: boolean;
  lastViewedAt: string | null;
}

const states: CardState[] = [
  { sessionId: `${DEMO_PREFIX}code-review-chat`, cardIndex: 1, viewCount: 5, favorite: true, hidden: false, lastViewedAt: "2026-05-18T09:00:00Z" },
  { sessionId: `${DEMO_PREFIX}code-review-chat`, cardIndex: 2, viewCount: 3, favorite: false, hidden: false, lastViewedAt: "2026-05-17T14:00:00Z" },
  { sessionId: `${DEMO_PREFIX}code-review-chat`, cardIndex: 3, viewCount: 1, favorite: false, hidden: true, lastViewedAt: "2026-05-13T10:00:00Z" },
  { sessionId: `${DEMO_PREFIX}data-pipeline-debug`, cardIndex: 1, viewCount: 4, favorite: true, hidden: false, lastViewedAt: "2026-05-18T11:00:00Z" },
  { sessionId: `${DEMO_PREFIX}data-pipeline-debug`, cardIndex: 2, viewCount: 2, favorite: false, hidden: false, lastViewedAt: "2026-05-15T16:00:00Z" },
  { sessionId: `${DEMO_PREFIX}frontend-refactor`, cardIndex: 1, viewCount: 6, favorite: true, hidden: false, lastViewedAt: "2026-05-18T20:00:00Z" },
  { sessionId: `${DEMO_PREFIX}frontend-refactor`, cardIndex: 2, viewCount: 0, favorite: false, hidden: false, lastViewedAt: null },
  { sessionId: `${DEMO_PREFIX}frontend-refactor`, cardIndex: 3, viewCount: 1, favorite: false, hidden: false, lastViewedAt: "2026-05-17T08:00:00Z" },
  { sessionId: `${DEMO_PREFIX}system-design-chat`, cardIndex: 1, viewCount: 3, favorite: true, hidden: false, lastViewedAt: "2026-05-18T15:00:00Z" },
  { sessionId: `${DEMO_PREFIX}system-design-chat`, cardIndex: 2, viewCount: 0, favorite: false, hidden: false, lastViewedAt: null },
  { sessionId: `${DEMO_PREFIX}api-integration`, cardIndex: 1, viewCount: 2, favorite: false, hidden: false, lastViewedAt: "2026-05-19T07:00:00Z" },
  { sessionId: `${DEMO_PREFIX}api-integration`, cardIndex: 2, viewCount: 0, favorite: false, hidden: true, lastViewedAt: null },
];

async function cleanAll() {
  await sql`DELETE FROM card_states`;
  await sql`DELETE FROM cards`;
  await sql`DELETE FROM transcripts`;
  console.log("✓ all data cleared");
}

async function cleanDemo() {
  await sql`DELETE FROM card_states WHERE card_id IN (SELECT id FROM cards WHERE session_id LIKE ${DEMO_PREFIX + "%"})`;
  await sql`DELETE FROM cards WHERE session_id LIKE ${DEMO_PREFIX + "%"}`;
  await sql`DELETE FROM transcripts WHERE session_id LIKE ${DEMO_PREFIX + "%"}`;
  console.log("✓ demo data cleaned");
}

async function seed() {
  if (reset) {
    await cleanAll();
  } else {
    await cleanDemo();
  }

  for (const s of sessions) {
    await sql`
      INSERT INTO transcripts (session_id, source_path, content, transcript_mtime, status, analyzed_mtime, model, uploaded_at, analyzed_at)
      VALUES (${s.id}, ${s.path}, ${"[demo transcript]"}, ${s.mtime}, 'done', ${s.mtime}, 'demo', now() - interval '3 days', now() - interval '2 days')
    `;
  }
  console.log(`✓ ${sessions.length} transcripts inserted`);

  for (const card of cards) {
    await sql`
      INSERT INTO cards (session_id, card_index, type, user_said, ai_phrased, vocab, pattern, context_hint, user_line, ai_line, created_at)
      VALUES (${card.sessionId}, ${card.cardIndex}, ${card.type}, ${card.userSaid}, ${card.aiPhrased},
              ${JSON.stringify(card.vocab)}::jsonb, ${card.pattern}, ${card.contextHint},
              ${card.userLine}, ${card.aiLine}, ${new Date().toISOString()})
    `;
  }
  console.log(`✓ ${cards.length} cards inserted`);

  for (const st of states) {
    const [row] = await sql`
      SELECT id FROM cards WHERE session_id = ${st.sessionId} AND card_index = ${st.cardIndex}
    `;
    if (!row) continue;
    await sql`
      INSERT INTO card_states (card_id, view_count, last_viewed_at, hidden, favorite)
      VALUES (${row.id}, ${st.viewCount}, ${st.lastViewedAt}, ${st.hidden}, ${st.favorite})
    `;
  }
  console.log(`✓ ${states.length} card states inserted`);
}

try {
  if (clean) {
    await cleanDemo();
  } else {
    await seed();
  }
} catch (e) {
  console.error("✗ seed failed:", e);
  process.exit(1);
} finally {
  await sql.end();
}
