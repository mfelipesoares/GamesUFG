import { Router } from 'express';
import { query } from '../db.js';
import { HttpError } from '../errors.js';

const internal = Router();

internal.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Uma palavra aleatória de 5 letras. Só wordle/forca (servidor) recebem; o cliente nunca vê isto.
internal.get('/words/random', async (req, res) => {
    const { rows } = await query('SELECT word FROM words ORDER BY random() LIMIT 1');
    if (!rows[0]) throw new HttpError(503, 'Nenhuma palavra disponível.');
    res.json({ word: rows[0].word });
});

internal.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

export default internal;
