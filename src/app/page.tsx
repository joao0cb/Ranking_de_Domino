import Link from "next/link";
import { RankBadge } from "@/components/ui";
import { formatPercent } from "@/lib/format";
import { loadStats, type EloPlayer, type EloSituacao } from "@/lib/stats";

export const dynamic = "force-dynamic";

const SITUACAO: Record<EloSituacao, { label: string; classes: string }> = {
  oficial: {
    label: "Oficial",
    classes: "bg-[#0f5b43]/10 text-[#0c5641] ring-1 ring-[#0f5b43]/20",
  },
  provisorio: {
    label: "Provisório",
    classes: "bg-[#c9922f]/15 text-[#8a6216] ring-1 ring-[#c9922f]/30",
  },
  "nao-classificado": {
    label: "Não classificado",
    classes: "bg-[#10231c]/5 text-[#6b7a6d] ring-1 ring-[#10231c]/10",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Chip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#f7f2e4]/15 bg-[#f7f2e4]/5 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8c2ad]">{label}</p>
      <p className="font-display mt-0.5 text-lg font-semibold text-[#faf6ea]">{value}</p>
    </div>
  );
}

function PodiumCard({ player, index }: { player: EloPlayer; index: number }) {
  const accents = [
    {
      ring: "ring-[#c9922f]/45",
      glow: "from-[#c9922f]/18",
      avatar: "bg-[#f7e5b8] text-[#7a5410]",
      place: "1º lugar",
    },
    {
      ring: "ring-[#9aa5ad]/40",
      glow: "from-[#9aa5ad]/18",
      avatar: "bg-[#eef1f3] text-[#4b5563]",
      place: "2º lugar",
    },
    {
      ring: "ring-[#c8834a]/40",
      glow: "from-[#c8834a]/18",
      avatar: "bg-[#f8e3d1] text-[#8a4d1e]",
      place: "3º lugar",
    },
  ];
  const accent = accents[Math.min(index, 2)];

  return (
    <Link
      href={`/pessoas/${player.id}`}
      className={`group relative overflow-hidden rounded-2xl bg-[#fffdf7] p-5 ring-1 ${accent.ring} transition hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent.glow} to-transparent`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <span
          className={`font-display grid size-11 place-items-center rounded-full text-sm font-bold ${accent.avatar}`}
        >
          {initials(player.name)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d9a8c]">
          {`${player.posicao}º lugar`}
        </span>
      </div>
      <p className="font-display relative mt-3 truncate text-lg font-semibold text-[#10231c] group-hover:text-[#0f5b43]">
        {player.name}
      </p>
      <p className="font-display relative mt-1 text-3xl font-semibold tabular-nums text-[#0f5b43]">
        {Math.round(player.elo)}
        <span className="ml-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8d9a8c]">
          elo
        </span>
      </p>
      <div className="relative mt-3 flex gap-4 text-xs text-[#6b7a6d]">
        <span>
          <strong className="font-semibold text-[#16322a]">{player.vitorias}</strong> V
        </span>
        <span>
          <strong className="font-semibold text-[#16322a]">{player.jogos}</strong> J
        </span>
        <span>
          <strong className="font-semibold text-[#16322a]">{player.buchudasFeitas}</strong> buch.
        </span>
      </div>
    </Link>
  );
}

function EloTable({ players }: { players: EloPlayer[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead className="thead">
          <tr>
            <th className="th w-14">#</th>
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
        <tbody className="divide-y divide-[#eee7d6]">
          {players.map((player) => (
            <tr key={player.id} className="transition hover:bg-[#f7f2e4]">
              <td className="td">
                {player.posicao ? (
                  <RankBadge position={player.posicao} />
                ) : (
                  <span className="text-[#b3bdb0]">—</span>
                )}
              </td>
              <td className="td font-medium whitespace-nowrap text-[#10231c]">
                <Link href={`/pessoas/${player.id}`} className="hover:text-[#0f5b43] hover:underline">
                  {player.name}
                </Link>
              </td>
              <td className="td text-center font-display text-base font-semibold tabular-nums text-[#0f5b43]">
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
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${SITUACAO[player.situacao].classes}`}
                >
                  {SITUACAO[player.situacao].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function EloRankingPage() {
  const stats = await loadStats();
  const { elo, duos, totals } = stats;

  const oficiais = elo.filter((player) => player.situacao === "oficial");
  const foraDoRanking = elo.filter((player) => player.situacao !== "oficial");
  const podio = oficiais.slice(0, 3);
  const lider = oficiais[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#0c231b] px-6 py-9 text-[#f7f2e4] ring-1 ring-[#c9922f]/25 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 88% 12%, rgba(201,146,47,0.55), transparent 34%), radial-gradient(circle at 78% 82%, rgba(15,91,67,0.75), transparent 40%), radial-gradient(rgba(247,242,228,0.16) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 26px 26px",
          }}
        />
        <div className="relative">
          <p className="eyebrow text-[#d9b872]">Liga do Dominó</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Ranking Elo
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[#cfcdbb] sm:text-base">
            A classificação individual da liga: cada partida em dupla move a sua nota de acordo com a
            força dos adversários.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Chip label="Partidas" value={totals.partidas} />
            <Chip label="Jogadores" value={totals.pessoas} />
            <Chip label="Duplas" value={totals.duplas} />
            <Chip label="Líder" value={lider ? lider.name : "—"} />
          </div>
        </div>
      </section>

      {totals.partidas === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold text-[#16322a]">A liga ainda não começou</p>
          <p className="mt-1 text-sm text-[#6b7a6d]">
            Assim que a primeira partida for registrada, o ranking Elo aparece aqui.
          </p>
        </div>
      ) : null}

      {podio.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {podio.map((player, index) => (
            <PodiumCard key={player.id} player={player} index={index} />
          ))}
        </section>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7d6] px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#10231c]">
            Classificação
          </h2>
          <span className="rounded-full bg-[#0f5b43]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0c5641] ring-1 ring-[#0f5b43]/15">
            {oficiais.length} classificado(s)
          </span>
        </div>

        {oficiais.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#6b7a6d]">
            Nenhum jogador alcançou 10 partidas ainda.
          </p>
        ) : (
          <EloTable players={oficiais} />
        )}
      </section>

      {foraDoRanking.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7d6] px-5 py-4">
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#10231c]">
              Em busca de classificação
            </h2>
            <span className="rounded-full bg-[#c9922f]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#8a6216] ring-1 ring-[#c9922f]/30">
              {foraDoRanking.length} jogador(es)
            </span>
          </div>
          <EloTable players={foraDoRanking} />
        </section>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7d6] px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#10231c]">
            Ranking de duplas
          </h2>
          <span className="rounded-full bg-[#c9922f]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#8a6216] ring-1 ring-[#c9922f]/30">
            {duos.length} dupla(s)
          </span>
        </div>

        {duos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#6b7a6d]">Nenhuma dupla formada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="thead">
                <tr>
                  <th className="th w-14">#</th>
                  <th className="th">Dupla</th>
                  <th className="th text-center">J</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">D</th>
                  <th className="th text-center">Buchudas</th>
                  <th className="th text-center">% V</th>
                  <th className="th text-center">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d6]">
                {duos.map((duo, index) => (
                  <tr key={duo.key} className="transition hover:bg-[#f7f2e4]">
                    <td className="td">
                      <RankBadge position={index + 1} />
                    </td>
                    <td className="td font-medium whitespace-nowrap text-[#10231c]">{duo.nome}</td>
                    <td className="td text-center tabular-nums">{duo.jogos}</td>
                    <td className="td text-center font-semibold tabular-nums text-[#0f5b43]">
                      {duo.vitorias}
                    </td>
                    <td className="td text-center tabular-nums">{duo.derrotas}</td>
                    <td className="td text-center tabular-nums">{duo.buchudas}</td>
                    <td className="td text-center tabular-nums">{formatPercent(duo.aproveitamento)}</td>
                    <td className="td text-center tabular-nums">
                      {duo.saldo > 0 ? `+${duo.saldo}` : duo.saldo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7dfc9] bg-[#fffdf7]/70 px-5 py-4">
        <p className="text-sm text-[#6b7a6d]">
          Procurando a pontuação por vitórias e o ranking de pessoas?
        </p>
        <Link
          href="/rankings-antigos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f5b43] hover:underline"
        >
          Ver rankings antigos <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
