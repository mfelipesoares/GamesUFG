import jwt from 'jsonwebtoken';
import { config } from './config.js';

// Gera o token que o gateway repassa a um microsserviço específico.
// `audience` = nome do serviço (ex.: "wordle"): um token emitido para o wordle
// não é aceito pela forca, mesmo que o segredo seja o mesmo.
export function signServiceToken(user, audience) {
    return jwt.sign(
        { name: user.name, email: user.email, picture: user.picture },
        config.jwtSecret,
        {
            algorithm: 'HS256',
            subject: String(user.id ?? user.email),
            issuer: config.jwtIssuer,
            audience,
            expiresIn: config.serviceTokenTtlSeconds,
        },
    );
}

// Usado pelo próprio gateway (testes) e copiável para os microsserviços.
export function verifyServiceToken(token, audience) {
    return jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: config.jwtIssuer,
        audience,
    });
}
