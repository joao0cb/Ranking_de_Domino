"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { countAdmins } from "@/lib/admin";
import { isUniqueViolation, query, withTransaction } from "@/lib/db";
import { normalizeDateTimeInput } from "@/lib/format";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireSession } from "@/lib/session";

function refresh() {
  revalidatePath("/");
  revalidatePath("/pessoas");
  revalidatePath("/partidas");
  revalidatePath("/admin");
}

function done(message: string): never {
  refresh();
  redirect(`/admin?ok=${encodeURIComponent(message)}`);
}

function fail(message: string): never {
  redirect(`/admin?erro=${encodeURIComponent(message)}`);
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createPersonAction(formData: FormData): Promise<void> {
  await requireSession();
  const name = text(formData, "name");

  if (name.length < 2) fail("O nome precisa ter ao menos 2 caracteres.");
  if (name.length > 60) fail("O nome pode ter no máximo 60 caracteres.");

  try {
    await query("insert into people (name) values ($1)", [name]);
  } catch (error) {
    if (isUniqueViolation(error)) fail(`Já existe uma pessoa chamada "${name}".`);
    throw error;
  }

  done(`Pessoa "${name}" cadastrada.`);
}

export async function deletePersonAction(formData: FormData): Promise<void> {
  await requireSession();
  const id = text(formData, "id");
  if (!id) fail("Pessoa inválida.");

  const rows = await query<{ total: string; name: string }>(
    `select p.name, (select count(*) from match_players mp where mp.person_id = p.id)::text as total
       from people p where p.id = $1`,
    [id],
  );
  const person = rows[0];
  if (!person) fail("Pessoa não encontrada.");

  if (Number(person.total) > 0) {
    fail(
      `"${person.name}" tem ${person.total} partida(s) registrada(s). Exclua essas partidas antes de remover a pessoa.`,
    );
  }

  await query("delete from people where id = $1", [id]);
  done(`Pessoa "${person.name}" removida.`);
}

export async function createMatchAction(formData: FormData): Promise<void> {
  await requireSession();

  const ids = ["teamA1", "teamA2", "teamB1", "teamB2"].map((key) => text(formData, key));
  if (ids.some((id) => !id)) fail("Selecione os quatro jogadores da partida.");
  if (new Set(ids).size !== 4) fail("Cada jogador só pode aparecer uma vez na partida.");

  const scoreA = Number(text(formData, "scoreA"));
  const scoreB = Number(text(formData, "scoreB"));
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) fail("Os placares precisam ser números inteiros.");
  if (scoreA < 0 || scoreB < 0 || scoreA > 999 || scoreB > 999) fail("Os placares devem ficar entre 0 e 999.");
  if (scoreA === scoreB) fail("Não existe empate: informe placares diferentes para as duas duplas.");

  const playedAt = normalizeDateTimeInput(text(formData, "playedAt")) ?? null;
  if (!playedAt) fail("Informe uma data e hora válidas.");

  const people = await query<{ id: string }>("select id from people where id = any($1::uuid[])", [ids]);
  if (people.length !== 4) fail("Algum dos jogadores selecionados não existe mais. Recarregue a página.");

  await withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      "insert into matches (played_at, team_a_score, team_b_score) values ($1, $2, $3) returning id",
      [playedAt, scoreA, scoreB],
    );
    const matchId = inserted.rows[0].id;
    const values = [
      [matchId, ids[0], "A"],
      [matchId, ids[1], "A"],
      [matchId, ids[2], "B"],
      [matchId, ids[3], "B"],
    ];

    for (const [match, person, team] of values) {
      await client.query("insert into match_players (match_id, person_id, team) values ($1, $2, $3)", [
        match,
        person,
        team,
      ]);
    }
  });

  done(`Partida registrada: ${scoreA} × ${scoreB}.`);
}

export async function deleteMatchAction(formData: FormData): Promise<void> {
  await requireSession();
  const id = text(formData, "id");
  if (!id) fail("Partida inválida.");

  await query("delete from matches where id = $1", [id]);
  done("Partida excluída.");
}

export async function createAccountAction(formData: FormData): Promise<void> {
  await requireSession();
  const username = text(formData, "username");
  const password = String(formData.get("password") ?? "");

  if (username.length < 3) fail("O usuário precisa ter ao menos 3 caracteres.");
  if (username.length > 40) fail("O usuário pode ter no máximo 40 caracteres.");
  if (password.length < 8) fail("A senha precisa ter ao menos 8 caracteres.");

  try {
    await query("insert into admin_users (username, password_hash) values ($1, $2)", [
      username,
      hashPassword(password),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) fail(`O usuário "${username}" já existe.`);
    throw error;
  }

  done(`Conta "${username}" criada.`);
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = text(formData, "id");
  if (!id) fail("Conta inválida.");
  if (id === session.userId) fail("Você não pode excluir a conta que está usando.");

  if ((await countAdmins()) <= 1) fail("É preciso manter ao menos uma conta administrativa.");

  const rows = await query<{ username: string }>("delete from admin_users where id = $1 returning username", [id]);
  if (!rows[0]) fail("Conta não encontrada.");

  done(`Conta "${rows[0].username}" excluída.`);
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 8) fail("A nova senha precisa ter ao menos 8 caracteres.");
  if (next !== confirm) fail("A confirmação da nova senha não confere.");

  const rows = await query<{ password_hash: string }>("select password_hash from admin_users where id = $1", [
    session.userId,
  ]);
  if (!rows[0] || !verifyPassword(current, rows[0].password_hash)) fail("Senha atual incorreta.");

  await query("update admin_users set password_hash = $1 where id = $2", [hashPassword(next), session.userId]);
  done("Senha atualizada.");
}
