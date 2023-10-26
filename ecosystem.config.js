require('dotenv')

/* eslint-disable */
const os = require('os')

// @NOTE: Decide on a standard Redis index to use
const { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, NODE_ENV } = process.env

const redisUri =
  NODE_ENV === 'development'
    ? `redis://${REDIS_HOST}:${REDIS_PORT}`
    : `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`

module.exports = {
  apps: [
    {
      port: 5544,
      name: 'fareplay-colyseus-proxy',
      script: './node_modules/@colyseus/proxy/bin/proxy',
      instances: 1, // scale this up if the proxy becomes the bottleneck
      exec_mode: 'cluster',
      env: {
        PORT: 80,
        REDIS_URL: redisUri,
      },
    },
    {
      port: 3100,
      name: 'fareplay-authority-node',
      script: 'node bin/www', // @NOTE: NEED TO SETUP CONFIG SCRIPT
      watch: false, // optional
      // instances: 4,
      instances: os.cpus().length / 2,
      exec_mode: 'fork', // IMPORTANT: do not use cluster mode.
      env: {
        DEBUG: 'colyseus:errors',
        NODE_ENV: 'production',
      },
    },
  ],
}
