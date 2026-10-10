// Middlewares de proteção baseados na sessão do servidor.

// Para páginas: sem sessão, redireciona para a tela de login.
export function requireAuthPage(req, res, next) {
    if (req.session?.user) {
        // Evita que o navegador mostre a página em cache após o logout (botão "voltar").
        res.set('Cache-Control', 'no-store');
        return next();
    }
    return res.redirect('/');
}

// Para APIs: sem sessão, responde 401 em JSON.
export function requireAuthApi(req, res, next) {
    if (req.session?.user) return next();
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
}
