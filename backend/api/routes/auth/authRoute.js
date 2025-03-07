const express = require("express");
const AuthController = require("../../controller/auth/AuthController");
const { upload } = require("../../../config/multer");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// Standard Signup & Login Routes
router.post("/signup", upload.single("image"), AuthController.signUp);
router.post("/login", AuthController.login);
router.get("/get-by-id", authMiddleware, AuthController.getUserById);
router.get("/get-others", authMiddleware, AuthController.getOtherUsers);


module.exports = router;
