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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acesso restrito</h1>
        <p className="mt-1 text-sm text-slate-500">
          Área administrativa para cadastrar pessoas, partidas e contas.
        </p>
      </div>

      {erro ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>
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
        <p className="text-center text-xs text-slate-500">
          Nenhuma conta cadastrada ainda.{" "}
          <Link href="/acesso/primeiro-acesso" className="font-semibold text-emerald-700 hover:underline">
            Criar a primeira conta
          </Link>
        </p>
      ) : null}

      <p className="text-center text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          Voltar para os rankings
        </Link>
      </p>
    </div>
  );
}
