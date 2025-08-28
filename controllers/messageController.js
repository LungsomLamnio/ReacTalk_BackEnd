const Message = require("../models/Message");

// Controller to get all public messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "username")
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Controller to post a public message
exports.postMessage = async (req, res) => {
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
};

// Controller to get private messages between current user and another user
exports.getPrivateMessages = async (req, res) => {
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
    res.status(500).json({ message: "Server Error" });
  }
};

// Controller to post a private message
exports.postPrivateMessage = async (req, res) => {
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
    res.status(500).json({ message: "Server Error" });
  }
};
