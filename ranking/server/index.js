import express from 'express';
import { config } from './config.js';
import { requireGatewayAuth } from './auth.js';
import { requireInternalAuth } from './internal-auth.js';
import { initDatabase, pool } from './db.js';
import { errorHandler } from './errors.js';
import apiRoutes from './routes/api.routes.js';
import internalRoutes from './routes/internal.routes.js';
import staticRoutes from './routes/static.routes.js';

const app = express();
app.disable('x-powered-by');

// Healthcheck do Docker (só alcançável dentro da rede do compose).
app.get('/health', (req, res) => res.json({ status: 'ok', service: config.serviceName }));

// Serviço -> serviço (token interno). O gateway só repassa /ranking/*, então /internal nunca é público.
app.use('/internal', requireInternalAuth, internalRoutes);

// Navegador -> gateway -> aqui (JWT do usuário).
app.use(config.basePath, requireGatewayAuth);
app.use(`${config.basePath}/api`, apiRoutes);
app.use(staticRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);

await initDatabase();

const server = app.listen(config.port, () => {
    console.log(`Ranking iniciado em: http://localhost:${config.port}${config.basePath}`);
});

async function shutdown() {
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
