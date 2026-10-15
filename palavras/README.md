# Palavras (microsserviço)

Fornece a palavra secreta (5 letras, maiúsculas, sem acento) para o Wordle e a Forca. **Não tem interface nem rota pública**: o gateway não o expõe e o navegador nunca fala com ele. Assim, a palavra só existe no servidor.

- **Autenticação**: `GET /internal/words/random` exige um token entre serviços (`INTERNAL_SERVICE_SECRET`, `aud = palavras`) e só aceita `wordle` e `forca` como origem (`403` para os demais).
- **Banco**: PostgreSQL próprio, tabela `words` (só aceita 5 letras A–Z). Ao iniciar, grava as palavras de `server/words.seed.js` (idempotente: pode reiniciar e acrescentar palavras à lista).

## API (interna)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/internal/words/random` | `{ "word": "PLANO" }` |
| GET | `/health` | healthcheck do Docker |

## Variáveis de ambiente

| Variável | Padrão |
|---|---|
| `SERVER_PORT` | `8084` |
| `DATABASE_URL` | `postgres://palavras:palavras@localhost:5432/palavras` |
| `INTERNAL_SERVICE_SECRET` | valor fixo de dev (obrigatório com `NODE_ENV=production`) |

## Rodar

Pelo compose (na raiz): `docker compose up --build`. Local: suba um PostgreSQL com usuário/banco `palavras` e rode `make dev`.
