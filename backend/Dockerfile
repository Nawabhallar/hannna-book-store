# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Copy environment file (optional, better to use docker-compose)
# COPY .env .env

# Expose app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
