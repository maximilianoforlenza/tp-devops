FROM node:22-alpine

ARG APP_VERSION=unknown
ENV APP_VERSION=$APP_VERSION

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "--import", "./instrumentation.mjs", "index.js"]
