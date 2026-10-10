VERSION = 0.1.0

build:
	@echo "Definindo variáveis de ambiente!"
	@chmod  +x  ./config/enviroment.sh
	@./config/enviroment.sh
	@echo "Compilando servidor!"
	@bun build --compile server/index.js --outfile server/bin/server
	@docker build -t gamesufg-core:$(VERSION) . --no-cache
	@echo "Build completa!"

clean:
	@rm -rf node_modules .env

dev:
	@bun run server/index.js

