import { OAuth2Client } from 'google-auth-library';
import { config } from './config.js';

const client = new OAuth2Client(config.googleClientId);

export class AuthError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Valida o ID Token do Google e devolve o usuário (ou lança AuthError).
export async function verifyGoogleLogin(idToken) {
    let payload;
    try {
        const ticket = await client.verifyIdToken({ idToken, audience: config.googleClientId });
        payload = ticket.getPayload();
    } catch (error) {
        console.error('Erro ao verificar o token:', error.message);
        throw new AuthError(401, 'Token inválido ou expirado.');
    }

    const email = String(payload?.email || '').toLowerCase();
    const domain = email.split('@')[1];

    // Validação estrita no servidor: e-mail verificado e domínio institucional
    if (!payload?.email_verified || !config.allowedDomains.includes(domain)) {
        const lista = config.allowedDomains.map((d) => `@${d}`).join(' ou ');
        throw new AuthError(403, `Acesso negado. Apenas e-mails institucionais (${lista}) são permitidos.`);
    }

    return { id: payload.sub, name: payload.name, email, picture: payload.picture };
}
