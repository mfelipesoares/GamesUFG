import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

pool.on('error', (err) => console.error('[db] erro em conexão ociosa:', err.message));

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS players (
    user_id    TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    picture    TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uma linha por partida terminada. (game, game_id) é único: reenviar a mesma partida não pontua duas vezes.
CREATE TABLE IF NOT EXISTS scores (
    id          BIGSERIAL PRIMARY KEY,
    game        TEXT        NOT NULL CHECK (game IN ('forca', 'wordle')),
    game_id     UUID        NOT NULL,
    user_id     TEXT        NOT NULL REFERENCES players (user_id),
    score       INTEGER     NOT NULL CHECK (score >= 0),
    result      TEXT        NOT NULL CHECK (result IN ('won', 'lost')),
    finished_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (game, game_id)
);
CREATE INDEX IF NOT EXISTS scores_user_idx ON scores (user_id);
`;

// O container do banco pode demorar a aceitar conexões: tenta por até ~30 s.
export async function initDatabase({ retries = 30, delayMs = 1000 } = {}) {
    for (let attempt = 1; ; attempt++) {
        try {
            await pool.query(SCHEMA);
            console.log('[db] conectado e schema pronto.');
            return;
        } catch (err) {
            if (attempt >= retries) throw err;
            console.warn(`[db] aguardando o banco (${attempt}/${retries}): ${err.message}`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}
