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
  derrotas: number;
  buchudas: number;
  aproveitamento: number;
  pontosFeitos: number;
  pontosSofridos: number;
  saldo: number;
  mediaPontos: number;
  ultimaPartida: string | null;
  sequencia: number;
  melhorDupla: { nome: string; vitorias: number; jogos: number } | null;
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
  pontosSofridos: number;
  saldo: number;
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
        derrotas: 0,
        buchudas: 0,
        aproveitamento: 0,
        pontosFeitos: 0,
        pontosSofridos: 0,
        saldo: 0,
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

      if (!maiorPlacar || team.score > maiorPlacar.pontos) {
        maiorPlacar = { descricao: duoNome, pontos: team.score };
      }

      for (const member of team.members) {
        const acc = personAcc(member);
        acc.jogos += 1;
        acc.pontosFeitos += team.score;
        acc.pontosSofridos += team.conceded;
        acc.results.push(team.result);
        if (team.result === "V") acc.vitorias += 1;
        else acc.derrotas += 1;
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
          pontosSofridos: 0,
          saldo: 0,
          ultimaPartida: null,
        };
        duoMap.set(key, duo);
      }
      duo.jogos += 1;
      duo.pontosFeitos += team.score;
      duo.pontosSofridos += team.conceded;
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
    acc.saldo = acc.pontosFeitos - acc.pontosSofridos;
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
    saldo: duo.pontosFeitos - duo.pontosSofridos,
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
      b.saldo - a.saldo ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  duos.sort(
    (a, b) =>
      b.vitorias - a.vitorias ||
      b.aproveitamento - a.aproveitamento ||
      b.jogos - a.jogos ||
      b.saldo - a.saldo ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );

  return {
    matches,
    people,
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
