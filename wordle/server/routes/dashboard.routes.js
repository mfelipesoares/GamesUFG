import express, { Router } from 'express';
import path from 'path';
import { requireAuthPage } from '../auth/index.js';

const dashRoutes = Router();

// Tudo em /dashboard exige sessão válida; o middleware vem ANTES do static.
dashRoutes.use('/dashboard', requireAuthPage, express.static(path.resolve('public/pages/dashboard')));

export default dashRoutes;
