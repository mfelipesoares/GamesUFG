# GamesUFG

Plataforma de jogos de vocabulário (Projeto de Software, UFG).

```
navegador ──► core :8080 (login Google, sessão de 1 h, gateway)
                 ├─ /wordle  ──► gamesufg-wordle  ──► wordle-db  (PostgreSQL)
                 ├─ /forca   ──► gamesufg-forca   ──► forca-db   (PostgreSQL)
                 └─ /ranking ──► gamesufg-ranking ──► ranking-db (PostgreSQL)

wordle / forca ──► gamesufg-palavras ──► palavras-db   (sorteia a palavra secreta)
wordle / forca ──► gamesufg-ranking                    (enviam a pontuação ao fim de cada partida)
```

Só o `core` expõe porta. Os demais ficam na rede interna do compose:

- **Navegador → serviço**: o gateway valida a sessão e repassa um JWT de curta duração (`AUTH_JWT_SECRET`).
- **Serviço → serviço**: token próprio (`INTERNAL_SERVICE_SECRET`), com origem e destino verificados. `/internal/*` nunca passa pelo gateway.
- **A palavra secreta nunca chega ao navegador**: ela é sorteada pelo serviço de palavras, guardada no banco do jogo e todas as validações (palpites, vitória, derrota, pontos, limite diário) acontecem no servidor.

## Subir tudo

```bash
cp .env.example .env      # defina os segredos e as senhas dos bancos
docker compose up --build
```

Depois abra http://localhost:8080 . O Client ID do Google e o `SESSION_SECRET` do core continuam sendo gerados por `make build` dentro de `core/` (veja `core/config/enviroment.sh`).

## Pastas

| Pasta | O que é |
|---|---|
| `core/` | login com Google, sessão, dashboard e gateway (proxy autenticado) |
| `wordle/` | microsserviço do Wordle ([README](wordle/README.md)) |
| `forca/` | microsserviço da Forca ([README](forca/README.md)) |
| `palavras/` | microsserviço que fornece as palavras secretas ([README](palavras/README.md)) |
| `ranking/` | microsserviço do ranking por conta ([README](ranking/README.md)) |

Para adicionar um novo serviço atrás do gateway, inclua uma entrada em `core/server/gateway/services.js`.
