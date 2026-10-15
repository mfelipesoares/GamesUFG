import jwt from 'jsonwebtoken';
import { config } from './config.js';

// Token curto para falar com outro microsserviço (palavras, ranking).
// subject = este serviço; audience = o serviço de destino.
function internalToken(audience) {
    return jwt.sign({}, config.internalSecret, {
        algorithm: 'HS256',
        subject: config.serviceName,
        issuer: config.internalIssuer,
        audience,
        expiresIn: 30,
    });
}

export function internalFetch(baseUrl, path, audience, { method = 'GET', body, timeoutMs = 3000 } = {}) {
    return fetch(baseUrl + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${internalToken(audience)}` },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
    });
}
