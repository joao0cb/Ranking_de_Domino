// Verifica a conexão com o banco e mostra um resumo dos dados.
// Uso: npm run db:check
import { readFileSync } from "node:fs";
import { Client } from "pg";

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // arquivo opcional
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não configurada (.env.local ou variável de ambiente).");
  process.exit(1);
}

const client = new Client({ connectionString });

try {
  await client.connect();
  const version = await client.query("select version()");
  console.log("Conectado:", version.rows[0].version.split(",")[0]);

  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log(
    "Tabelas:",
    tables.rows.length ? tables.rows.map((row) => row.table_name).join(", ") : "(nenhuma ainda)",
  );

  if (tables.rows.some((row) => row.table_name === "matches")) {
    const counts = await client.query(
      "select (select count(*) from people) as pessoas, (select count(*) from matches) as partidas, (select count(*) from admin_users) as contas",
    );
    console.log("Registros:", counts.rows[0]);
  }
} catch (error) {
  console.error("Falha na conexão:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
