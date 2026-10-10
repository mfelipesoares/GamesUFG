import session from 'express-session';
import { config, isProd } from './config.js';

// Obs.: usa MemoryStore (suficiente para desenvolvimento/demo).
export const sessionMiddleware = session({
    name: config.cookieName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false, // só cria cookie quando houver login
    cookie: {
        httpOnly: true,        // inacessível via JavaScript
        sameSite: 'lax',       // mitiga CSRF
        secure: isProd,        // só HTTPS em produção
        maxAge: config.sessionTtlMs,
    },
});

// Abre uma sessão nova para o usuário (regenera o ID: previne session fixation).
export function startSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.user = user;
            req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve(user)));
        });
    });
}

// Destrói a sessão no servidor e limpa o cookie.
export function endSession(req, res) {
    return new Promise((resolve) => {
        const finish = () => {
            res.clearCookie(config.cookieName);
            resolve();
        };
        if (!req.session) return finish();
        req.session.destroy(finish);
    });
}
