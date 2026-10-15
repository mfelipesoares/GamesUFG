VERSION = 0.1.0

build:
	@docker build -t gamesufg-ranking:$(VERSION) . --no-cache
	@echo "Build completa!"

# Requer um PostgreSQL acessível em DATABASE_URL (veja o README).
dev:
	@bun run server/index.js

clean:
	@rm -rf node_modules .env
