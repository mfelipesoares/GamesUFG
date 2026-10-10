// Configuração do módulo de autenticação (única fonte de verdade para variáveis de ambiente).

export const isProd = process.env.NODE_ENV === 'production';

function requireSecret(name, devFallback) {
    const value = process.env[name];
    if (value) return value;
    if (isProd) throw new Error(`Defina ${name} em produção.`);
    console.warn(`[aviso] ${name} não definido; usando valor de desenvolvimento.`);
    return devFallback();
}

export const config = {
    // --- Sessão do navegador (cookie httpOnly) ---
    cookieName: 'gamesufg.sid',
    // Em dev, um segredo aleatório derruba as sessões a cada reinício (aceitável).
    sessionSecret: requireSecret('SESSION_SECRET', () => crypto.randomUUID() + crypto.randomUUID()),
    sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MINUTES || 60) * 60 * 1000,

    // --- Login com Google ---
    // O Client ID é público (já está no HTML). O fallback evita audience indefinido,
    // o que desativaria a checagem de destinatário do token.
    googleClientId: process.env.CLIENT_ID_GOOGLE
        || '972243789609-7pcmbn13o1foaouagouhdja5v2k61us0.apps.googleusercontent.com',
    allowedDomains: (process.env.AUTH_ALLOWED_DOMAINS || 'ufg.br,discente.ufg.br')
        .split(',').map((d) => d.trim().toLowerCase()).filter(Boolean),

    // --- Token interno repassado aos microsserviços (JWT) ---
    // Precisa ser o MESMO valor nos microsserviços que verificam o token.
    // Em dev usa um valor fixo (um aleatório impediria os outros containers de validar).
    jwtSecret: requireSecret('AUTH_JWT_SECRET', () => 'dev-only-insecure-jwt-secret'),
    jwtIssuer: 'gamesufg-gateway',
    // Vida curta: o token é gerado a cada requisição repassada; o logout (sessão destruída)
    // bloqueia novos tokens imediatamente e os já emitidos expiram neste prazo.
    serviceTokenTtlSeconds: Number(process.env.AUTH_SERVICE_TOKEN_TTL_SECONDS || 60),
};
