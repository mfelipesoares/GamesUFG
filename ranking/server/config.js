// Configuração do microsserviço (única fonte de verdade para variáveis de ambiente).

export const isProd = process.env.NODE_ENV === 'production';

function requireSecret(name, devFallback) {
    const value = process.env[name];
    if (value) return value;
    if (isProd) throw new Error(`Defina ${name} em produção.`);
    console.warn(`[aviso] ${name} não definido; usando valor de desenvolvimento.`);
    return devFallback;
}

export const config = {
    // Também é o "audience" dos JWTs: tem que bater com o "name" em core/server/gateway/services.js
    serviceName: 'ranking',
    basePath: '/ranking',
    port: Number(process.env.SERVER_PORT || 8083),

    // Login do usuário (token emitido pelo gateway) — mesmo valor do core.
    jwtSecret: requireSecret('AUTH_JWT_SECRET', 'dev-only-insecure-jwt-secret'),
    jwtIssuer: 'gamesufg-gateway',

    // Tokens entre microsserviços (forca/wordle -> ranking). Segredo e emissor diferentes dos de cima.
    internalSecret: requireSecret('INTERNAL_SERVICE_SECRET', 'dev-only-insecure-internal-secret'),
    internalIssuer: 'gamesufg-internal',
    allowedCallers: ['wordle', 'forca'],

    databaseUrl: process.env.DATABASE_URL || 'postgres://ranking:ranking@localhost:5432/ranking',

    defaultLimit: 50,
    maxScore: 100,
};
