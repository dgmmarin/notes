# Zero-dependency Node app: no `npm install` step needed.
FROM node:24-alpine
WORKDIR /app
COPY package.json server.js ./
EXPOSE 5000
# Run as the built-in non-root user shipped with the node image.
USER node
CMD ["node", "server.js"]
