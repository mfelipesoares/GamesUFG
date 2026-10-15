import jwt from 'jsonwebtoken';
import { config } from './config.js';

// Valida o JWT emitido pelo gateway (core). O cookie de sessão nunca chega aqui:
// o gateway o remove e injeta "Authorization: Bearer <jwt>" a cada requisição.
export function requireGatewayAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token ausente.' });

    try {
        const claims = jwt.verify(token, config.jwtSecret, {
            algorithms: ['HS256'],
            issuer: config.jwtIssuer,
            audience: config.serviceName,
        });
        req.user = { id: claims.sub, name: claims.name, email: claims.email, picture: claims.picture };
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}
