FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install dependencies and build tools for sqlite3
RUN apk add --no-cache python3 make g++ && npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]