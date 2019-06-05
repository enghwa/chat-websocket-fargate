FROM node:9 AS build
WORKDIR /srv
ADD package.json .
RUN npm install

FROM node:9-slim
WORKDIR /app
COPY --from=build /srv .
ADD . .
EXPOSE 3000
# CMD ["node", "./node_modules/.bin/mocha", "-b", "--exit"]
CMD ["./node_modules/.bin/nodemon", "--exec", "npm", "run", "babel-node", "--", "./server/server.js"]
