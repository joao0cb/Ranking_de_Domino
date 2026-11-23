import { EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { isBuchuda, loadMatches, loadPeople } from "@/lib/stats";

export const dynamic = "force-dynamic";

type MatchesPageProps = { searchParams: Promise<{ pessoa?: string }> };

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const [{ pessoa }, allMatches, people] = await Promise.all([searchParams, loadMatches(), loadPeople()]);

  // Não existe empate: partidas empatadas antigas ficam fora da leitura pública.
  const matches = allMatches.filter((match) => match.scoreA !== match.scoreB);
  const filtered = pessoa
    ? matches.filter((match) => [...match.teamA, ...match.teamB].some((player) => player.id === pessoa))
    : matches;
  const selectedPerson = pessoa ? people.find((person) => person.id === pessoa) : undefined;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#10231c]">Partidas</h1>
          <p className="mt-1 text-sm text-[#6b7a6d]">
            {selectedPerson
              ? `Partidas de ${selectedPerson.name} · ${filtered.length} registro(s)`
              : `${matches.length} partida(s) registrada(s)`}
          </p>
        </div>

        {people.length > 0 ? (
          <form className="flex items-end gap-2" action="/partidas" method="get">
            <div>
              <label className="label" htmlFor="pessoa">
                Filtrar por jogador
              </label>
              <select id="pessoa" name="pessoa" defaultValue={pessoa ?? ""} className="input min-w-44">
                <option value="">Todos</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-ghost">
              Filtrar
            </button>
            {pessoa ? (
              <a href="/partidas" className="px-2 py-2 text-xs font-semibold text-[#6b7a6d] hover:underline">
                Limpar
              </a>
            ) : null}
          </form>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title={selectedPerson ? "Nenhuma partida para este jogador" : "Nenhuma partida registrada"}
          description="As partidas são cadastradas pelo painel administrativo."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((match) => {
            const aWon = match.scoreA > match.scoreB;
            const bWon = !aWon;
            const aBuchuda = isBuchuda(match.scoreA, match.scoreB);
            const bBuchuda = isBuchuda(match.scoreB, match.scoreA);

            return (
              <article key={match.id} className="card px-4 py-4">
                <header className="mb-3 flex items-center justify-between gap-3 text-xs text-[#6b7a6d]">
                  <span>{formatDateTime(match.playedAt)}</span>
                  {aBuchuda || bBuchuda ? <span className="badge-buchuda">Buchuda</span> : null}
                </header>
                <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      aWon ? "bg-[#0f5b43]/8 ring-1 ring-[#0f5b43]/20" : "bg-[#f7f2e4]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#10231c]">
                      {match.teamA.map((player) => player.name).join(" & ")}
                    </p>
                    <p className="text-xs text-[#6b7a6d]">{aWon ? "Vitória" : "Derrota"}</p>
                    <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums">
                      <div className="flex items-baseline gap-1">
                        <dt className="text-[#6b7a6d]">Ganhou</dt>
                        <dd className="font-semibold text-[#0c5641]">{match.scoreA}</dd>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <dt className="text-[#6b7a6d]">Perdeu</dt>
                        <dd className="font-semibold text-[#9c3f2c]">{match.scoreB}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xl font-bold tabular-nums text-[#10231c]">
                    <span className={aWon ? "text-[#0f5b43]" : ""}>{match.scoreA}</span>
                    <span className="text-sm text-[#8d9a8c]">×</span>
                    <span className={bWon ? "text-[#0f5b43]" : ""}>{match.scoreB}</span>
                  </div>

                  <div
                    className={`rounded-xl px-3 py-2 sm:text-right ${
                      bWon ? "bg-[#0f5b43]/8 ring-1 ring-[#0f5b43]/20" : "bg-[#f7f2e4]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#10231c]">
                      {match.teamB.map((player) => player.name).join(" & ")}
                    </p>
                    <p className="text-xs text-[#6b7a6d]">{bWon ? "Vitória" : "Derrota"}</p>
                    <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums sm:justify-end">
                      <div className="flex items-baseline gap-1">
                        <dt className="text-[#6b7a6d]">Ganhou</dt>
                        <dd className="font-semibold text-[#0c5641]">{match.scoreB}</dd>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <dt className="text-[#6b7a6d]">Perdeu</dt>
                        <dd className="font-semibold text-[#9c3f2c]">{match.scoreA}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
