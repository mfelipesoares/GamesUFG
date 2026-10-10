import express from 'express';
import cors from 'cors';
import { authRouter, sessionMiddleware, isProd } from './auth/index.js';
import { mountServices } from './gateway/index.js';
import publicRoutes from './routes/public.routes.js';
import dashRoutes from './routes/dashboard.routes.js';

const PORT = process.env.SERVER_PORT || 8080;

const app = express();

// Atrás de proxy reverso (HTTPS), necessário para o cookie "secure" funcionar.
if (isProd) app.set('trust proxy', 1);

app.use(cors());
app.use(sessionMiddleware);

// Gateway: /wordle (e demais serviços) -> exige login e repassa o token.
// Fica ANTES do express.json() para o corpo da requisição chegar intacto ao microsserviço.
mountServices(app);

app.use(express.json());
app.use(authRouter);
app.use(publicRoutes);
app.use(dashRoutes);

app.listen(PORT, () => {
    console.log("Servidor iniciado em: http://localhost:" + PORT);
});
