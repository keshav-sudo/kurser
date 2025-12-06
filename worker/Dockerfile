FROM node:20-alpine

# Install git, curl, and build dependencies
RUN apk add --no-cache git curl bash gcc musl-dev

# Install Nixpacks manually - download the binary from a specific release
RUN curl -L https://github.com/railwayapp/nixpacks/releases/download/v1.41.0/nixpacks-v1.41.0-x86_64-unknown-linux-musl.tar.gz -o nixpacks.tar.gz && \
    tar -xzf nixpacks.tar.gz && \
    mv nixpacks /usr/local/bin/nixpacks && \
    chmod +x /usr/local/bin/nixpacks && \
    rm nixpacks.tar.gz && \
    nixpacks --version

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Create clone directory
RUN mkdir -p /tmp/kurser-repos

# Set environment
ENV NODE_ENV=production

# Start worker using built files
CMD ["node", "dist/index.js"]
