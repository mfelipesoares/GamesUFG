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
    // Também é o "audience" dos tokens internos.
    serviceName: 'palavras',
    port: Number(process.env.SERVER_PORT || 8084),

    // Segredo dos tokens entre microsserviços (NÃO é o mesmo do login do usuário).
    internalSecret: requireSecret('INTERNAL_SERVICE_SECRET', 'dev-only-insecure-internal-secret'),
    internalIssuer: 'gamesufg-internal',
    // Quem pode pedir palavras.
    allowedCallers: ['wordle', 'forca'],

    databaseUrl: process.env.DATABASE_URL || 'postgres://palavras:palavras@localhost:5432/palavras',
};
