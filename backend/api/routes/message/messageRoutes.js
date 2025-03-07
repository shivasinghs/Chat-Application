const MessageController = require("../../controller/message/MessageController")
const express = require("express")
const router = express.Router()
const authMiddleware = require('../../middleware/authMiddleware')

router.post("/send",authMiddleware,MessageController.sendMessage)
router.get("/get/:receiverId",authMiddleware,MessageController.getMessages)
router.post("/send-group",authMiddleware,MessageController.sendGroupMessage)
router.get("/get-group/:groupId",authMiddleware,MessageController.getGroupMessages)
router.post("/delete-all",authMiddleware,MessageController.deleteAllMessages)
router.post("/delete-by-id",authMiddleware,MessageController.deleteMessageById)

module.exports = router;
