const { Message, Chat,User } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4, CHAT_TYPE, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");
const axios = require("axios");

let aiUser = null;

const newUser = async () => {
    try {
       
        aiUser = await User.findOne({ where: { email: "groqai@example.com" } });

        if (!aiUser) {
           
            aiUser = await User.create({
                id: uuidv4(),
                name: "GroqAI",
                email: "groqai@example.com",
                password: "securepassword", 
                gender: "Other",
                createdAt: Math.floor(Date.now() / 1000),
            });
            console.log("AI User Created:", aiUser.toJSON());
        }
    } catch (error) {
        console.error("Error creating AI user:", error);
    }
};

newUser();

const chatWithAI = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message } = req.body;

        // Validate input
        const validation = new VALIDATOR(req.body, {
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

        // Fetch AI response from Groq API
        const groqResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: message }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
            }
        );

        const botReply = groqResponse.data.choices[0].message.content;

        const groqAiId = aiUser.id;

        let chat = await Chat.findOne({
            where: {
                type: CHAT_TYPE.AI_CHAT,
                participants: { [Op.contains]: [userId,groqAiId] },
            },
            attributes: ["id", "participants", "type"],
        });

        let newMessage, aiMessage;

        await sequelize.transaction(async (transaction) => {
            if (!chat) {
                chat = await Chat.create(
                    {
                        id: uuidv4(),
                        type: CHAT_TYPE.AI_CHAT,
                        participants: [userId,groqAiId],
                        createdBy: userId,
                        createdAt: Math.floor(Date.now() / 1000),
                    },
                    { transaction }
                );
            }

            newMessage = await Message.create(
                {
                    id: uuidv4(),
                    chatId: chat.id,
                    senderId: userId,
                    message,
                    createdAt: Math.floor(Date.now() / 1000),
                    createdBy: userId,
                },
                { transaction }
            );

            aiMessage = await Message.create(
                {
                    id: uuidv4(),
                    chatId: chat.id,
                    senderId: groqAiId,
                    message: botReply,
                    createdAt: Math.floor(Date.now() / 1000),
                    createdBy: groqAiId,
                },
                { transaction }
            );
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "AI response received",
            data: { botReply,chatId : chat.id },
            error: "",
        });
    } catch (error) {
        console.error("Error communicating with Groq:", error.response?.data || error.message);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error",
            data: "",
            error: error.message,
        });
    }
};

const getAIMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        
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
            AND :groqAiId = ANY(c.participants)
            AND c.is_deleted = false
            AND m.is_deleted = false
            ORDER BY m.created_at ASC;
        `;

        const messages = await sequelize.query(query, {
            replacements: { userId, type: CHAT_TYPE.AI_CHAT,groqAiId: aiUser.id },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "AI chat messages retrieved successfully.",
            data: messages,
            error: null,
        });
    } catch (error) {
        console.error("Error retrieving AI chat messages:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: null,
            error: error.message,
        });
    }
};


module.exports = { chatWithAI, getAIMessages };

