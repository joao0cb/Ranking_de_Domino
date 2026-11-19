import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { claimFirstAccountAction } from "../actions";
import { countAdmins } from "@/lib/admin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Primeiro acesso",
  robots: { index: false, follow: false },
};

type FirstAccessPageProps = { searchParams: Promise<{ erro?: string }> };

export default async function FirstAccessPage({ searchParams }: FirstAccessPageProps) {
  const { erro } = await searchParams;
  const session = await getSession();
  const admins = await countAdmins();

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[#10231c]">Criar a primeira conta</h1>
        <p className="mt-1 text-sm text-[#6b7a6d]">
          Esta página só funciona enquanto não existir nenhuma conta administrativa.
        </p>
      </div>

      {erro ? (
        <p className="rounded-lg border border-[#b04a34]/25 bg-[#b04a34]/8 px-3 py-2 text-sm text-[#9c3f2c]">{erro}</p>
      ) : null}

      {admins > 0 && !session ? (
        <div className="card space-y-3 p-5 text-sm text-[#4d5f52]">
          <p>
            Já existe {admins === 1 ? "uma conta cadastrada" : `${admins} contas cadastradas`}. O cadastro
            inicial está encerrado.
          </p>
          <Link href="/acesso" className="btn-primary w-full">
            Ir para o login
          </Link>
        </div>
      ) : (
        <form action={claimFirstAccountAction} className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="username">
              Usuário
            </label>
            <input id="username" name="username" autoComplete="username" className="input" required minLength={3} />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Senha (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="input"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirmar senha
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              className="input"
              required
              minLength={8}
            />
          </div>
          <SubmitButton className="btn-primary w-full" pendingLabel="Criando...">
            Criar conta e entrar
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-xs text-[#8d9a8c]">
        <Link href="/acesso" className="hover:underline">
          Já tenho uma conta
        </Link>
      </p>
    </div>
  );
}
