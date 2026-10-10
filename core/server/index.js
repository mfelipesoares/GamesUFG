import express from 'express';
import cors from 'cors';
import session from 'express-session';
import crypto from 'crypto';
import authRouter from './routes/auth.routes';
import dashRoutes from './routes/dashboard.routes';

const PORT = process.env.SERVER_PORT || 8080;
const isProd = process.env.NODE_ENV === 'production';

let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    if (isProd) {
        throw new Error('Defina SESSION_SECRET em produção.');
    }
    // Em desenvolvimento, gera um segredo aleatório (as sessões caem a cada reinício).
    SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('[aviso] SESSION_SECRET não definido; usando segredo temporário.');
}

const app = express();

// Atrás de proxy reverso (HTTPS), necessário para o cookie "secure" funcionar.
if (isProd) app.set('trust proxy', 1);

app.use(cors());
app.use(express.json()); // precisa vir ANTES das rotas para popular req.body
app.use(session({
    name: 'gamesufg.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // só cria cookie quando houver login
    cookie: {
        httpOnly: true,                 // inacessível via JavaScript
        sameSite: 'lax',                // mitiga CSRF
        secure: isProd,                 // só HTTPS em produção
        maxAge: 1000 * 60 * 60 * 8,     // 8 horas
    },
    // Obs.: usa MemoryStore (suficiente para desenvolvimento/demo).
}));

app.use(authRouter);
app.use(dashRoutes);

app.listen(PORT, () => {
    console.log("Servidor iniciado em: http://localhost:" + PORT);
});
