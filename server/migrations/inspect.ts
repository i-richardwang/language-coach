import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

const sql = postgres(url, { max: 1 });

const tables = await sql<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
`;
console.log("tables:");
for (const t of tables) console.log("  -", t.tablename);

for (const { tablename } of tables) {
  const cols = await sql<{ column_name: string; data_type: string }[]>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tablename}
    ORDER BY ordinal_position
  `;
  console.log(`\n${tablename}:`);
  for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);
}

await sql.end();
