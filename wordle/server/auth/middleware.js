// Middlewares de proteção baseados na sessão do servidor.

export function isAuthenticated(req) {
    return Boolean(req.session?.user);
}

// Para páginas: sem sessão, redireciona para a tela de login.
export function requireAuthPage(req, res, next) {
    if (isAuthenticated(req)) {
        // Evita que o navegador mostre a página em cache após o logout (botão "voltar").
        res.set('Cache-Control', 'no-store');
        return next();
    }
    return res.redirect('/');
}

// Para APIs: sem sessão, responde 401 em JSON.
export function requireAuthApi(req, res, next) {
    if (isAuthenticated(req)) return next();
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
}

// Para rotas que servem páginas E APIs (ex.: proxy de um microsserviço):
// navegação do browser (Accept: text/html) vai para o login; fetch/XHR recebe 401 JSON.
export function requireAuth(req, res, next) {
    if (req.accepts(['json', 'html']) === 'html') return requireAuthPage(req, res, next);
    return requireAuthApi(req, res, next);
}
