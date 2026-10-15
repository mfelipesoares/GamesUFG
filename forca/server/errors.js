export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Último middleware do app: converte erros em JSON.
export function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    // Erros do express.json() (JSON malformado etc.)
    if (err?.status >= 400 && err?.status < 500) return res.status(err.status).json({ error: 'Requisição inválida.' });
    console.error('[erro]', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
}
