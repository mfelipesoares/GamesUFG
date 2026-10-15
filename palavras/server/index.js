import express from 'express';
import { config } from './config.js';
import { requireInternalAuth } from './internal-auth.js';
import { initDatabase, pool } from './db.js';
import { errorHandler } from './errors.js';
import internalRoutes from './routes/internal.routes.js';

const app = express();
app.disable('x-powered-by');

// Healthcheck do Docker (só alcançável dentro da rede do compose).
app.get('/health', (req, res) => res.json({ status: 'ok', service: config.serviceName }));

app.use('/internal', requireInternalAuth, internalRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);

await initDatabase();

const server = app.listen(config.port, () => {
    console.log(`Palavras iniciado em: http://localhost:${config.port}`);
});

async function shutdown() {
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
