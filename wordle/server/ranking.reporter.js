import { config } from './config.js';
import { query } from './db.js';
import { internalFetch } from './internal.js';

// Padrão "outbox": cada partida terminada fica com reported = false até o ranking confirmar.
// Se o ranking estiver fora do ar, nada se perde: o reenvio periódico entrega depois.
// O ranking é idempotente (partida repetida não pontua de novo).

async function send(row) {
    const res = await internalFetch(config.rankingUrl, '/internal/scores', 'ranking', {
        method: 'POST',
        body: {
            game: config.serviceName,
            gameId: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userPicture: row.user_picture,
            score: row.score,
            result: row.status,
            finishedAt: row.finished_at,
        },
    });
    if (!res.ok) {
        const err = new Error(`ranking respondeu HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    await query('UPDATE games SET reported = true WHERE id = $1', [row.id]);
}

export async function reportGame(gameId) {
    const { rows } = await query(
        `SELECT * FROM games WHERE id = $1 AND status <> 'playing' AND NOT reported`,
        [gameId],
    );
    if (rows[0]) await send(rows[0]);
}

export async function reportPending() {
    const { rows } = await query(
        `SELECT * FROM games WHERE status <> 'playing' AND NOT reported ORDER BY finished_at LIMIT 100`,
    );
    for (const row of rows) {
        try {
            await send(row);
        } catch (err) {
            console.warn(`[ranking] partida ${row.id} pendente: ${err.message}`);
            // 4xx = problema nesta partida (segue para a próxima); rede/5xx = ranking fora (para e tenta depois).
            if (!(err.status >= 400 && err.status < 500)) break;
        }
    }
}

export function startReporter() {
    const timer = setInterval(() => reportPending().catch((e) => console.warn('[ranking]', e.message)), config.rankingRetryMs);
    timer.unref?.();
    reportPending().catch((e) => console.warn('[ranking]', e.message));
}
