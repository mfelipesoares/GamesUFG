#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
ENV_FILE="$SCRIPT_DIR/../.env"
touch "$ENV_FILE"

read -p "Digite o seu Client ID: " CLIENT_ID
if [ -z "$CLIENT_ID" ]; then
    echo "❌ Erro: O Client ID não pode ser vazio!"
    exit 1
fi
grep -v "^CLIENT_ID=" "$ENV_FILE" > temp_env && mv temp_env "$ENV_FILE"
echo "CLIENT_ID=\"$CLIENT_ID\"" >> "$ENV_FILE"
echo -e "SESSION_SECRET=$(openssl rand -hex 32)" >> "$ENV_FILE"
read -p "Digite o número da porta do servidor: " PORT_SERVER
if [ -z "$CLIENT_ID" ]; then
    echo "Assumindo porta 3000...."
    echo "✅ Client ID salvo com sucesso na raiz do projeto em: $ENV_FILE"
    exit  0
fi
grep -v "^PORT_SERVER=" "$ENV_FILE" > temp_env && mv temp_env "$ENV_FILE"
echo "SERVER_PORT=\"$PORT_SERVER\"" >> "$ENV_FILE"
echo "✅ Client ID salvo com sucesso na raiz do projeto em: $ENV_FILE"

