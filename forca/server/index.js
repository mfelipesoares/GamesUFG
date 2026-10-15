import express from 'express';
import { config } from './config.js';
import { requireGatewayAuth } from './auth.js';
import { initDatabase, pool } from './db.js';
import { errorHandler } from './errors.js';
import { startReporter } from './ranking.reporter.js';
import apiRoutes from './routes/api.routes.js';
import staticRoutes from './routes/static.routes.js';

const app = express();
app.disable('x-powered-by');

// Healthcheck do Docker. Fica ANTES da autenticação e não é exposto pelo gateway
// (o gateway só repassa /forca/*), então só é alcançável dentro da rede do compose.
app.get('/health', (req, res) => res.json({ status: 'ok', service: config.serviceName }));

// Tudo abaixo exige o JWT assinado pelo gateway.
app.use(requireGatewayAuth);
app.use(`${config.basePath}/api`, apiRoutes);
app.use(staticRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);

await initDatabase();
startReporter();

const server = app.listen(config.port, () => {
    console.log(`Forca iniciada em: http://localhost:${config.port}${config.basePath}`);
});

async function shutdown() {
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
