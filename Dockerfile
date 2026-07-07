# Demo / reference endpoint image: builds the browser app, serves it plus the
# paid API from demo/server. NOTE: not built in local dev (Docker unavailable
# there) — validate in your deploy pipeline.
FROM node:26-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -C demo/app build

FROM node:26-alpine
RUN corepack enable
WORKDIR /repo
COPY --from=build /repo /repo
ENV NODE_ENV=production
# Provide at runtime: ONE_CLICK_JWT, MPP_SECRET_KEY, MERCHANT_RECIPIENT,
# REFUND_TO_ARB, REFUND_TO_BTC (and optionally PORT, default 8402).
EXPOSE 8402
CMD ["npx", "tsx", "demo/server/index.ts"]
