# ponytail: dev image only. Add a multi-stage build (output: "standalone") when you deploy.
FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3001
CMD ["pnpm", "dev"]
