FROM oven/bun:latest
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

# Não roda como root dentro do container.
USER bun

EXPOSE 8083

CMD ["bun", "run", "server/index.js"]
