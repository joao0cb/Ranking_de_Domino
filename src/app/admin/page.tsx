import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/ui";
import { formatDateTime, nowForDateTimeInput } from "@/lib/format";
import { listAdmins } from "@/lib/admin";
import { loadMatches, loadPeople } from "@/lib/stats";
import { requireSession } from "@/lib/session";
import { logoutAction } from "../acesso/actions";
import {
  changePasswordAction,
  createAccountAction,
  createMatchAction,
  createPersonAction,
  deleteAccountAction,
  deleteMatchAction,
  deletePersonAction,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};

type AdminPageProps = { searchParams: Promise<{ ok?: string; erro?: string }> };

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await requireSession();
  const [{ ok, erro }, people, matches, accounts] = await Promise.all([
    searchParams,
    loadPeople(),
    loadMatches(),
    listAdmins(),
  ]);

  const canCreateMatch = people.length >= 4;
  const matchCountByPerson = new Map<string, number>();
  for (const match of matches) {
    for (const player of [...match.teamA, ...match.teamB]) {
      matchCountByPerson.set(player.id, (matchCountByPerson.get(player.id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel administrativo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Logado como <span className="font-semibold text-slate-700">{session.username}</span>. Esta página
            fica em <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/admin</code> e o login em{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/acesso</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-ghost">
            Ver site
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost">
              Sair
            </button>
          </form>
        </div>
      </section>

      {ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {ok}
        </p>
      ) : null}
      {erro ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {erro}
        </p>
      ) : null}

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900">Nova partida</h2>
        <p className="mb-4 text-xs text-slate-500">
          Escolha as duas duplas e o placar final. As duplas podem variar livremente entre partidas.
        </p>

        {canCreateMatch ? (
          <form action={createMatchAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Dupla 1
                </legend>
                <div className="grid gap-2">
                  <select name="teamA1" className="input" required defaultValue="">
                    <option value="" disabled>
                      Jogador 1
                    </option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <select name="teamA2" className="input" required defaultValue="">
                    <option value="" disabled>
                      Jogador 2
                    </option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <div>
                    <label className="label" htmlFor="scoreA">
                      Pontos da dupla 1
                    </label>
                    <input
                      id="scoreA"
                      name="scoreA"
                      type="number"
                      min={0}
                      max={999}
                      className="input"
                      required
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Dupla 2
                </legend>
                <div className="grid gap-2">
                  <select name="teamB1" className="input" required defaultValue="">
                    <option value="" disabled>
                      Jogador 3
                    </option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <select name="teamB2" className="input" required defaultValue="">
                    <option value="" disabled>
                      Jogador 4
                    </option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <div>
                    <label className="label" htmlFor="scoreB">
                      Pontos da dupla 2
                    </label>
                    <input
                      id="scoreB"
                      name="scoreB"
                      type="number"
                      min={0}
                      max={999}
                      className="input"
                      required
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label" htmlFor="playedAt">
                  Data e hora
                </label>
                <input
                  id="playedAt"
                  name="playedAt"
                  type="datetime-local"
                  className="input"
                  defaultValue={nowForDateTimeInput()}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Registrar partida
              </button>
            </div>
          </form>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Cadastre pelo menos 4 pessoas para poder registrar uma partida.
          </p>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Pessoas ({people.length})</h2>
          <p className="text-xs text-slate-500">Apenas o nome é necessário; o id único é gerado automaticamente.</p>
        </div>

        <form action={createPersonAction} className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-56 flex-1">
            <label className="label" htmlFor="name">
              Nome da pessoa
            </label>
            <input
              id="name"
              name="name"
              className="input"
              placeholder="Ex.: Maria"
              required
              minLength={2}
              maxLength={60}
            />
          </div>
          <button type="submit" className="btn-primary">
            Adicionar pessoa
          </button>
        </form>

        {people.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500">Nenhuma pessoa cadastrada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {people.map((person) => {
              const count = matchCountByPerson.get(person.id) ?? 0;
              return (
                <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{person.name}</p>
                    <p className="text-xs text-slate-400">
                      {count === 0 ? "sem partidas" : `${count} partida(s)`} · id {person.id.slice(0, 8)}
                    </p>
                  </div>
                  <form action={deletePersonAction}>
                    <input type="hidden" name="id" value={person.id} />
                    <ConfirmButton message={`Excluir "${person.name}"?`}>Excluir</ConfirmButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Partidas ({matches.length})</h2>
          <p className="text-xs text-slate-500">Excluir uma partida recalcula todos os rankings na hora.</p>
        </div>

        {matches.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Nenhuma partida registrada" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {matches.map((match) => (
              <li key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-semibold">{match.teamA.map((p) => p.name).join(" & ")}</span>
                    <span className="mx-2 font-bold tabular-nums">
                      {match.scoreA} × {match.scoreB}
                    </span>
                    <span className="font-semibold">{match.teamB.map((p) => p.name).join(" & ")}</span>
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(match.playedAt)}</p>
                </div>
                <form action={deleteMatchAction}>
                  <input type="hidden" name="id" value={match.id} />
                  <ConfirmButton
                    message={`Excluir a partida de ${formatDateTime(match.playedAt)}?`}
                  >
                    Excluir
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Contas de acesso ({accounts.length})</h2>
          <p className="text-xs text-slate-500">
            Só quem tem conta consegue cadastrar ou excluir pessoas e partidas. O público continua só lendo.
          </p>
        </div>

        <form action={createAccountAction} className="grid gap-3 border-b border-slate-100 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="new-username">
              Novo usuário
            </label>
            <input id="new-username" name="username" className="input" required minLength={3} maxLength={40} />
          </div>
          <div>
            <label className="label" htmlFor="new-password">
              Senha (mínimo 8 caracteres)
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              className="input"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary">
            Criar conta
          </button>
        </form>

        <ul className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {account.username}
                  {account.id === session.userId ? (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      você
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-400">criada em {formatDateTime(account.created_at)}</p>
              </div>
              {account.id === session.userId ? null : (
                <form action={deleteAccountAction}>
                  <input type="hidden" name="id" value={account.id} />
                  <ConfirmButton message={`Excluir a conta "${account.username}"?`}>Excluir</ConfirmButton>
                </form>
              )}
            </li>
          ))}
        </ul>

        <form action={changePasswordAction} className="grid gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="current">
              Senha atual
            </label>
            <input id="current" name="current" type="password" className="input" required autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="next">
              Nova senha
            </label>
            <input id="next" name="next" type="password" className="input" required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">
              Confirmar nova senha
            </label>
            <input
              id="confirm-password"
              name="confirm"
              type="password"
              className="input"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-ghost">
            Trocar senha
          </button>
        </form>
      </section>
    </div>
  );
}
