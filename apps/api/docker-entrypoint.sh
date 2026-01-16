#!/bin/sh
set -e

echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting API server..."
exec node dist/src/main
