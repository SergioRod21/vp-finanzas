# --- Etapa 1: compilar la aplicación -------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Las dependencias van primero: Docker reutiliza esta capa mientras package-lock.json no cambie
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: servir los archivos estáticos con nginx --------------------------------
# Imagen sin root: nginx corre como usuario 101 y escucha en el puerto 8080.
# La imagen final no contiene Node, el código fuente ni node_modules.
FROM nginxinc/nginx-unprivileged:1.30-alpine

COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
