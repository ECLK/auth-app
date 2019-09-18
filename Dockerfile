# build environment
FROM node:12.2.0-alpine
ENV NODE_ENV production
COPY package.json /app/package.json
RUN npm install --silent
COPY . /app
EXPOSE 3000
RUN npm start