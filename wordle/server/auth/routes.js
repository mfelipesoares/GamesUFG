import express, { Router } from 'express';
import { requireAuthApi } from './middleware.js';
import { startSession, endSession } from './session.js';
import { verifyGoogleLogin, AuthError } from './google.service.js';

const authRouter = Router();

// O módulo não depende do parser global do app.
authRouter.use('/api/auth', express.json());

// Autentica via ID Token do Google e abre uma sessão no servidor
authRouter.post('/api/auth/google', async (req, res) => {
    const token = req.body?.token;
    if (!token) {
        return res.status(400).json({ error: 'Token não fornecido.' });
    }

    try {
        const user = await verifyGoogleLogin(token);
        await startSession(req, user);
        return res.status(200).json({
            message: 'Autenticado com sucesso!',
            user,
            redirect: '/dashboard',
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error('Erro ao criar sessão:', error);
        return res.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
    }
});

// Dados do usuário logado (usado pelo dashboard)
authRouter.get('/api/auth/me', requireAuthApi, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ user: req.session.user });
});

// Encerra a sessão
authRouter.post('/api/auth/logout', async (req, res) => {
    await endSession(req, res);
    res.status(200).json({ message: 'Sessão encerrada.' });
});

export default authRouter;
