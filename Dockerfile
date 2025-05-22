# Stage 1: Build the application
FROM node:18-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:18-slim
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/build ./build
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8000

# Run the start script which uses Supergateway with Basic Auth
CMD ["./start.sh"]
