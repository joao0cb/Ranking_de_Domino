import { query } from "./db";

export type AdminUser = { id: string; username: string; created_at: string };

export async function countAdmins(): Promise<number> {
  const rows = await query<{ total: string }>("select count(*)::text as total from admin_users");
  return Number(rows[0]?.total ?? "0");
}

export async function listAdmins(): Promise<AdminUser[]> {
  return query<AdminUser>(
    "select id, username, to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI') as created_at from admin_users order by lower(username)",
  );
}
