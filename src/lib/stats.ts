import { query } from "./db";

export type MatchPlayer = { id: string; name: string };

export type Match = {
  id: string;
  playedAt: string; // "YYYY-MM-DDTHH:mm"
  scoreA: number;
  scoreB: number;
  teamA: MatchPlayer[];
  teamB: MatchPlayer[];
};

export type PersonStats = {
  id: string;
  name: string;
  jogos: number;
  vitorias: number;
  /** vitórias por 6 a 0 ou mais */
  vitoriasBuchuda: number;
  derrotas: number;
  buchudas: number;
  aproveitamento: number;
  pontuacao: number;
  pontosFeitos: number;
  mediaPontos: number;
  ultimaPartida: string | null;
  sequencia: number;
  melhorDupla: { nome: string; vitorias: number; jogos: number } | null;
};

export const ELO_INICIAL = 1000;
export const ELO_K = 32;
export const ELO_BONUS_BUCHUDA = 4;
export const PARTIDAS_OFICIAL = 10;
export const PARTIDAS_PROVISORIO = 5;

export type EloSituacao = "nao-classificado" | "provisorio" | "oficial";

export type EloPlayer = {
  id: string;
  name: string;
  elo: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  aproveitamento: number;
  buchudasFeitas: number;
  buchudasSofridas: number;
  taxaBuchuda: number;
  situacao: EloSituacao;
  /** Posição no ranking oficial; nula para provisórios e não classificados. */
  posicao: number | null;
};

export type DuoStats = {
  key: string;
  nome: string;
  jogadorIds: string[];
  jogadores: string[];
  jogos: number;
  vitorias: number;
  derrotas: number;
  buchudas: number;
  aproveitamento: number;
  pontosFeitos: number;
  ultimaPartida: string | null;
};

export type Totals = {
  partidas: number;
  pessoas: number;
  duplas: number;
  buchudas: number;
  mediaPontosPorPartida: number;
  maiorPlacar: { descricao: string; pontos: number } | null;
  ultimaPartida: string | null;
};

export type Stats = {
  matches: Match[];
  people: PersonStats[];
  elo: EloPlayer[];
  duos: DuoStats[];
  totals: Totals;
  byPersonId: Map<string, PersonStats>;
};

type MatchRow = {
  id: string;
  played_at: string;
  team_a_score: number;
  team_b_score: number;
  players: { id: string; name: string; team: "A" | "B" }[];
};

const MATCHES_SQL = `
  select
    m.id,
    to_char(m.played_at, 'YYYY-MM-DD"T"HH24:MI') as played_at,
    m.team_a_score,
    m.team_b_score,
    coalesce(
      json_agg(json_build_object('id', p.id, 'name', p.name, 'team', mp.team) order by p.name)
        filter (where p.id is not null),
      '[]'::json
    ) as players
  from matches m
  left join match_players mp on mp.match_id = m.id
  left join people p on p.id = mp.person_id
  group by m.id
  order by m.played_at desc, m.created_at desc
`;

export async function loadMatches(): Promise<Match[]> {
  const rows = await query<MatchRow>(MATCHES_SQL);
  return rows.map((row) => ({
    id: row.id,
    playedAt: row.played_at,
    scoreA: row.team_a_score,
    scoreB: row.team_b_score,
    teamA: row.players.filter((player) => player.team === "A").map(({ id, name }) => ({ id, name })),
    teamB: row.players.filter((player) => player.team === "B").map(({ id, name }) => ({ id, name })),
  }));
}

export async function loadPeople(): Promise<MatchPlayer[]> {
  return query<MatchPlayer>("select id, name from people order by lower(name)");
}

export function duoKey(ids: string[]): string {
  return [...ids].sort().join("|");
}

export function duoName(names: string[]): string {
  return [...names].sort((a, b) => a.localeCompare(b, "pt-BR")).join(" & ");
}

/**
 * Buchuda: derrota por 6 a 0 ou mais (a dupla perdedora zerou e levou 6+).
 */
export const BUCHUDA_MINIMO = 6;

export function isBuchuda(score: number, conceded: number): boolean {
  return score === 0 && conceded >= BUCHUDA_MINIMO;
}

/** Vitória de buchuda: a dupla venceu por 6 a 0 ou mais. */
export function isVitoriaBuchuda(score: number, conceded: number): boolean {
  return conceded === 0 && score >= BUCHUDA_MINIMO;
}

/**
 * Buchuda do ranking Elo: uma dupla zerou e a outra marcou pelo menos um ponto,
 * sem placar máximo fixo (6 x 0, 8 x 0, 10 x 0...).
 */
