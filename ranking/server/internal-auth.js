import jwt from 'jsonwebtoken';
import { config } from './config.js';

// Autenticação entre microsserviços: JWT curto assinado com INTERNAL_SERVICE_SECRET,
// com subject = serviço que chama e audience = este serviço.
// Estas rotas (/internal/*) não passam pelo gateway, então o navegador nunca as alcança.
export function requireInternalAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token ausente.' });

    try {
        const claims = jwt.verify(token, config.internalSecret, {
            algorithms: ['HS256'],
            issuer: config.internalIssuer,
            audience: config.serviceName,
        });
        if (!config.allowedCallers.includes(claims.sub)) {
            return res.status(403).json({ error: 'Serviço não autorizado.' });
        }
        req.caller = claims.sub;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}
