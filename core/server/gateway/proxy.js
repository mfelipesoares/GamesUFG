import { createProxyMiddleware } from 'http-proxy-middleware';
import { signServiceToken } from '../auth/index.js';
import { renderUnavailablePage } from './unavailable.page.js';

// Proxy que só é alcançado depois de requireAuth. Para cada requisição:
//  - descarta o cookie de sessão e qualquer Authorization vindo do cliente;
//  - injeta "Authorization: Bearer <JWT curto>" assinado pelo gateway, com o audience do serviço.
export function createAuthenticatedProxy({ name, label = name, prefix, target, stripPrefix = true }) {
    const unavailableHtml = renderUnavailablePage({ label });
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        xfwd: true,
        proxyTimeout: 30_000,
        // O Express já remove o prefixo do mount (req.url = "/jogo"). Só reanexamos se stripPrefix = false.
        pathRewrite: stripPrefix ? undefined : (path) => `${prefix}${path}`,
        on: {
            proxyReq(proxyReq, req) {
                proxyReq.removeHeader('cookie');
                proxyReq.removeHeader('authorization');
                proxyReq.setHeader('Authorization', `Bearer ${signServiceToken(req.session.user, name)}`);
            },
            error(err, req, res) {
                console.error(`[gateway] falha ao acessar "${name}":`, err.message);
                if (res.headersSent) return res.end();

                // 503 + Retry-After. Navegação do browser recebe a página; fetch/XHR recebe JSON.
                const headers = { 'Cache-Control': 'no-store', 'Retry-After': '10' };
                if (req.accepts(['json', 'html']) === 'html') {
                    res.writeHead(503, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
                    return res.end(unavailableHtml);
                }
                res.writeHead(503, { ...headers, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `${label} indisponível no momento.` }));
            },
        },
    });
}
