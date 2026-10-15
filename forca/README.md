# Forca (microsserviço)

Jogo da forca com palavras de 5 letras e 6 erros permitidos. Roda em um container próprio, com seu próprio PostgreSQL.

- **Rota pública** (via gateway/core): `/forca`
- **Autenticação**: igual ao wordle — o gateway envia `Authorization: Bearer <JWT>` (`aud = forca`) e `server/auth.js` valida.
- **A palavra secreta fica no servidor**: o cliente só recebe as letras já descobertas (`masked`) e a palavra completa quando a partida termina.
- **Limite diário**: `DAILY_GAME_LIMIT` (padrão 5) partidas iniciadas por usuário por dia (`GAME_TIMEZONE`). Recarregar a página retoma a partida em andamento sem gastar outro jogo.
- **Pontuação**: vitória = 100 pts − 10 por erro (50 a 100); derrota = 0. Os pontos vão para o serviço de ranking.

## API (todas sob `/forca/api`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/me` | usuário, jogos restantes hoje e estatísticas |
| GET | `/games/current` | partida em andamento (ou a última de hoje) |
| POST | `/games` | inicia uma partida (ou retoma a ativa) — `429` se atingiu o limite |
| POST | `/games/:id/guess` | `{ "letter": "A" }` → `hit` + estado atualizado |

## Variáveis de ambiente

| Variável | Padrão | Obs. |
|---|---|---|
| `SERVER_PORT` | `8082` | |
| `DATABASE_URL` | `postgres://forca:forca@localhost:5432/forca` | |
| `AUTH_JWT_SECRET` | valor fixo de dev | obrigatório com `NODE_ENV=production`; igual ao do core |
| `DAILY_GAME_LIMIT` | `5` | |
| `GAME_TIMEZONE` | `America/Sao_Paulo` | |
| `INTERNAL_SERVICE_SECRET` | valor fixo de dev | tokens entre serviços; igual em palavras e ranking |
| `PALAVRAS_SERVICE_URL` | `http://localhost:8084` | |
| `RANKING_SERVICE_URL` | `http://localhost:8083` | |
| `RANKING_RETRY_MS` | `15000` | |

## Rodar

Pelo compose (na raiz): `docker compose up --build`.
Local: suba um PostgreSQL com o usuário/banco `forca` e rode `make dev`.

## Integrações

- **Palavras** (`PALAVRAS_SERVICE_URL`): a cada partida nova, o serviço pede uma palavra ao microsserviço de palavras (token interno). Se ele estiver fora do ar, a API responde `503` e nenhum jogo é gasto.
- **Ranking** (`RANKING_SERVICE_URL`): quando a partida termina, o serviço envia a pontuação ao ranking. Cada partida fica com `reported = false` até o ranking confirmar; se ele estiver fora do ar, um reenvio periódico (`RANKING_RETRY_MS`, padrão 15 s) entrega depois. O ranking ignora partidas repetidas, então nada pontua duas vezes.
