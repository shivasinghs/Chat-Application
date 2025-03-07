const express = require('express');
const router = express.Router();
const usersAuthRoutes = require('./auth/authRoute')
const messageRoutes = require('./message/messageRoutes')
const groupRoutes = require('./group/groupRoutes')
const searchUsersOrGroupsRoute = require('./search/searchUsersOrGroupsRoute')
const chatAiRoute = require('./message/chatAiRoute')

//signup and login route for user
router.use('/user',usersAuthRoutes)
router.use('/message',messageRoutes)
router.use('/group',groupRoutes)
router.use('/search',searchUsersOrGroupsRoute)
router.use('/chat',chatAiRoute)

module.exports = router;