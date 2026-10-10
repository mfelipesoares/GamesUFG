// API pública do módulo de autenticação.
// Nada fora desta pasta precisa conhecer Google, JWT ou detalhes de sessão.
export { default as authRouter } from './routes.js';
export { sessionMiddleware } from './session.js';
export { isAuthenticated, requireAuth, requireAuthApi, requireAuthPage } from './middleware.js';
export { signServiceToken, verifyServiceToken } from './token.service.js';
export { isProd } from './config.js';
