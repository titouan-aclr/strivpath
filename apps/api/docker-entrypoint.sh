#!/bin/sh
set -e

echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Running database seed..."
node dist/prisma/seed.js

echo "Starting API server..."
exec node dist/src/main
