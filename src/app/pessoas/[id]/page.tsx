import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, StatCard } from "@/components/ui";
import { formatDateTime, formatPercent } from "@/lib/format";
import { isBuchuda, loadPeople, loadStats, type Match } from "@/lib/stats";

export const dynamic = "force-dynamic";

type PersonPageProps = { params: Promise<{ id: string }> };

type HistoryRow = {
  match: Match;
  partner: string;
  opponents: string;
  teamScore: number;
  otherScore: number;
  result: "V" | "D";
  buchuda: boolean;
};

function buildHistory(matches: Match[], personId: string): HistoryRow[] {
  const rows: HistoryRow[] = [];

  for (const match of matches) {
    const inA = match.teamA.some((player) => player.id === personId);
    const inB = match.teamB.some((player) => player.id === personId);
    if (!inA && !inB) continue;

    const ownTeam = inA ? match.teamA : match.teamB;
    const otherTeam = inA ? match.teamB : match.teamA;
    const teamScore = inA ? match.scoreA : match.scoreB;
    const otherScore = inA ? match.scoreB : match.scoreA;
    const result: HistoryRow["result"] = teamScore > otherScore ? "V" : "D";

    rows.push({
      match,
      partner: ownTeam
        .filter((player) => player.id !== personId)
        .map((player) => player.name)
        .join(" & ") || "—",
      opponents: otherTeam.map((player) => player.name).join(" & "),
      teamScore,
      otherScore,
      result,
      buchuda: isBuchuda(teamScore, otherScore),
    });
  }

  return rows;
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const [stats, people] = await Promise.all([loadStats(), loadPeople()]);
  const person = people.find((item) => item.id === id);
  if (!person) notFound();

  const personStats = stats.byPersonId.get(id);
  const history = buildHistory(stats.matches, id);
  const duos = stats.duos
    .filter((duo) => duo.jogadorIds.includes(id))
    .sort((a, b) => b.vitorias - a.vitorias || b.jogos - a.jogos || b.saldo - a.saldo);

  const numero = stats.people.findIndex((item) => item.id === id) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/pessoas" className="text-xs font-semibold text-emerald-700 hover:underline">
            ← Pessoas
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{person.name}</h1>
          <p className="text-sm text-slate-500">
            {personStats ? `${numero}º no ranking de pessoas` : "Ainda sem partidas registradas"}
          </p>
        </div>
        {personStats?.sequencia ? (
          <span className={personStats.sequencia > 0 ? "badge-win" : "badge-loss"}>
            Sequência atual: {Math.abs(personStats.sequencia)} {personStats.sequencia > 0 ? "vitória(s)" : "derrota(s)"}
          </span>
        ) : null}
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Jogos" value={personStats?.jogos ?? 0} />
        <StatCard label="Vitórias" value={personStats?.vitorias ?? 0} />
        <StatCard label="Derrotas" value={personStats?.derrotas ?? 0} />
        <StatCard
          label="Buchudas"
          value={personStats?.buchudas ?? 0}
          hint="derrotas de 6 a 0 ou mais"
        />
        <StatCard
          label="% de vitórias"
          value={formatPercent(personStats?.aproveitamento ?? 0)}
          hint="vitórias / jogos"
        />
        <StatCard
          label="Saldo de pontos"
          value={
            personStats ? (personStats.saldo > 0 ? `+${personStats.saldo}` : personStats.saldo) : 0
          }
          hint={personStats ? `${personStats.pontosFeitos} marcados · ${personStats.pontosSofridos} sofridos` : undefined}
        />
        <StatCard
          label="Média por partida"
          value={(personStats?.mediaPontos ?? 0).toFixed(1)}
          hint="pontos marcados por jogo"
        />
        <StatCard
          label="Última partida"
          value={personStats?.ultimaPartida ? formatDateTime(personStats.ultimaPartida) : "—"}
        />
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Duplas</h2>
          <p className="text-xs text-slate-500">Desempenho com cada parceiro</p>
        </div>
        {duos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma dupla formada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Dupla</th>
                  <th className="th text-center">Jogos</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">D</th>
                  <th className="th text-center">Buchudas</th>
                  <th className="th text-center">% Vitórias</th>
                  <th className="th text-center">Saldo</th>
                  <th className="th">Última vez</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {duos.map((duo) => (
                  <tr key={duo.key}>
                    <td className="td font-medium text-slate-900">{duo.nome}</td>
                    <td className="td text-center tabular-nums">{duo.jogos}</td>
                    <td className="td text-center font-semibold tabular-nums text-emerald-700">{duo.vitorias}</td>
                    <td className="td text-center tabular-nums">{duo.derrotas}</td>
                    <td className="td text-center tabular-nums">{duo.buchudas}</td>
                    <td className="td text-center tabular-nums">{formatPercent(duo.aproveitamento)}</td>
                    <td className="td text-center tabular-nums">{duo.saldo > 0 ? `+${duo.saldo}` : duo.saldo}</td>
                    <td className="td whitespace-nowrap text-slate-500">
                      {duo.ultimaPartida ? formatDateTime(duo.ultimaPartida) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Partidas</h2>
          <p className="text-xs text-slate-500">Da mais recente para a mais antiga</p>
        </div>
        {history.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState title="Nenhuma partida registrada" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Data</th>
                  <th className="th">Parceiro</th>
                  <th className="th">Adversários</th>
                  <th className="th text-center">Placar</th>
                  <th className="th text-center">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((row) => (
                  <tr key={row.match.id}>
                    <td className="td whitespace-nowrap text-slate-500">{formatDateTime(row.match.playedAt)}</td>
                    <td className="td text-slate-800">{row.partner}</td>
                    <td className="td text-slate-600">{row.opponents}</td>
                    <td className="td text-center font-semibold tabular-nums text-slate-900">
                      {row.teamScore} × {row.otherScore}
                    </td>
                    <td className="td text-center">
                      {row.result === "V" ? (
                        <span className="badge-win">Vitória</span>
                      ) : (
                        <span className="badge-loss">Derrota</span>
                      )}
                      {row.buchuda ? <span className="badge-buchuda ml-1">Buchuda</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
