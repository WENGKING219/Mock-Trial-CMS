# Stage 1: Build React frontend
FROM node:20-alpine AS builder
WORKDIR /build
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js ./
COPY --from=builder /build/client/dist ./client/dist
RUN mkdir -p uploads data
EXPOSE 3000
CMD ["node", "server.js"]
