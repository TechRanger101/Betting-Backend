#!/bin/sh

cd /usr/src/app

set -e

sleep 20 && node --experimental-specifier-resolution=node -r dotenv/config /usr/src/app/dist/index.js
