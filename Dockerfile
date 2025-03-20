FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Create logs directory
RUN mkdir -p logs

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]