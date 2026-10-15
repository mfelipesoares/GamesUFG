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
CREATE TABLE IF NOT EXISTS games (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    user_name   TEXT,
    user_email  TEXT,
    user_picture TEXT,
    word        TEXT        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost')),
    guesses     JSONB       NOT NULL DEFAULT '[]'::jsonb, -- letras escolhidas, em ordem
    score       INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    reported    BOOLEAN     NOT NULL DEFAULT false  -- já enviada ao ranking?
);
-- Bancos criados antes do ranking:
ALTER TABLE games ADD COLUMN IF NOT EXISTS user_picture TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS reported BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS games_pending_report_idx ON games (finished_at) WHERE status <> 'playing' AND NOT reported;
CREATE INDEX IF NOT EXISTS games_user_created_idx ON games (user_id, created_at);
-- No máximo uma partida em andamento por usuário.
CREATE UNIQUE INDEX IF NOT EXISTS games_one_active_per_user ON games (user_id) WHERE status = 'playing';
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
