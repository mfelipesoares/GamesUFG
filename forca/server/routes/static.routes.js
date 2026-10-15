import express, { Router } from 'express';
import path from 'path';
import { config } from '../config.js';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../public');
const base = config.basePath;

const staticRoutes = Router();

// Os assets ficam sob /wordle/* para não colidir com os do core (/images, /scripts, /styles).
staticRoutes.use(`${base}/images`, express.static(path.join(PUBLIC_DIR, 'images')));
staticRoutes.use(`${base}/scripts`, express.static(path.join(PUBLIC_DIR, 'scripts')));
staticRoutes.use(`${base}/styles`, express.static(path.join(PUBLIC_DIR, 'styles')));
staticRoutes.use(base, express.static(path.join(PUBLIC_DIR, 'pages/root')));

export default staticRoutes;
