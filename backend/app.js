const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { corsOptions } = require("./config/security");
const route = require("./config/route");
const sequelize = require("./config/sequelize");
const { createServer } = require("http");
const { initializeSocket } = require("./config/socket");

// Initialize Express app
const app = express();
const server = createServer(app); // Create HTTP server
app.io = initializeSocket(server); // Initialize WebSocket on the same server

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS with predefined options
app.use(cors(corsOptions));

// Serve static files for uploaded assets
app.use("/assets/uploads", express.static("public/assets/uploads"));

// API routes
app.use((req, res, next) => {
  req.io = app.io; 
  next();
});
app.use(route);

// Synchronize Sequelize with the database
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synchronized successfully!");
  })
  .catch((error) => {
    console.error("Error during synchronization:", error.message, error);
  });

app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

const PORT = process.env.PORT || 4000;

// Start HTTP & WebSocket server together
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
