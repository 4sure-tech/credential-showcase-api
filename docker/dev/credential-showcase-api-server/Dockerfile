# Build stage
FROM node:20-bookworm AS builder
SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm -g install pnpm && pnpm setup && source /root/.bashrc && pnpm self-update && pnpm setup && pnpm config set store-dir "/usr/local/share/pnpm/store/v10" --global

WORKDIR /build
COPY . /build
RUN rm -rf $(pnpm store path) && pnpm install -g rimraf typescript tslib
RUN pnpm install
RUN pnpm build
RUN pnpm deploy /deploy --filter credential-showcase-api-server --prod

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /deploy /app
ENV NODE_ENV=production
RUN echo PORT=3000  > .env
CMD ["node", "dist/index.js"]
