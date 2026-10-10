import express, { Router } from 'express';
import path from 'path';
import { isAuthenticated } from '../auth/index.js';

const publicRoutes = Router();

// Quem já está logado e abre a raiz vai direto ao dashboard.
publicRoutes.get('/', (req, res, next) => {
    if (isAuthenticated(req)) return res.redirect('/dashboard');
    next();
});

publicRoutes.use('/', express.static(path.resolve('public/pages/root')));
publicRoutes.use('/images', express.static(path.resolve('public/images')));
publicRoutes.use('/scripts', express.static(path.resolve('public/scripts')));
publicRoutes.use('/styles', express.static(path.resolve('public/styles')));

export default publicRoutes;
