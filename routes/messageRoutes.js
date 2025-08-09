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

router.get("/private/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username")
      .populate("receiver", "username");

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/private/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const { content } = req.body;

  if (!content)
    return res.status(400).json({ message: "Message cannot be empty" });

  try {
    const newMessage = new Message({
      sender: currentUserId,
      receiver: userId,
      content,
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate("sender", "username");
    await savedMessage.populate("receiver", "username");

    res.status(201).json({ message: savedMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
