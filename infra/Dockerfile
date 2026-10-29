# Estágio 1: compila o React. Deste estágio só a pasta dist segue adiante.
FROM oven/bun:1-slim AS frontend

WORKDIR /app/frontend

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ ./
RUN bun run build

# Estágio 2: a aplicação que vai rodar.
FROM oven/bun:1-slim

WORKDIR /app/backend

# primeiro só as dependências: enquanto package.json e bun.lock não mudarem,
# o Docker reaproveita esta camada e o build fica rápido
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY backend/ ./

# o mesmo lugar relativo que no seu computador: ../frontend/dist
COPY --from=frontend /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "src/main.ts"]
