import express, { Router } from 'express';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { requireAuthApi } from '../middleware/auth';

const authRouter = Router();
// O Client ID é público (já está no HTML). O fallback evita audience indefinido,
// o que desativaria a checagem de destinatário do token.
const CLIENT_ID = process.env.CLIENT_ID_GOOGLE
    || '972243789609-7pcmbn13o1foaouagouhdja5v2k61us0.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);
const ALLOWED_DOMAINS = ['ufg.br', 'discente.ufg.br'];
const COOKIE_NAME = 'gamesufg.sid';

// Quem já está logado e abre a raiz vai direto ao dashboard.
authRouter.get('/', (req, res, next) => {
    if (req.session?.user) return res.redirect('/dashboard');
    next();
});

authRouter.use('/', express.static(path.resolve("public/pages/root")));
authRouter.use('/images', express.static(path.resolve("public/images")));
authRouter.use('/scripts', express.static(path.resolve("public/scripts")));
authRouter.use('/styles', express.static(path.resolve("public/styles")));

// Autentica via ID Token do Google e abre uma sessão no servidor
authRouter.post('/api/auth/google', async (req, res) => {
    const token = req.body?.token;

    if (!token) {
        return res.status(400).json({ error: 'Token não fornecido.' });
    }

    let payload;
    try {
        const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID });
        payload = ticket.getPayload();
    } catch (error) {
        console.error('Erro ao verificar o token:', error.message);
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const email = String(payload?.email || '').toLowerCase();
    const domain = email.split('@')[1];

    // Validação estrita no servidor: e-mail verificado e domínio institucional
    if (!payload?.email_verified || !ALLOWED_DOMAINS.includes(domain)) {
        return res.status(403).json({
            error: 'Acesso negado. Apenas e-mails institucionais (@ufg.br ou @discente.ufg.br) são permitidos.'
        });
    }

    // Regenera o ID da sessão no login (previne session fixation)
    req.session.regenerate((err) => {
        if (err) {
            console.error('Erro ao criar sessão:', err);
            return res.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
        }

        req.session.user = {
            name: payload.name,
            email,
            picture: payload.picture,
        };

        req.session.save((saveErr) => {
            if (saveErr) {
                console.error('Erro ao salvar sessão:', saveErr);
                return res.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
            }
            return res.status(200).json({
                message: 'Autenticado com sucesso!',
                user: req.session.user,
                redirect: '/dashboard',
            });
        });
    });
});

// Dados do usuário logado (usado pelo dashboard)
authRouter.get('/api/auth/me', requireAuthApi, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ user: req.session.user });
});

// Encerra a sessão
authRouter.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie(COOKIE_NAME);
        res.status(200).json({ message: 'Sessão encerrada.' });
    });
});

export default authRouter;
