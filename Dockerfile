# meet-apply-node — online application system (forms, review, CSV, visualize).
# Zero native deps: plain Node + built-in node:sqlite, so a slim alpine image
# is enough. Build:  docker build -t meet-apply .
FROM node:23-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App code (node_modules/, data/, uploads/, .env excluded via .dockerignore)
COPY . .

# Runtime dirs: SQLite DB + uploaded resumes (mount volumes here)
RUN mkdir -p data uploads && chown -R node:node /app

USER node

EXPOSE 3000

# Seed on first boot only, then start.
# Admin login comes from ADMIN_USERNAME / ADMIN_PASSWORD env vars.
CMD ["sh", "-c", "[ -f data/apply.db ] || node db/seed.js; exec node server.js"]
