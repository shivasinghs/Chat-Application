const GroupController = require("../../controller/group/GroupController")
const express = require("express")
const router = express.Router()
const authMiddleware = require('../../middleware/authMiddleware')

router.post("/create",authMiddleware,GroupController.createGroup);
router.get("/get/:groupId",authMiddleware,GroupController.getGroupById);
router.get("/get-all",authMiddleware,GroupController.getAllGroups);
router.post("/add-members",authMiddleware,GroupController.addMembers);
router.post("/remove-members",authMiddleware,GroupController.removeMember);
router.post("/delete/:groupId",authMiddleware,GroupController.deleteGroup);

module.exports = router;