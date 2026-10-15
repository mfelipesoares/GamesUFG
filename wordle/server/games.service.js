import { query, withTransaction } from './db.js';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { pickWord } from './words.js';
import { reportGame } from './ranking.reporter.js';
import { normalizeWord, isValidGuess, evaluateGuess, scoreForWin } from './wordle.logic.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Dia no fuso configurado (e não em UTC), para o limite diário virar à meia-noite local.
const TODAY = `(created_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`;

async function countToday(db, userId) {
    const { rows } = await db.query(
        `SELECT count(*)::int AS total FROM games WHERE user_id = $1 AND ${TODAY}`,
        [userId, config.timezone],
    );
    return rows[0].total;
}

// A palavra secreta só sai do servidor quando a partida termina.
export function serializeGame(row) {
    if (!row) return null;
    const finished = row.status !== 'playing';
    return {
        id: row.id,
        status: row.status,
        wordLength: config.wordLength,
        maxAttempts: config.maxAttempts,
        attempts: row.attempts,
        score: row.score,
        ...(finished ? { word: row.word } : {}),
    };
}

// Partida em andamento ou, se não houver, a última de hoje (para mostrar o resultado ao recarregar).
export async function getCurrentGame(userId) {
    const { rows } = await query(
        `SELECT * FROM games
          WHERE user_id = $1 AND (status = 'playing' OR ${TODAY})
          ORDER BY (status = 'playing') DESC, created_at DESC
          LIMIT 1`,
        [userId, config.timezone],
    );
    return serializeGame(rows[0]);
}

export async function getSummary(userId) {
    const used = await countToday({ query }, userId);
    const { rows } = await query(
        `SELECT count(*)::int AS played,
                (count(*) FILTER (WHERE status = 'won'))::int AS won,
                COALESCE(sum(score), 0)::int AS points
           FROM games WHERE user_id = $1 AND status <> 'playing'`,
        [userId],
    );
    return {
        dailyLimit: config.dailyLimit,
        remaining: Math.max(config.dailyLimit - used, 0),
        stats: rows[0],
    };
}

export function startGame(user) {
    return withTransaction(async (client) => {
        // Serializa requisições simultâneas do mesmo usuário (evita burlar o limite com dois cliques).
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${config.serviceName}:${user.id}`]);

        const used = await countToday(client, user.id);
        const active = await client.query(`SELECT * FROM games WHERE user_id = $1 AND status = 'playing'`, [user.id]);
        if (active.rows[0]) {
            return { game: serializeGame(active.rows[0]), resumed: true, remaining: Math.max(config.dailyLimit - used, 0) };
        }

        if (used >= config.dailyLimit) {
            throw new HttpError(429, `Você já usou seus ${config.dailyLimit} jogos de hoje. Volte amanhã!`);
        }

        const word = await pickWord();
        const { rows } = await client.query(
            `INSERT INTO games (user_id, user_name, user_email, user_picture, word) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user.id, user.name ?? null, user.email ?? null, user.picture ?? null, word],
        );
        return { game: serializeGame(rows[0]), resumed: false, remaining: config.dailyLimit - used - 1 };
    });
}

export async function makeGuess(user, gameId, rawGuess) {
    if (!UUID_RE.test(String(gameId))) throw new HttpError(404, 'Jogo não encontrado.');

    const game = await withTransaction(async (client) => {
        const { rows } = await client.query(
            'SELECT * FROM games WHERE id = $1 AND user_id = $2 FOR UPDATE',
            [gameId, user.id],
        );
        const game = rows[0];
        if (!game) throw new HttpError(404, 'Jogo não encontrado.');
        if (game.status !== 'playing') throw new HttpError(409, 'Este jogo já terminou.');

        const guess = normalizeWord(rawGuess);
        if (!isValidGuess(guess)) throw new HttpError(400, `Digite uma palavra de ${config.wordLength} letras.`);

        const attempts = [...game.attempts, { word: guess, result: evaluateGuess(guess, game.word) }];

        let status = 'playing';
        let score = 0;
        if (guess === game.word) {
            status = 'won';
            score = scoreForWin(attempts.length);
        } else if (attempts.length >= config.maxAttempts) {
            status = 'lost';
        }

        const updated = await client.query(
            `UPDATE games
                SET attempts = $1::jsonb, status = $2::text, score = $3::int,
                    finished_at = CASE WHEN $2::text = 'playing' THEN NULL ELSE now() END
              WHERE id = $4
          RETURNING *`,
            [JSON.stringify(attempts), status, score, game.id],
        );
        return serializeGame(updated.rows[0]);
    });

    // Partida terminou: envia a pontuação ao ranking (sem travar a resposta; se falhar, o reenvio periódico cobre).
    if (game.status !== 'playing') reportGame(game.id).catch((err) => console.warn('[ranking] envio adiado:', err.message));
    return game;
}
