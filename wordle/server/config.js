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
    // Também é o "audience" do JWT: tem que bater com o "name" em core/server/gateway/services.js
    serviceName: 'wordle',
    // Prefixo público (o gateway repassa o caminho completo: stripPrefix = false)
    basePath: '/wordle',
    port: Number(process.env.SERVER_PORT || 8081),

    // Mesmo valor do gateway (AUTH_JWT_SECRET no core).
    jwtSecret: requireSecret('AUTH_JWT_SECRET', 'dev-only-insecure-jwt-secret'),
    jwtIssuer: 'gamesufg-gateway',

    // Tokens entre microsserviços (este serviço -> palavras / ranking).
    internalSecret: requireSecret('INTERNAL_SERVICE_SECRET', 'dev-only-insecure-internal-secret'),
    internalIssuer: 'gamesufg-internal',
    palavrasUrl: process.env.PALAVRAS_SERVICE_URL || 'http://localhost:8084',
    rankingUrl: process.env.RANKING_SERVICE_URL || 'http://localhost:8083',
    // De quanto em quanto tempo reenviar ao ranking as partidas que ainda não chegaram lá.
    rankingRetryMs: Number(process.env.RANKING_RETRY_MS || 15000),

    databaseUrl: process.env.DATABASE_URL || 'postgres://wordle:wordle@localhost:5432/wordle',

    // Limite de partidas iniciadas por usuário por dia (no fuso abaixo).
    dailyLimit: Number(process.env.DAILY_GAME_LIMIT || 5),
    timezone: process.env.GAME_TIMEZONE || 'America/Sao_Paulo',

    wordLength: 5,
    maxAttempts: 6,
};