export function isBuchudaElo(score: number, conceded: number): boolean {
  return (score === 0 && conceded > 0) || (conceded === 0 && score > 0);
}

export function eloSituacao(jogos: number): EloSituacao {
  if (jogos >= PARTIDAS_OFICIAL) return "oficial";
  if (jogos >= PARTIDAS_PROVISORIO) return "provisorio";
  return "nao-classificado";
}

type EloAcc = {
  id: string;
  name: string;
  elo: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  buchudasFeitas: number;
  buchudasSofridas: number;
  confrontos: Map<string, number>;
};

/** Variação de Elo aplicada a cada dupla em uma partida. */
export type MatchEloDelta = { a: number; b: number };

/**
 * Recalcula o histórico cronológico do zero: cada partida usa o Elo dos quatro
 * participantes antes dela, e o incremento é aplicado só depois de calcular as
 * duas duplas. Assim, editar ou excluir uma partida antiga reconstrói
 * automaticamente todas as pontuações seguintes.
 */
function accumulateElo(
  allMatches: Match[],
  onMatch?: (match: Match, delta: MatchEloDelta) => void,
): Map<string, EloAcc> {
  const accs = new Map<string, EloAcc>();

  const accOf = (player: MatchPlayer): EloAcc => {
    let acc = accs.get(player.id);
    if (!acc) {
      acc = {
        id: player.id,
        name: player.name,
        elo: ELO_INICIAL,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        buchudasFeitas: 0,
        buchudasSofridas: 0,
        confrontos: new Map(),
      };
      accs.set(player.id, acc);
    }
    return acc;
  };

  const matches = allMatches
    .filter((match) => match.scoreA !== match.scoreB)
    .slice()
    .sort((a, b) => (a.playedAt < b.playedAt ? -1 : a.playedAt > b.playedAt ? 1 : 0));

  for (const match of matches) {
    const teamA = match.teamA.map(accOf);
    const teamB = match.teamB.map(accOf);
    if (teamA.length === 0 || teamB.length === 0) continue;

    const mediaA = teamA.reduce((total, player) => total + player.elo, 0) / teamA.length;
    const mediaB = teamB.reduce((total, player) => total + player.elo, 0) / teamB.length;
    const esperadoA = 1 / (1 + 10 ** ((mediaB - mediaA) / 400));
    const esperadoB = 1 - esperadoA;

    const venceuA = match.scoreA > match.scoreB;
    const buchuda = isBuchudaElo(match.scoreA, match.scoreB);

    const variacaoA = ELO_K * ((venceuA ? 1 : 0) - esperadoA) + (buchuda ? (venceuA ? ELO_BONUS_BUCHUDA : -ELO_BONUS_BUCHUDA) : 0);
    const variacaoB = ELO_K * ((venceuA ? 0 : 1) - esperadoB) + (buchuda ? (venceuA ? -ELO_BONUS_BUCHUDA : ELO_BONUS_BUCHUDA) : 0);

    onMatch?.(match, { a: variacaoA, b: variacaoB });

    const vencedores = venceuA ? teamA : teamB;
    const perdedores = venceuA ? teamB : teamA;

    for (const player of teamA) {
      player.elo += variacaoA;
      player.jogos += 1;
      if (venceuA) player.vitorias += 1;
      else player.derrotas += 1;
      if (buchuda) {
        if (venceuA) player.buchudasFeitas += 1;
        else player.buchudasSofridas += 1;
      }
    }

    for (const player of teamB) {
      player.elo += variacaoB;
      player.jogos += 1;
      if (venceuA) player.derrotas += 1;
      else player.vitorias += 1;
      if (buchuda) {
        if (venceuA) player.buchudasSofridas += 1;
        else player.buchudasFeitas += 1;
      }
    }

    for (const vencedor of vencedores) {
      for (const perdedor of perdedores) {
        vencedor.confrontos.set(perdedor.id, (vencedor.confrontos.get(perdedor.id) ?? 0) + 1);
      }
    }
  }

  return accs;
}

/** Variação de Elo de cada dupla por partida, para exibir no histórico. */
export function buildEloDeltas(allMatches: Match[]): Map<string, MatchEloDelta> {
  const deltas = new Map<string, MatchEloDelta>();
  accumulateElo(allMatches, (match, delta) => deltas.set(match.id, delta));
  return deltas;
}

