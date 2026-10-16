# --- build stage: compile the React app with Vite ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# --- runtime stage: serve static files with nginx ---
# Unprivileged variant: runs as user 101 on port 8080 (pod has a read-only root fs).
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
