FROM node:16.19.0 as base

RUN npm install --global pnpm
# RUN npm install -g typescript

FROM base as dependencies

WORKDIR /usr/src/app
COPY .npmrc package.json pnpm-lock.yaml ./
ENV GENERATE_SOURCEMAP=false
RUN pnpm install --frozen-lockfile

FROM base as build

WORKDIR /usr/src/app
COPY . ./
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
# RUN pnpm run build
RUN ./node_modules/.bin/tsc -b

FROM base as deploy

RUN npm install --global pnpm
RUN npm install --global typescript

WORKDIR /usr/src/app
# COPY .env.prod ./.env
COPY .env ./.env
COPY bin/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/keys ./keys
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY .npmrc package.json pnpm-lock.yaml ./
EXPOSE 3100
EXPOSE 3200
EXPOSE 4200
# CMD ["node", "--experimental-specifier-resolution=node", "-r", "dotenv/config", "/usr/src/app/dist/index.js"]
CMD ["/bin/sh", "/usr/local/bin/entrypoint.sh"]

