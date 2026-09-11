# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

RUN npm install -g pnpm@11

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

WORKDIR /app

COPY --from=build /app/out ./out
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@11 \
  && pnpm install --frozen-lockfile --prod

EXPOSE 3000

USER node

CMD ["node", "out/servers/preview-server.js"]
