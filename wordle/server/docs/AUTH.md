# Autenticação centralizada

## Fluxo
1. Navegador faz login em `POST /api/auth/google` -> sessão no servidor (cookie httpOnly `gamesufg.sid`).
2. Requisição a `/wordle/...` passa por `requireAuth` (sem sessão: redireciona para `/` se for página, 401 JSON se for fetch).
3. Com sessão válida, o gateway remove o cookie, gera um JWT (HS256, `aud` = nome do serviço, `exp` curto)
   e repassa a requisição com `Authorization: Bearer <jwt>` para o container.
4. O microsserviço valida o JWT (ver `wordle-requireGatewayAuth.example.js`) e usa `req.user`.

Logout destrói a sessão: nenhum token novo é emitido; os já emitidos expiram em até `AUTH_SERVICE_TOKEN_TTL_SECONDS`.

## Estrutura
- `auth/`    módulo independente (config, sessão, Google, JWT, middlewares, rotas `/api/auth/*`). API pública em `auth/index.js`.
- `gateway/` registro de serviços (`services.js`) e proxy autenticado.
- Novo serviço: adicione uma entrada em `gateway/services.js`.

## Variáveis de ambiente
| Variável | Padrão | Obs. |
|---|---|---|
| `SESSION_SECRET` | aleatório em dev | obrigatório em produção |
| `AUTH_JWT_SECRET` | valor fixo de dev | obrigatório em produção; igual no gateway e nos serviços |
| `AUTH_SESSION_TTL_MINUTES` | 60 | antes o cookie durava 8h |
| `AUTH_SERVICE_TOKEN_TTL_SECONDS` | 60 | |
| `AUTH_ALLOWED_DOMAINS` | `ufg.br,discente.ufg.br` | |
| `CLIENT_ID_GOOGLE` | o atual | |
| `WORDLE_SERVICE_URL` | `http://localhost:3001` | no compose: `http://wordle:<porta>` |

## Dependências novas
`npm i jsonwebtoken http-proxy-middleware` (as demais já eram usadas). Recompile o binário (`bun build --compile`).
