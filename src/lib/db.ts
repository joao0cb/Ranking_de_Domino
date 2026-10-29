import { Pool } from "pg";
import { hashPassword } from "./password";

const globalForDb = globalThis as unknown as {
  dominoPool?: Pool;
  dominoSchema?: Promise<void>;
};

const SCHEMA_SQL = `
  create table if not exists people (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now()
  );

  create unique index if not exists people_name_key on people (lower(btrim(name)));

  create table if not exists matches (
    id uuid primary key default gen_random_uuid(),
    played_at timestamp not null,
    team_a_score integer not null check (team_a_score >= 0),
    team_b_score integer not null check (team_b_score >= 0),
    created_at timestamptz not null default now()
  );

  create table if not exists match_players (
    match_id uuid not null references matches (id) on delete cascade,
    person_id uuid not null references people (id) on delete restrict,
    team text not null check (team in ('A', 'B')),
    primary key (match_id, person_id)
  );

  create index if not exists match_players_person_idx on match_players (person_id);

  create table if not exists admin_users (
    id uuid primary key default gen_random_uuid(),
    username text not null,
    password_hash text not null,
    created_at timestamptz not null default now()
  );

  create unique index if not exists admin_users_username_key on admin_users (lower(btrim(username)));
`;

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Defina a variável de ambiente com a string de conexão do Postgres.",
    );
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL inválida: não foi possível interpretar a URL de conexão.");
  }

  const localHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"];
  if (localHosts.includes(url.hostname)) {
    return new Pool({ connectionString, max: 4 });
  }

  // Bancos gerenciados (Neon, Supabase, Vercel Postgres...) exigem TLS.
  // Removemos o sslmode da URL para não conflitar com a opção `ssl` do driver.
  url.searchParams.delete("sslmode");
  return new Pool({
    connectionString: url.toString(),
    max: 4,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });
}

export function getPool(): Pool {
  if (!globalForDb.dominoPool) {
    globalForDb.dominoPool = createPool();
  }
  return globalForDb.dominoPool;
}

async function bootstrapAdmin(pool: Pool): Promise<void> {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const { rows } = await pool.query<{ total: string }>("select count(*)::text as total from admin_users");
  if (rows[0]?.total !== "0") return;

  await pool.query(
    "insert into admin_users (username, password_hash) values ($1, $2) on conflict do nothing",
    [username, hashPassword(password)],
  );
}

async function init(): Promise<void> {
  const pool = getPool();
  await pool.query(SCHEMA_SQL);
  await bootstrapAdmin(pool);
}

/**
 * Garante que as tabelas existam. Roda uma única vez por processo e é
 * repetido caso a primeira tentativa falhe.
 */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.dominoSchema) {
    globalForDb.dominoSchema = init().catch((error) => {
      globalForDb.dominoSchema = undefined;
      throw error;
    });
  }
  return globalForDb.dominoSchema;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query<T>(text, values);
  return result.rows;
}

export async function withTransaction<T>(run: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}
