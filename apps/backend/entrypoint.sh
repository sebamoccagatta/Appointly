#!/bin/sh
set -e

# Asegura que DATABASE_URL exista (ajustá si usás otra)
: "${DATABASE_URL:=postgres://admin:admin@database:5432/appointly-postgres}"
export DATABASE_URL

# Generar cliente Prisma SIEMPRE al arrancar
npx prisma generate --schema=/app/apps/backend/prisma/schema.prisma

# Iniciar backend
exec node /app/apps/backend/dist/server.js
