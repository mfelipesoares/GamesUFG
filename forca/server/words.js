import { config } from './config.js';
import { HttpError } from './errors.js';
import { internalFetch } from './internal.js';

// A palavra vem do microsserviço de palavras e fica só no servidor (e no banco deste serviço).
export async function pickWord() {
    try {
        const res = await internalFetch(config.palavrasUrl, '/internal/words/random', 'palavras');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { word } = await res.json();
        if (!/^[A-Z]{5}$/.test(word)) throw new Error('palavra inválida recebida');
        return word;
    } catch (err) {
        console.error('[palavras] falha ao sortear palavra:', err.message);
        throw new HttpError(503, 'Não foi possível sortear uma palavra agora. Tente novamente em instantes.');
    }
}
