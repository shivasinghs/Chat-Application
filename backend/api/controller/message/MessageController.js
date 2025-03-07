const { Message, Chat } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4, CHAT_TYPE, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const { getReceiverSocketId } = require("../../../config/socket");
const sequelize = require('../../../config/sequelize');
const { where } = require("sequelize");

// Function to send a message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    let { receiverId, message } = req.body;

    // Validate the request body
    const validation = new VALIDATOR(req.body, {
      receiverId: validationRules.User.id,
      message: validationRules.Message.message,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if a chat already exists between the sender and receiver
    let chat = await Chat.findOne({
      where: {
        type: CHAT_TYPE.INDIVIDUAL,
        participants: { [Op.contains]: [senderId, receiverId] },
      },
      attributes: ["id", "participants", "type"],
    });

    // If no chat exists, create a new one
    if (!chat) {
      chat = await Chat.create({
        id: uuidv4(),
        type: CHAT_TYPE.INDIVIDUAL,
        participants: [senderId, receiverId],
        createdBy: senderId,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    // Create a new message entry
    const newMessage = await Message.create({
      id: uuidv4(),
      chatId: chat.id,
      senderId,
      message,
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: senderId,
    });

    // Emit the message in real-time using Socket.io
    const io = req.io;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toJSON(), 
        senderName: req.user.name
      });
      console.log("Message sent to receiverID:", receiverId);
    }

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Message sent successfully",
      data: {
        chatId: chat.id,
        messageId: newMessage.id,
        senderId,
        message: newMessage.message,     
      },
      error: "",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};

// Function to retrieve messages between two users
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId } = req.params;

    // Validate receiverId
    const validation = new VALIDATOR(req.params, {
      receiverId: validationRules.User.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    const query = `
      SELECT 
        m.id AS "messageId",
        m.chat_id AS "chatId",
        m.sender_id AS "senderId",
        m.message,
        m.created_at AS "createdAt",
        u.name AS "senderName"
      FROM messages m
      JOIN chats c ON c.id = m.chat_id
      JOIN users u ON u.id = m.sender_id
      WHERE c.type = :type
      AND (m.deleted_by IS NULL OR NOT (:userId = ANY(m.deleted_by)))
      AND :userId = ANY(c.participants)  
      AND :receiverId = ANY(c.participants) 
      AND c.is_deleted = false
      AND m.is_deleted = false
      ORDER BY m.created_at ASC;
    `;

    const messages = await sequelize.query(query, {
      replacements: { userId, receiverId, type: CHAT_TYPE.INDIVIDUAL },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Messages retrieved successfully.",
      data: messages,
      error: null,
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: null,
      error: error.message,
    });
  }
};


// Function to send a message in a group chat
const sendGroupMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    let { groupId, message } = req.body;

    // Validate the request body
    const validation = new VALIDATOR(req.body, {
      groupId: validationRules.Chat.id,
      message: validationRules.Message.message,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if the group chat exists and sender is a participant
    const chat = await Chat.findOne({
      where: {
        id: groupId,
        type: CHAT_TYPE.GROUP,
        participants: { [Op.contains]: [senderId] },
      },
      attributes: ["id", "participants"],
    });

    if (!chat) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Group chat not found or access denied.",
        data: "",
        error: "",
      });
    }

    // Create a new message entry
    const newMessage = await Message.create({
      id: uuidv4(),
      chatId: chat.id,
      senderId,
      message,
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: senderId,
    });

    // Emit the message to all group participants
    const io = req.io;
    chat.participants.forEach((participantId) => {
      if (participantId !== senderId) {
        const receiverSocketId = getReceiverSocketId(participantId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newGroupMessage", {
            ...newMessage.toJSON(), 
            senderName: req.user.name
          });          
        }
      }
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Message sent successfully",
      data: {
        groupChatId: chat.id,
        messageId: newMessage.id,
        senderId,
        message: newMessage.message,
      },
      error: "",
    });
  } catch (error) {
    console.error("Error sending group message:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};

// Function to retrieve messages from a group chat
const getGroupMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    // Validate groupId
    const validation = new VALIDATOR(req.params, {
      groupId: validationRules.Chat.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    const query = `
      SELECT 
        m.id AS "messageId",
        m.chat_id AS "chatId",
        m.sender_id AS "senderId",
        m.message,
        m.created_at AS "createdAt",
        u.name AS "senderName"
      FROM messages m
      JOIN chats c ON c.id = m.chat_id
      JOIN users u ON u.id = m.sender_id
      WHERE c.type = :type
      AND :userId = ANY(c.participants)
      AND (m.deleted_by IS NULL OR NOT (:userId = ANY(m.deleted_by)))  
      AND c.id = :groupId
      AND c.is_deleted = false
      AND m.is_deleted = false
      ORDER BY m.created_at ASC;
    `;

    const messages = await sequelize.query(query, {
      replacements: { userId, groupId, type: CHAT_TYPE.GROUP },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Group messages retrieved successfully.",
      data: messages,
      error: null,
    });
  } catch (error) {
    console.error("Error retrieving group messages:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: null,
      error: error.message,
    });
  }
};
const deleteMessageById = async(req,res) => {
   try {
    const userId = req.user.id;
    const {messageId,deleteForEveryone} = req.body;

    const validation = new VALIDATOR(req.body,{
      messageId : validationRules.Message.id,
      deleteForEveryone: validationRules.Message.deleteForEveryone,
    })

    if(validation.fails()){
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    const message = await Message.findOne({
      where : {id:messageId,isDeleted : false},
      attributes : ['id']
    })

    if(!message){
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Message not found ",
        data: "",
        error: "",
      });
    }

    if(deleteForEveryone){

      await Message.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) , deletedBy : [userId] },
        { where: {id: messageId } }
      )

      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Message deleted for everyone.",
        data: "",
        error: "",
      });
    }else {
      
      await Message.update(
        { deletedBy: sequelize.fn("array_append", sequelize.col("deleted_by"), userId) },
        { where: {id: messageId } }
      );

      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Message deleted for you.",
        data: "",
        error: "",
      });
    }
   } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "An error occurred while deleting message.",
      data: "",
      error: error.message,
    });
   }
}

const deleteAllMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId, deleteForEveryone } = req.body;

    // Validation
    const validation = new VALIDATOR(req.body, {
      chatId: validationRules.Chat.id,
      deleteForEveryone: validationRules.Message.deleteForEveryone,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if the chat exists and the user is a participant
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        participants: { [Op.contains]: [userId] },
        isDeleted : false
      },
      attributes: ["id"],
    });

    if (!chat) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Chat not found or access denied.",
        data: "",
        error: "",
      });
    }

    if (deleteForEveryone) {
      
      await Message.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000) , deletedBy : [userId] },
        { where: { chatId } }
      );

      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "All messages deleted for everyone.",
        data: "",
        error: "",
      });
    } else {
      
      await Message.update(
        { deletedBy: sequelize.fn("array_append", sequelize.col("deleted_by"), userId) },
        { where: { chatId } }
      );

      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "All messages deleted for you.",
        data: "",
        error: "",
      });
    }
  } catch (error) {
    console.error("Error deleting messages:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "An error occurred while deleting messages.",
      data: "",
      error: error.message,
    });
  }
};

module.exports = { sendMessage, getMessages, sendGroupMessage, getGroupMessages,deleteMessageById,deleteAllMessages };
