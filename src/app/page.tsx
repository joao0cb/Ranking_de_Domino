import Link from "next/link";
import { EmptyState, RankBadge, StatCard } from "@/components/ui";
import { formatDateTime, formatPercent, formatShortDate } from "@/lib/format";
import { loadStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const stats = await loadStats();
  const { people, duos, totals } = stats;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Rankings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Calculados automaticamente a cada partida registrada.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Partidas" value={totals.partidas} />
        <StatCard label="Jogadores" value={totals.pessoas} />
        <StatCard label="Duplas" value={totals.duplas} hint="combinações que já jogaram juntas" />
        <StatCard label="Buchudas" value={totals.buchudas} hint="derrotas de 6 a 0 ou mais" />
        <StatCard
          label="Maior placar"
          value={totals.maiorPlacar ? `${totals.maiorPlacar.pontos} pts` : "—"}
          hint={totals.maiorPlacar?.descricao}
        />
        <StatCard
          label="Última partida"
          value={totals.ultimaPartida ? formatShortDate(totals.ultimaPartida) : "—"}
          hint={totals.ultimaPartida ? formatDateTime(totals.ultimaPartida) : "nenhuma partida ainda"}
        />
      </section>

      {totals.partidas === 0 ? (
        <EmptyState
          title="Nenhuma partida registrada ainda"
          description="Assim que a primeira partida for cadastrada, os rankings aparecem aqui automaticamente."
        />
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">Ranking de pessoas</h2>
            <p className="text-xs text-slate-500">Ordenado por partidas ganhas</p>
          </div>
          <Link href="/pessoas" className="text-xs font-semibold text-emerald-700 hover:underline">
            Ver estatísticas completas
          </Link>
        </div>

        {people.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma pessoa cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th w-12">#</th>
                  <th className="th">Jogador</th>
                  <th className="th text-center">J</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">D</th>
                  <th className="th text-center">Buchudas</th>
                  <th className="th text-center">% V</th>
                  <th className="th text-center">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {people.map((person, index) => (
                  <tr key={person.id} className="transition hover:bg-slate-50/70">
                    <td className="td">
                      <RankBadge position={index + 1} />
                    </td>
                    <td className="td font-medium text-slate-900">
                      <Link href={`/pessoas/${person.id}`} className="hover:text-emerald-700 hover:underline">
                        {person.name}
                      </Link>
                    </td>
                    <td className="td text-center tabular-nums">{person.jogos}</td>
                    <td className="td text-center font-semibold tabular-nums text-emerald-700">{person.vitorias}</td>
                    <td className="td text-center tabular-nums">{person.derrotas}</td>
                    <td className="td text-center tabular-nums">{person.buchudas}</td>
                    <td className="td text-center tabular-nums">{formatPercent(person.aproveitamento)}</td>
                    <td className="td text-center tabular-nums">{person.saldo > 0 ? `+${person.saldo}` : person.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">Ranking de duplas</h2>
            <p className="text-xs text-slate-500">
              Cada combinação de dois jogadores, mesmo que joguem com outras pessoas
            </p>
          </div>
        </div>

        {duos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma dupla formada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th w-12">#</th>
                  <th className="th">Dupla</th>
                  <th className="th text-center">J</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">D</th>
                  <th className="th text-center">Buchudas</th>
                  <th className="th text-center">% V</th>
                  <th className="th text-center">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {duos.map((duo, index) => (
                  <tr key={duo.key} className="transition hover:bg-slate-50/70">
                    <td className="td">
                      <RankBadge position={index + 1} />
                    </td>
                    <td className="td font-medium text-slate-900">{duo.nome}</td>
                    <td className="td text-center tabular-nums">{duo.jogos}</td>
                    <td className="td text-center font-semibold tabular-nums text-emerald-700">{duo.vitorias}</td>
                    <td className="td text-center tabular-nums">{duo.derrotas}</td>
                    <td className="td text-center tabular-nums">{duo.buchudas}</td>
                    <td className="td text-center tabular-nums">{formatPercent(duo.aproveitamento)}</td>
                    <td className="td text-center tabular-nums">{duo.saldo > 0 ? `+${duo.saldo}` : duo.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {totals.partidas > 0 ? (
        <p className="text-xs text-slate-400">
          Desempate: vitórias, aproveitamento, partidas jogadas e saldo de pontos. Não há empate: toda
          partida tem vencedor. Buchuda é a derrota de 6 a 0 ou mais. Média de{" "}
          {totals.mediaPontosPorPartida.toFixed(1)} ponto(s) por dupla em cada partida.
        </p>
      ) : null}
    </div>
  );
}
