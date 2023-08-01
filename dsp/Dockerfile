FROM node:20-alpine

WORKDIR /app/dsp

COPY package.json package-lock.json ./

RUN npm ci

COPY dsp.js ./

CMD ["node", "dsp.js" ]