/** Ranking Elo individual. */
export function buildEloRanking(allMatches: Match[]): EloPlayer[] {
  const accs = accumulateElo(allMatches);

  const people: EloPlayer[] = [...accs.values()].map((acc) => ({
    id: acc.id,
    name: acc.name,
    elo: acc.elo,
    jogos: acc.jogos,
    vitorias: acc.vitorias,
    derrotas: acc.derrotas,
    aproveitamento: acc.jogos > 0 ? (acc.vitorias / acc.jogos) * 100 : 0,
    buchudasFeitas: acc.buchudasFeitas,
    buchudasSofridas: acc.buchudasSofridas,
    taxaBuchuda: acc.jogos > 0 ? (acc.buchudasFeitas / acc.jogos) * 100 : 0,
    situacao: eloSituacao(acc.jogos),
    posicao: null,
  }));

  const confrontoDireto = (a: EloPlayer, b: EloPlayer): number =>
    (accs.get(a.id)?.confrontos.get(b.id) ?? 0) - (accs.get(b.id)?.confrontos.get(a.id) ?? 0);

  const mesmoEmpate = (a: EloPlayer, b: EloPlayer): boolean =>
    a.elo === b.elo && a.vitorias === b.vitorias && a.aproveitamento === b.aproveitamento;

  people.sort(
    (a, b) =>
      b.elo - a.elo ||
      b.vitorias - a.vitorias ||
      b.aproveitamento - a.aproveitamento ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  // Dentro de cada grupo empatado em Elo/vitórias/aproveitamento, o confronto
  // direto decide. Se continuar igual, a posição é compartilhada.
  for (let start = 0; start < people.length; ) {
    let end = start + 1;
    while (end < people.length && mesmoEmpate(people[start], people[end])) end += 1;
    if (end - start > 1) {
      const grupo = people.slice(start, end);
      grupo.sort(
        (a, b) => confrontoDireto(b, a) - confrontoDireto(a, b) || a.name.localeCompare(b.name, "pt-BR"),
      );
      people.splice(start, end - start, ...grupo);
    }
    start = end;
  }

  let posicao = 0;
  let anterior: EloPlayer | null = null;
  let posicaoAnterior = 0;
  for (const player of people) {
    if (player.situacao !== "oficial") continue;
    posicao += 1;
    const empataComAnterior =
      anterior !== null && mesmoEmpate(anterior, player) && confrontoDireto(anterior, player) === 0;
    player.posicao = empataComAnterior ? posicaoAnterior : posicao;
    posicaoAnterior = player.posicao;
    anterior = player;
  }

  return people;
}

/**
 * Pontuação do ranking geral: R = (Vn + 2·Vb) + ((Vn + 2·Vb) / J) × 10.
 * Vitória normal vale 1 ponto, vitória de buchuda vale 2, e o desempenho
 * (pontos por partida) acrescenta até 10 × esse valor como bônus.
 */
export function pontuacaoGeral(vitoriasBuchuda: number, vitorias: number, jogos: number): number {
  const base = vitorias + vitoriasBuchuda;
  if (jogos <= 0) return 0;
  return base + (base / jogos) * 10;
}

/**
 * Calcula todos os números a partir das partidas. Os rankings são derivados
 * dos dados, então qualquer partida adicionada/removida atualiza tudo na hora.
 *
 * Não existe empate: partidas empatadas não podem ser cadastradas. Se alguma
 * partida antiga empatada ainda estiver no banco, ela é ignorada aqui nas
 * estatísticas (o painel administrativo continua listando para poder excluí-la).
 */
export function buildStats(allMatches: Match[]): Stats {
  type PersonAcc = PersonStats & { results: ("V" | "D")[] };

  const matches = allMatches.filter((match) => match.scoreA !== match.scoreB);
  const peopleMap = new Map<string, PersonAcc>();
  const duoMap = new Map<string, DuoStats>();

  const personAcc = (player: MatchPlayer): PersonAcc => {
    let acc = peopleMap.get(player.id);
    if (!acc) {
      acc = {
        id: player.id,
        name: player.name,
        jogos: 0,
        vitorias: 0,
        vitoriasBuchuda: 0,
        derrotas: 0,
        buchudas: 0,
        aproveitamento: 0,
        pontuacao: 0,
        pontosFeitos: 0,
        mediaPontos: 0,
        ultimaPartida: null,
        sequencia: 0,
        melhorDupla: null,
        results: [],
      };
      peopleMap.set(player.id, acc);
    }
    return acc;
  };

  let maiorPlacar: Totals["maiorPlacar"] = null;
  let totalPontos = 0;

  for (const match of matches) {
    const winner: "A" | "B" = match.scoreA > match.scoreB ? "A" : "B";
    totalPontos += match.scoreA + match.scoreB;

    const teams = [
      {
        team: "A" as const,
        members: match.teamA,
        score: match.scoreA,
        conceded: match.scoreB,
        result: winner === "A" ? ("V" as const) : ("D" as const),
      },
      {
        team: "B" as const,
        members: match.teamB,
        score: match.scoreB,
        conceded: match.scoreA,
        result: winner === "B" ? ("V" as const) : ("D" as const),
      },
    ];

    for (const team of teams) {
      const names = team.members.map((member) => member.name);
      const duoNome = duoName(names);
      const buchuda = isBuchuda(team.score, team.conceded);
      const venceuDeBuchuda = isVitoriaBuchuda(team.score, team.conceded);

      if (!maiorPlacar || team.score > maiorPlacar.pontos) {
        maiorPlacar = { descricao: duoNome, pontos: team.score };
      }

      for (const member of team.members) {
        const acc = personAcc(member);
        acc.jogos += 1;
        acc.pontosFeitos += team.score;
        acc.results.push(team.result);
        if (team.result === "V") acc.vitorias += 1;
        else acc.derrotas += 1;
        if (venceuDeBuchuda) acc.vitoriasBuchuda += 1;
        if (buchuda) acc.buchudas += 1;
        if (!acc.ultimaPartida || match.playedAt > acc.ultimaPartida) {
          acc.ultimaPartida = match.playedAt;
        }
      }

      const sortedIds = team.members.map((member) => member.id).sort();
      const key = sortedIds.join("|");
      let duo = duoMap.get(key);
      if (!duo) {
        duo = {
          key,
          nome: duoNome,
          jogadorIds: sortedIds,
          jogadores: [...names].sort((a, b) => a.localeCompare(b, "pt-BR")),
          jogos: 0,
          vitorias: 0,
          derrotas: 0,
          buchudas: 0,
          aproveitamento: 0,
          pontosFeitos: 0,
          ultimaPartida: null,
        };
        duoMap.set(key, duo);
      }
      duo.jogos += 1;
      duo.pontosFeitos += team.score;
      if (team.result === "V") duo.vitorias += 1;
      else duo.derrotas += 1;
      if (buchuda) duo.buchudas += 1;
      if (!duo.ultimaPartida || match.playedAt > duo.ultimaPartida) {
        duo.ultimaPartida = match.playedAt;
      }
    }
  }

  const people: PersonStats[] = [...peopleMap.values()].map((acc) => {
    acc.aproveitamento = acc.jogos > 0 ? (acc.vitorias / acc.jogos) * 100 : 0;
    acc.pontuacao = pontuacaoGeral(acc.vitoriasBuchuda, acc.vitorias, acc.jogos);
    acc.mediaPontos = acc.jogos > 0 ? acc.pontosFeitos / acc.jogos : 0;

    let sequencia = 0;
    const first = acc.results[0];
    if (first) {
      let count = 0;
      for (const result of acc.results) {
        if (result !== first) break;
        count += 1;
      }
      sequencia = first === "V" ? count : -count;
    }
    acc.sequencia = sequencia;

    const { results: _results, ...rest } = acc;
    return rest;
  });

  const duos: DuoStats[] = [...duoMap.values()].map((duo) => ({
    ...duo,
    aproveitamento: duo.jogos > 0 ? (duo.vitorias / duo.jogos) * 100 : 0,
  }));

  for (const duo of duos) {
    for (const person of people) {
      if (!duo.jogadorIds.includes(person.id)) continue;
      if (!person.melhorDupla || duo.vitorias > person.melhorDupla.vitorias) {
        person.melhorDupla = { nome: duo.nome, vitorias: duo.vitorias, jogos: duo.jogos };
      }
    }
  }

  people.sort(
    (a, b) =>
      b.vitorias - a.vitorias ||
      b.aproveitamento - a.aproveitamento ||
      b.jogos - a.jogos ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  duos.sort(
    (a, b) =>
      b.vitorias - a.vitorias ||
      b.aproveitamento - a.aproveitamento ||
      b.jogos - a.jogos ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );

  return {
    matches,
    people,
    elo: buildEloRanking(matches),
    duos,
    totals: {
      partidas: matches.length,
      pessoas: people.length,
      duplas: duos.length,
      buchudas: people.reduce((total, person) => total + person.buchudas, 0),
      mediaPontosPorPartida: matches.length > 0 ? totalPontos / matches.length / 2 : 0,
      maiorPlacar,
      ultimaPartida: matches[0]?.playedAt ?? null,
    },
    byPersonId: new Map(people.map((person) => [person.id, person])),
  };
}

export async function loadStats(): Promise<Stats> {
  return buildStats(await loadMatches());
}
