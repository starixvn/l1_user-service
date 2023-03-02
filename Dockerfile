FROM hub.lumigame.com/docker-hub/library/node:18.1-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock .modprunerrc ./
RUN npm run reg \
    && yarn install
COPY . .
RUN npm run build
RUN rm -rf ./node_modules
RUN yarn install --production \
    && npx mod-pruner prune --force 

FROM hub.lumigame.com/docker-hub/library/node:18.1-alpine
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
RUN mkdir /app && chown node:node /app
WORKDIR /app

RUN apk --no-cache add curl

USER node
ENV PATH /app/node_modules/.bin:$PATH
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/views ./views
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

HEALTHCHECK  --interval=10s CMD curl --fail http://localhost:5000 || exit 1

CMD [ "node", "./dist/main.js" ]