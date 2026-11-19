import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "./actions";
import { countAdmins } from "@/lib/admin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acesso restrito",
  robots: { index: false, follow: false },
};

type LoginPageProps = { searchParams: Promise<{ erro?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;
  const session = await getSession();
  if (session) redirect("/admin");

  const admins = await countAdmins();

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[#10231c]">Acesso restrito</h1>
        <p className="mt-1 text-sm text-[#6b7a6d]">
          Área administrativa para cadastrar pessoas, partidas e contas.
        </p>
      </div>

      {erro ? (
        <p className="rounded-lg border border-[#b04a34]/25 bg-[#b04a34]/8 px-3 py-2 text-sm text-[#9c3f2c]">{erro}</p>
      ) : null}

      <form action={loginAction} className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="username">
            Usuário
          </label>
          <input id="username" name="username" autoComplete="username" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Entrar
        </button>
      </form>

      {admins === 0 ? (
        <p className="text-center text-xs text-[#6b7a6d]">
          Nenhuma conta cadastrada ainda.{" "}
          <Link href="/acesso/primeiro-acesso" className="font-semibold text-[#0f5b43] hover:underline">
            Criar a primeira conta
          </Link>
        </p>
      ) : null}

      <p className="text-center text-xs text-[#8d9a8c]">
        <Link href="/" className="hover:underline">
          Voltar para os rankings
        </Link>
      </p>
    </div>
  );
}
