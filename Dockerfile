# # Use the official Node.js image as base
# FROM node:20.12.2
 
# # Set the working directory in the container
# WORKDIR /app
 
# # Copy package.json and package-lock.json
# COPY package*.json ./
 
# # Install dependencies
# RUN npm install
 
# # Install PM2 globally
# RUN npm install -g pm2
 
# # Copy the rest of the application
# COPY . .
 
# # Expose the port the app runs on
# EXPOSE 5000
 
# # Command to run the backend server with PM2
# CMD ["pm2-runtime", "start", "server.js", "--name", "gvf-backend"]





# Use the official Node.js image as base
FROM node:20
 
# Install dependencies
RUN apt-get update && apt-get install -y \
    make \
    g++ \
    python3 \
&& rm -rf /var/lib/apt/lists/*
 
# Set the working directory in the container
WORKDIR /app
 
# Copy package.json and package-lock.json
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Install PM2 globally
RUN npm install -g pm2
 
# Copy the rest of the application
COPY . .
 
# Expose the port the app runs on
EXPOSE 5000
 
# Command to run the backend server with PM2
CMD ["pm2-runtime", "start", "server.js"]
