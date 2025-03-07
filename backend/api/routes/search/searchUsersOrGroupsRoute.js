const express = require("express");
const router = express.Router();
const SearchUserOrGroupController  = require("../../controller/search/SearchUserOrGroupController"); 
const authMiddleware = require('../../middleware/authMiddleware')

router.get("/users-or-group",authMiddleware,SearchUserOrGroupController.searchUsersOrGroups);

module.exports = router;
