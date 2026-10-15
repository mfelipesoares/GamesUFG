import { config } from './config.js';
import { query, withTransaction } from './db.js';
import { HttpError } from './errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const GAMES = ['forca', 'wordle'];

// Recebe uma partida terminada de forca/wordle. Idempotente: repetir a mesma partida não soma de novo.
// `caller` é o serviço autenticado; ele só pode registrar partidas do próprio jogo.
export async function recordScore(caller, body) {
    const { game, gameId, userId, userName, userPicture, score, result, finishedAt } = body ?? {};

    if (!GAMES.includes(game)) throw new HttpError(400, 'Jogo inválido.');
    if (caller !== game) throw new HttpError(403, 'Um serviço só pode registrar pontos do próprio jogo.');
    if (!UUID_RE.test(String(gameId))) throw new HttpError(400, 'gameId inválido.');
    if (typeof userId !== 'string' || !userId || userId.length > 200) throw new HttpError(400, 'userId inválido.');
    if (!Number.isInteger(score) || score < 0 || score > config.maxScore) throw new HttpError(400, 'Pontuação inválida.');
    if (!['won', 'lost'].includes(result)) throw new HttpError(400, 'Resultado inválido.');
    if (result === 'lost' && score !== 0) throw new HttpError(400, 'Derrota não pontua.');
    const finished = new Date(finishedAt);
    if (Number.isNaN(finished.getTime())) throw new HttpError(400, 'finishedAt inválido.');

    const name = String(userName || 'Jogador').slice(0, 120);
    const picture = typeof userPicture === 'string' && /^https:\/\//.test(userPicture) ? userPicture.slice(0, 500) : null;

    return withTransaction(async (client) => {
        await client.query(
            `INSERT INTO players (user_id, name, picture) VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, picture = EXCLUDED.picture, updated_at = now()`,
            [userId, name, picture],
        );
        const { rowCount } = await client.query(
            `INSERT INTO scores (game, game_id, user_id, score, result, finished_at)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (game, game_id) DO NOTHING`,
            [game, gameId, userId, score, result, finished],
        );
        return { created: rowCount === 1 };
    });
}

// Pontos = soma das pontuações das partidas. Desempate: mais vitórias; persistindo, mesma posição.
const RANKED = `
WITH agg AS (
    SELECT user_id,
           sum(score)::int AS points,
           count(*)::int AS played,
           (count(*) FILTER (WHERE result = 'won'))::int AS wins
      FROM scores
     WHERE ($1::text = 'all' OR game = $1::text)
     GROUP BY user_id
), ranked AS (
    SELECT a.user_id, p.name, p.picture, a.points, a.played, a.wins,
           (RANK() OVER (ORDER BY a.points DESC, a.wins DESC))::int AS position
      FROM agg a JOIN players p USING (user_id)
)`;

export async function getRanking({ game, userId, limit }) {
    const [top, me, total, byGame] = await Promise.all([
        query(`${RANKED} SELECT * FROM ranked ORDER BY position, name LIMIT $2`, [game, limit]),
        query(`${RANKED} SELECT * FROM ranked WHERE user_id = $2`, [game, userId]),
        query(`${RANKED} SELECT count(*)::int AS total FROM ranked`, [game]),
        query(
            `SELECT game, sum(score)::int AS points, count(*)::int AS played,
                    (count(*) FILTER (WHERE result = 'won'))::int AS wins
               FROM scores WHERE user_id = $1 GROUP BY game`,
            [userId],
        ),
    ]);

    const mine = me.rows[0];
    return {
        game,
        totalPlayers: total.rows[0].total,
        entries: top.rows.map((r) => ({
            position: r.position,
            name: r.name,
            picture: r.picture,
            points: r.points,
            played: r.played,
            wins: r.wins,
            isMe: r.user_id === userId,
        })),
        me: mine
            ? { position: mine.position, points: mine.points, played: mine.played, wins: mine.wins }
            : null,
        // Pontos do usuário em cada jogo (útil na aba "Geral").
        byGame: Object.fromEntries(GAMES.map((g) => {
            const row = byGame.rows.find((r) => r.game === g);
            return [g, { points: row?.points ?? 0, played: row?.played ?? 0, wins: row?.wins ?? 0 }];
        })),
    };
}
