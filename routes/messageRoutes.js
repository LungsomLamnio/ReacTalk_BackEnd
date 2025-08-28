const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const messageController = require("../controllers/messageController");

router.get("/", verifyToken, messageController.getAllMessages);
router.post("/", verifyToken, messageController.postMessage);

router.get(
  "/private/:userId",
  verifyToken,
  messageController.getPrivateMessages
);
router.post(
  "/private/:userId",
  verifyToken,
  messageController.postPrivateMessage
);

module.exports = router;
