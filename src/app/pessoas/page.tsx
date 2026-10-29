import Link from "next/link";
import { EmptyState, RankBadge } from "@/components/ui";
import { formatDateTime, formatPercent } from "@/lib/format";
import { loadStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const stats = await loadStats();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pessoas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Estatísticas individuais de todos os jogadores cadastrados.
          </p>
        </div>
        <Link href="/" className="text-xs font-semibold text-emerald-700 hover:underline">
          ← Voltar aos rankings
        </Link>
      </section>

      {stats.people.length === 0 ? (
        <EmptyState
          title="Nenhuma pessoa cadastrada"
          description="Cadastre jogadores e partidas pelo painel administrativo."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th w-12">#</th>
                  <th className="th">Jogador</th>
                  <th className="th text-center">Jogos</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">D</th>
                  <th className="th text-center">E</th>
                  <th className="th text-center">% Vitórias</th>
                  <th className="th text-center">Pontos</th>
                  <th className="th text-center">Saldo</th>
                  <th className="th text-center">Média</th>
                  <th className="th text-center">Sequência</th>
                  <th className="th">Melhor dupla</th>
                  <th className="th">Última partida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.people.map((person, index) => (
                  <tr key={person.id} className="transition hover:bg-slate-50/70">
                    <td className="td">
                      <RankBadge position={index + 1} />
                    </td>
                    <td className="td font-medium whitespace-nowrap text-slate-900">
                      <Link href={`/pessoas/${person.id}`} className="hover:text-emerald-700 hover:underline">
                        {person.name}
                      </Link>
                    </td>
                    <td className="td text-center tabular-nums">{person.jogos}</td>
                    <td className="td text-center font-semibold tabular-nums text-emerald-700">{person.vitorias}</td>
                    <td className="td text-center tabular-nums">{person.derrotas}</td>
                    <td className="td text-center tabular-nums">{person.empates}</td>
                    <td className="td text-center tabular-nums">{formatPercent(person.aproveitamento)}</td>
                    <td className="td text-center tabular-nums">{person.pontosFeitos}</td>
                    <td className="td text-center tabular-nums">{person.saldo > 0 ? `+${person.saldo}` : person.saldo}</td>
                    <td className="td text-center tabular-nums">{person.mediaPontos.toFixed(1)}</td>
                    <td className="td text-center">
                      {person.sequencia === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : person.sequencia > 0 ? (
                        <span className="badge-win">{person.sequencia}V</span>
                      ) : (
                        <span className="badge-loss">{Math.abs(person.sequencia)}D</span>
                      )}
                    </td>
                    <td className="td whitespace-nowrap text-slate-600">
                      {person.melhorDupla ? (
                        <span>
                          {person.melhorDupla.nome}
                          <span className="ml-1 text-xs text-slate-400">
                            ({person.melhorDupla.vitorias}/{person.melhorDupla.jogos})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="td whitespace-nowrap text-slate-500">
                      {person.ultimaPartida ? formatDateTime(person.ultimaPartida) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.people.length > 0 ? (
        <p className="text-xs text-slate-400">
          Pontos = pontos marcados pela dupla do jogador. Saldo = pontos marcados menos pontos sofridos.
          Sequência = vitórias (V) ou derrotas (D) consecutivas na partida mais recente.
        </p>
      ) : null}
    </div>
  );
}
