# build environment
FROM node:12.2.0-alpine
ENV NODE_ENV production
WORKDIR /app
COPY package.json /app/package.json
COPY . /app
RUN npm install --silent
EXPOSE 3000
CMD ["npm", "start"]