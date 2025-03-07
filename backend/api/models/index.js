const User = require("./User");
const Chat = require("./Chat");
const Message = require("./Message");

// A Chat is created by a User
Chat.belongsTo(User, { foreignKey: "created_by" });

// A Message belongs to a Chat
Message.belongsTo(Chat, { foreignKey: "chat_id" });

// A Message belongs to a User (sender)
Message.belongsTo(User, { foreignKey: "sender_id" });

module.exports = {
  User,
  Chat,
  Message,
};
