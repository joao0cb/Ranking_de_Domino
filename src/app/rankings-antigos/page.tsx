import Link from "next/link";
import { EmptyState, RankBadge } from "@/components/ui";
import { formatPercent } from "@/lib/format";
import { loadStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rankings antigos" };

export default async function OldRankingsPage() {
  const stats = await loadStats();
  const { people } = stats;

  const porPontuacao = [...people].sort(
    (a, b) =>
      b.pontuacao - a.pontuacao ||
      b.vitorias - a.vitorias ||
      b.jogos - a.jogos ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-[#8a6216]">Histórico da liga</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[#10231c] sm:text-4xl">
            Rankings antigos
          </h1>
          <p className="mt-1 text-sm text-[#6b7a6d]">
            As classificações anteriores à chegada do Elo continuam guardadas aqui.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-[#ddd3ba] bg-[#fffdf7] px-4 py-2 text-xs font-semibold text-[#243b31] transition hover:border-[#c9bda0] hover:bg-[#f7f2e4]"
        >
          ← Ranking Elo
        </Link>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7d6] px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#10231c]">
            Ranking geral
          </h2>
          <span className="rounded-full bg-[#0f5b43]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0c5641] ring-1 ring-[#0f5b43]/15">
            por pontuação
          </span>
        </div>

        {people.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Nenhuma pessoa cadastrada" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="thead">
                <tr>
                  <th className="th w-14">#</th>
                  <th className="th">Jogador</th>
                  <th className="th text-center">J</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">V. buchuda</th>
                  <th className="th text-center">Pontuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d6]">
                {porPontuacao.map((person, index) => (
                  <tr key={person.id} className="transition hover:bg-[#f7f2e4]">
                    <td className="td">
                      <RankBadge position={index + 1} />
                    </td>
                    <td className="td font-medium whitespace-nowrap text-[#10231c]">
                      <Link href={`/pessoas/${person.id}`} className="hover:text-[#0f5b43] hover:underline">
                        {person.name}
                      </Link>
                    </td>
                    <td className="td text-center tabular-nums">{person.jogos}</td>
                    <td className="td text-center tabular-nums">{person.vitorias}</td>
                    <td className="td text-center tabular-nums">{person.vitoriasBuchuda}</td>
                    <td className="td text-center font-display text-base font-semibold tabular-nums text-[#0f5b43]">
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7d6] px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#10231c]">
            Ranking de pessoas
          </h2>
          <Link href="/pessoas" className="text-xs font-semibold text-[#0f5b43] hover:underline">
            Estatísticas completas →
          </Link>
        </div>

        {people.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Nenhuma pessoa cadastrada" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="thead">
                <tr>
                  <th className="th w-14">#</th>
                  <th className="th">Jogador</th>
                  <th className="th text-center">J</th>
                  <th className="th text-center">V</th>
                  <th className="th text-center">D</th>
                  <th className="th text-center">Buchudas</th>
                  <th className="th text-center">% V</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d6]">
                {people.map((person, index) => (
                  <tr key={person.id} className="transition hover:bg-[#f7f2e4]">
                    <td className="td">
                      <RankBadge position={index + 1} />
                    </td>
                    <td className="td font-medium whitespace-nowrap text-[#10231c]">
                      <Link href={`/pessoas/${person.id}`} className="hover:text-[#0f5b43] hover:underline">
                        {person.name}
                      </Link>
                    </td>
                    <td className="td text-center tabular-nums">{person.jogos}</td>
                    <td className="td text-center font-semibold tabular-nums text-[#0f5b43]">
                      {person.vitorias}
                    </td>
                    <td className="td text-center tabular-nums">{person.derrotas}</td>
                    <td className="td text-center tabular-nums">{person.buchudas}</td>
                    <td className="td text-center tabular-nums">{formatPercent(person.aproveitamento)}</td>
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
