import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx migrations/run.ts <file.sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const raw = readFileSync(resolve(__dirname, file), "utf8");
// Strip BEGIN/COMMIT (sql.begin wraps in a tx) and split on `;` boundaries.
const statements = raw
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .replace(/\bBEGIN\s*;/gi, "")
  .replace(/\bCOMMIT\s*;/gi, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const client = postgres(url, { max: 1 });

try {
  await client.begin(async (tx) => {
    for (const stmt of statements) {
      await tx.unsafe(stmt);
    }
  });
  console.log(`✓ migration applied: ${file} (${statements.length} statements)`);
} catch (e) {
  console.error("✗ migration failed:", e);
  process.exit(1);
} finally {
  await client.end();
}
