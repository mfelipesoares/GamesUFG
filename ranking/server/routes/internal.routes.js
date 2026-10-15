import express, { Router } from 'express';
import { recordScore } from '../ranking.service.js';

const internal = Router();

internal.use(express.json({ limit: '4kb' }));

// forca/wordle enviam aqui cada partida terminada.
internal.post('/scores', async (req, res) => {
    const { created } = await recordScore(req.caller, req.body);
    res.status(created ? 201 : 200).json({ created });
});

internal.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

export default internal;
