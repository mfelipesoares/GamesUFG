import pg from 'pg';
import { config } from './config.js';
import { SEED_WORDS } from './words.seed.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 5 });

pool.on('error', (err) => console.error('[db] erro em conexão ociosa:', err.message));

export const query = (text, params) => pool.query(text, params);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS words (
    word       TEXT PRIMARY KEY CHECK (word ~ '^[A-Z]{5}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// O container do banco pode demorar a aceitar conexões: tenta por até ~30 s.
export async function initDatabase({ retries = 30, delayMs = 1000 } = {}) {
    for (let attempt = 1; ; attempt++) {
        try {
            await pool.query(SCHEMA);
            await pool.query(
                'INSERT INTO words (word) SELECT unnest($1::text[]) ON CONFLICT DO NOTHING',
                [SEED_WORDS],
            );
            const { rows } = await pool.query('SELECT count(*)::int AS total FROM words');
            console.log(`[db] conectado; ${rows[0].total} palavras disponíveis.`);
            return;
        } catch (err) {
            if (attempt >= retries) throw err;
            console.warn(`[db] aguardando o banco (${attempt}/${retries}): ${err.message}`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}
