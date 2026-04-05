# Use Node 20 slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package config and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Run Vite with --host to allow external access within the container
CMD ["npm", "run", "dev", "--", "--host"]
