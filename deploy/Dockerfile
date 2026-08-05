# Build context is the PROJECT ROOT, not this directory:
#   gcloud run deploy fitsignal --source . --region us-central1
# (see docs/deploy.md)
FROM node:22-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# The previous Dockerfile copied only server.js, so the container built fine and
# then crashed on first import. The app needs src/ AND rules/ — the rubric is
# data the server loads at boot, not something bundled into the code.
COPY src/ ./src/
COPY rules/ ./rules/

ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]
