# Ranking (microsserviço)

Ranking por conta somando os pontos da Forca e do Wordle.

- **Rota pública** (via gateway/core): `/ranking` — abas Geral, Forca e Wordle, com a posição do usuário logado.
- **Pontuação por partida**: Forca = 100 − 10 por erro (50 a 100) na vitória; Wordle = 100 − 15 por tentativa extra (mínimo 25) na vitória; derrota = 0. Quem calcula é o serviço do jogo; o ranking só valida (0 a 100, derrota não pontua) e soma.
- **Classificação**: total de pontos; empate decidido por mais vitórias; persistindo o empate, a mesma posição.
- **Quem lança pontos**: só `forca` e `wordle`, por `POST /internal/scores` com token entre serviços (`INTERNAL_SERVICE_SECRET`). Cada serviço só pode lançar pontos do próprio jogo. O navegador não tem como enviar pontuação, e `/internal` não é exposto pelo gateway.
- **Idempotência**: `(game, game_id)` é único; reenviar a mesma partida não pontua de novo.
- **Privacidade**: a resposta do ranking traz nome e foto da conta Google, sem ID nem e-mail.

## API

| Método | Rota | Quem chama |
|---|---|---|
| GET | `/ranking/api/ranking?game=all\|forca\|wordle&limit=50` | navegador (JWT do gateway) |
| POST | `/internal/scores` | forca / wordle (token interno) |
| GET | `/health` | healthcheck do Docker |

## Variáveis de ambiente

| Variável | Padrão |
|---|---|
| `SERVER_PORT` | `8083` |
| `DATABASE_URL` | `postgres://ranking:ranking@localhost:5432/ranking` |
| `AUTH_JWT_SECRET` | valor fixo de dev (login do usuário; igual ao do core) |
| `INTERNAL_SERVICE_SECRET` | valor fixo de dev (tokens entre serviços) |

## Rodar

Pelo compose (na raiz): `docker compose up --build`. Local: suba um PostgreSQL com usuário/banco `ranking` e rode `make dev`.
