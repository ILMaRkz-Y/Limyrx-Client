# Build context = repo root. Self-contained: compiles the API inside the
# container, so the VPS only needs Docker + the repo — no Node/pnpm on host.
FROM node:22-alpine AS build
WORKDIR /app
# Full workspace manifests so pnpm can resolve the workspace graph (limyrx-api
# is a workspace member, even though its runtime deps are all registry-only).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY limyrx-api ./limyrx-api
RUN corepack enable \
    && pnpm install --filter limyrx-api --no-frozen-lockfile \
    && pnpm --filter limyrx-api run compile \
    && pnpm install --filter limyrx-api --prod

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# pnpm isolated linker: limyrx-api/node_modules holds symlinks into the
# virtual store at node_modules/.pnpm — copy both trees.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/limyrx-api/node_modules ./limyrx-api/node_modules
COPY --from=build /app/limyrx-api/package.json ./limyrx-api/package.json
COPY --from=build /app/limyrx-api/dist ./limyrx-api/dist
WORKDIR /app/limyrx-api
EXPOSE 3000
CMD ["node", "dist/index.js"]
