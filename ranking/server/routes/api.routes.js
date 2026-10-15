import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { GAMES, getRanking } from '../ranking.service.js';

const api = Router();

api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// GET /ranking/api/ranking?game=all|forca|wordle&limit=50
api.get('/ranking', async (req, res) => {
    const game = req.query.game ?? 'all';
    if (game !== 'all' && !GAMES.includes(game)) throw new HttpError(400, 'Jogo inválido.');
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || config.defaultLimit, 1), 100);

    const data = await getRanking({ game, userId: req.user.id, limit });
    res.json({ user: { name: req.user.name, picture: req.user.picture }, ...data });
});

api.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

export default api;
