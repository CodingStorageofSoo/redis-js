FROM node:20-alpine

WORKDIR /app/ssp

COPY package.json package-lock.json ./

RUN npm ci

COPY ssp.js ./

CMD ["node", "ssp.js"]