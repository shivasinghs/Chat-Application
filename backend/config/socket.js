const { Server } = require("socket.io");
const {User} = require("../api/models/index"); // Import User model

const userSocketMap = {}; // Store userId -> socketId mapping

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId} with Socket ID: ${socket.id}`);
    
    if (userId) {
      userSocketMap[userId] = socket.id;

      //  Update user status to online 
      await User.update({ isOnline: true }, { where: { id: userId } });

      // Emit updated online users list
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    } else {
      console.log("No userId provided during socket connection.");
    }
    
    // Handle user disconnect
    socket.on("disconnect", async () => {
      if (userId) {
        delete userSocketMap[userId];

        // Update user status to offline & set lastSeen
        await User.update(
          { isOnline: false, lastSeen: new Date() },
          { where: { id: userId } }
        );

        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initializeSocket, getReceiverSocketId };
