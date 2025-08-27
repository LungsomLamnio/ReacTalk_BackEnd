const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.post("/signup", async (req, res) => {
  console.log("Signup route hit", req.body);
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(`Signup Error: ${err.message}`);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/login", async (req, res) => {
  console.log("Login route hit");
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        followers: user.followers,
        followings: user.followings,
      },
    });
  } catch (err) {
    console.error(`Login Error: ${err.message}`);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/chat", verifyToken, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile data fetched successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followers || [],
        followings: user.followings || [],
      },
    });
  } catch (err) {
    console.error(`Profile Fetch Error: ${err.message}`);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/search/:username", async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    }).select("_id username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/follow/:id", verifyToken, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    if (currentUser.followings.includes(targetUser._id)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    currentUser.followings.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/following", verifyToken, async (req, res) => {
  try {
    const userID = req.user.id;
    const user = await User.findById(userID).populate(
      "followings",
      "username email bio"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ followings: user.followings });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({ message: "Server Error" });
  }
});

router.get("/followers", verifyToken, async (req, res) => {
  try {
    const userID = req.user.id;
    const user = await User.findById(userID).populate(
      "followers",
      "username email bio"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ followers: user.followers });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({ message: "Server Error" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res
        .status(400)
        .json({ message: "Username query parameter is required" });
    }

    const user = await User.find({
      username: { $regex: username, $options: "i" },
    }).select("username email bio");
    res.status(200).json({ user });
  } catch (err) {
    console.log(`Error: ${err.message}`);
    res.status(500).json({ message: "Server Error" });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/profile-pictures");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

router.post(
  "/update-profile",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { username, bio } = req.body;
      const updateData = { username, bio };

      if (req.file) {
        updateData.avatar = `/uploads/profile-pictures/${req.file.filename}`;
      }

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        user: {
          id: user._id,
          username: user.username,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email,
          followers: user.followers,
          followings: user.followings,
        },
        message: "Profile updated successfully",
      });
    } catch (err) {
      console.error("Error updating profile:", err.message);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  }
);

module.exports = router;
