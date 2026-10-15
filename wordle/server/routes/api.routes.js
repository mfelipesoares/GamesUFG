import express, { Router } from 'express';
import { getCurrentGame, getSummary, makeGuess, startGame } from '../games.service.js';

const api = Router();

api.use(express.json({ limit: '1kb' }));
api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Dados do jogador + quantos jogos ainda restam hoje.
api.get('/me', async (req, res) => {
    const summary = await getSummary(req.user.id);
    res.json({ user: req.user, ...summary });
});

api.get('/games/current', async (req, res) => {
    res.json({ game: await getCurrentGame(req.user.id) });
});

// Inicia uma partida (ou retoma a que está em andamento, sem gastar outro jogo do dia).
api.post('/games', async (req, res) => {
    const { game, resumed, remaining } = await startGame(req.user);
    res.status(resumed ? 200 : 201).json({ game, resumed, remaining });
});

api.post('/games/:id/guess', async (req, res) => {
    const game = await makeGuess(req.user, req.params.id, req.body?.word);
    const summary = game.status === 'playing' ? null : await getSummary(req.user.id);
    res.json({ game, ...(summary ?? {}) });
});

api.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

export default api;
