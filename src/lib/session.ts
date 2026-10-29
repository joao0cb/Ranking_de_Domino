import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "domino_sessao";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type Session = {
  userId: string;
  username: string;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[aviso] SESSION_SECRET não configurado. Usando um segredo derivado de DATABASE_URL. " +
        "Defina SESSION_SECRET nas variáveis de ambiente para maior segurança.",
    );
    return createHash("sha256")
      .update(`${process.env.DATABASE_URL ?? "sem-banco"}::ranking-domino`)
      .digest("hex");
  }

  return "segredo-de-desenvolvimento-nao-use-em-producao";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): Session | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!parsed?.userId || !parsed?.username || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, username: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encode({ userId, username, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decode(token);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/acesso");
  return session;
}
