import Link from "next/link";
import { EmptyState, RankBadge, StatCard } from "@/components/ui";
import { formatPercent } from "@/lib/format";
import { loadStats, type EloPlayer, type EloSituacao } from "@/lib/stats";

export const dynamic = "force-dynamic";

const SITUACAO_LABEL: Record<EloSituacao, string> = {
  oficial: "Oficial",
  provisorio: "Provisório",
  "nao-classificado": "Não classificado",
};

const SITUACAO_CLASSES: Record<EloSituacao, string> = {
  oficial: "bg-emerald-50 text-emerald-700",
  provisorio: "bg-amber-50 text-amber-700",
  "nao-classificado": "bg-slate-100 text-slate-500",
};

function EloTable({ players }: { players: EloPlayer[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead className="bg-slate-50">
          <tr>
            <th className="th w-12">#</th>
            <th className="th">Jogador</th>
            <th className="th text-center">Elo</th>
            <th className="th text-center">J</th>
            <th className="th text-center">V</th>
            <th className="th text-center">D</th>
            <th className="th text-center">% V</th>
            <th className="th text-center">B. feitas</th>
            <th className="th text-center">B. sofridas</th>
            <th className="th text-center">Situação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {players.map((player) => (
            <tr key={player.id} className="transition hover:bg-slate-50/70">
              <td className="td">
                {player.posicao ? <RankBadge position={player.posicao} /> : <span className="text-slate-400">—</span>}
              </td>
              <td className="td font-medium text-slate-900">
                <Link href={`/pessoas/${player.id}`} className="hover:text-emerald-700 hover:underline">
                  {player.name}
                </Link>
              </td>
              <td className="td text-center font-semibold tabular-nums text-emerald-700">
                {Math.round(player.elo)}
              </td>
              <td className="td text-center tabular-nums">{player.jogos}</td>
              <td className="td text-center tabular-nums">{player.vitorias}</td>
              <td className="td text-center tabular-nums">{player.derrotas}</td>
              <td className="td text-center tabular-nums">{formatPercent(player.aproveitamento)}</td>
              <td className="td text-center tabular-nums">{player.buchudasFeitas}</td>
              <td className="td text-center tabular-nums">{player.buchudasSofridas}</td>
              <td className="td text-center">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${SITUACAO_CLASSES[player.situacao]}`}
                >
                  {SITUACAO_LABEL[player.situacao]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function RankingPage() {
  const stats = await loadStats();
  const { people, elo, duos, totals } = stats;

  const eloOficiais = elo.filter((player) => player.situacao === "oficial");
  const eloForaDoRanking = elo.filter((player) => player.situacao !== "oficial");

  const porPontuacao = [...people].sort(
    (a, b) =>
      b.pontuacao - a.pontuacao ||
      b.vitorias - a.vitorias ||
      b.jogos - a.jogos ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Rankings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Calculados automaticamente a cada partida registrada.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Partidas" value={totals.partidas} />
        <StatCard label="Jogadores" value={totals.pessoas} />
        <StatCard label="Duplas" value={totals.duplas} hint="combinações que já jogaram juntas" />
        <StatCard
          label="Maior placar"
          value={totals.maiorPlacar ? `${totals.maiorPlacar.pontos} pts` : "—"}
          hint={totals.maiorPlacar?.descricao}
        />
      </section>

      {totals.partidas === 0 ? (
        <EmptyState
          title="Nenhuma partida registrada ainda"
          description="Assim que a primeira partida for cadastrada, os rankings aparecem aqui automaticamente."
        />
      ) : null}

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Ranking geral</h2>
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
                  <th className="th text-center">V. buchuda</th>
                  <th className="th text-center">Pontuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porPontuacao.map((person, index) => (
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
                    <td className="td text-center tabular-nums">{person.vitorias}</td>
                    <td className="td text-center tabular-nums">{person.vitoriasBuchuda}</td>
                    <td className="td text-center font-semibold tabular-nums text-emerald-700">
                      {person.pontuacao.toFixed(1)}
                    </td>
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
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Ranking Elo individual</h2>
          <p className="text-xs text-slate-500">
            Individual, mesmo com partidas em duplas — mínimo de 10 partidas para a posição oficial.
          </p>
        </div>

        {elo.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma pessoa cadastrada.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            <div>
              {eloOficiais.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum jogador alcançou 10 partidas ainda, então o ranking oficial está vazio.
                </p>
              ) : (
                <EloTable players={eloOficiais} />
              )}
            </div>

            {eloForaDoRanking.length > 0 ? (
              <div>
                <div className="bg-slate-50/60 px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Provisórios e não classificados
                  </h3>
                  <p className="text-xs text-slate-400">5 a 9 partidas: provisório. Até 4: não classificado.</p>
                </div>
                <EloTable players={eloForaDoRanking} />
              </div>
            ) : null}
          </div>
        )}

        <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400">
          Elo inicial 1000, K = 32. A força da dupla é a média do Elo dos dois jogadores; cada um
          recebe a mesma variação. Buchuda (uma dupla zerada) dá +4 ao vencedor e −4 ao perdedor,
          sem valer vitória extra. Vitórias, aproveitamento e confronto direto desempatam.
        </p>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Ranking de duplas</h2>
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
