# Fly remote builder only (no local Docker Desktop).
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://pitflow-api.fly.dev
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV PORT=8080
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]
