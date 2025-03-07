const ChatAiController = require("../../controller/message/ChatAiController")
const express = require("express")
const router = express.Router()
const authMiddleware = require('../../middleware/authMiddleware')

router.post("/ai",authMiddleware,ChatAiController.chatWithAI)
router.get("/get-ai-messages",authMiddleware,ChatAiController.getAIMessages)

module.exports = router;