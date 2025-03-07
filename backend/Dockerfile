# Use official Node.js image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for efficient caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the backend files
COPY . .

# Expose the backend port
EXPOSE 4000

# Start the backend server
CMD ["node", "app.js"]
