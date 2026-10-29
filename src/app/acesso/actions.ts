"use server";

import { redirect } from "next/navigation";
import { countAdmins } from "@/lib/admin";
import { isUniqueViolation, query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";

type AdminRow = { id: string; username: string; password_hash: string };

// Limite simples de tentativas (por instância) para dificultar força bruta.
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 10 * 60 * 1000;

function keyOf(username: string) {
  return username.trim().toLowerCase();
}

function isBlocked(username: string): boolean {
  const entry = attempts.get(keyOf(username));
  if (!entry) return false;
  if (entry.blockedUntil > Date.now()) return true;
  if (entry.blockedUntil !== 0) attempts.delete(keyOf(username));
  return false;
}

function registerFailure(username: string) {
  const entry = attempts.get(keyOf(username)) ?? { count: 0, blockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_MS;
    entry.count = 0;
  }
  attempts.set(keyOf(username), entry);
}

export async function loginAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    redirect("/acesso?erro=" + encodeURIComponent("Informe usuário e senha."));
  }

  if (isBlocked(username)) {
    redirect(
      "/acesso?erro=" + encodeURIComponent("Muitas tentativas. Tente novamente em alguns minutos."),
    );
  }

  const rows = await query<AdminRow>(
    "select id, username, password_hash from admin_users where lower(btrim(username)) = lower(btrim($1))",
    [username],
  );
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    registerFailure(username);
    redirect("/acesso?erro=" + encodeURIComponent("Usuário ou senha inválidos."));
  }

  attempts.delete(keyOf(username));
  await createSession(user.id, user.username);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/acesso");
}

export async function claimFirstAccountAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (username.length < 3) {
    redirect("/acesso/primeiro-acesso?erro=" + encodeURIComponent("O usuário precisa ter ao menos 3 caracteres."));
  }
  if (password.length < 8) {
    redirect("/acesso/primeiro-acesso?erro=" + encodeURIComponent("A senha precisa ter ao menos 8 caracteres."));
  }
  if (password !== confirm) {
    redirect("/acesso/primeiro-acesso?erro=" + encodeURIComponent("As senhas não conferem."));
  }

  if ((await countAdmins()) > 0) {
    redirect("/acesso?erro=" + encodeURIComponent("Já existe uma conta configurada. Faça login."));
  }

  try {
    const rows = await query<{ id: string; username: string }>(
      "insert into admin_users (username, password_hash) values ($1, $2) returning id, username",
      [username, hashPassword(password)],
    );
    const created = rows[0];
    await createSession(created.id, created.username);
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirect("/acesso/primeiro-acesso?erro=" + encodeURIComponent("Este usuário já existe."));
    }
    throw error;
  }

  redirect("/admin");
}
