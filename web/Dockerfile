# syntax=docker/dockerfile:1

FROM node:17.3.0-alpine
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

# RUN npm install --production
RUN npm install

COPY . .

CMD [ "npm", "run", "start:producer" ]