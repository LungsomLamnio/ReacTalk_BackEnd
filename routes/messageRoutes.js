const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const Message = require("../models/Message");

router.get("/", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "username")
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const newMessage = new Message({
      sender: req.user.id,
      content: req.body.content,
    });
    const savedMessage = await newMessage.save();
    await savedMessage.populate("sender", "username");
    res.status(201).json({ message: savedMessage });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
