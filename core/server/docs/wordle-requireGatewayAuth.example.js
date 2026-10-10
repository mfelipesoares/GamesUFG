// Copie para o microsserviço do wordle. Dependência: npm i jsonwebtoken
// Variável de ambiente: AUTH_JWT_SECRET (mesmo valor do gateway).
import jwt from 'jsonwebtoken';

export function requireGatewayAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token ausente.' });

    try {
        const claims = jwt.verify(token, process.env.AUTH_JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'gamesufg-gateway',
            audience: 'wordle', // tem que bater com o "name" em gateway/services.js
        });
        req.user = { id: claims.sub, name: claims.name, email: claims.email, picture: claims.picture };
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

// Uso: app.use(requireGatewayAuth); depois leia req.user.id nas rotas.
