import { readFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

async function run() {
  const connString = process.env.SUPABASE_DB_URL;
  if (!connString) {
    console.error(
      "Set SUPABASE_DB_URL to your Supabase pooled connection string before running."
    );
    process.exit(1);
  }

  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: node scripts/run-migrations.mjs <sqlfile...>");
    process.exit(1);
  }

  const client = new Client({ connectionString: connString });
  await client.connect();
  console.log("Connected.");

  for (const file of files) {
    const sql = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    console.log(`Running ${file} ...`);
    await client.query(sql);
    console.log(`  done.`);
  }

  await client.end();
  console.log("All migrations applied.");
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
