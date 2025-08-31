const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// User signup controller
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
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
    console.error("Signup Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// User login controller
exports.login = async (req, res) => {
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
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get user profile controller
exports.getProfile = async (req, res) => {
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
    console.error("Get Profile Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Search user by username controller
exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res
        .status(400)
        .json({ message: "Username query parameter is required" });
    }
    const currentUserId = req.user.id; // from verifyToken middleware

    // Find users matching search
    const users = await User.find({
      username: { $regex: username, $options: "i" },
    }).select("username email bio followers");

    // Map and check if current user already follows them
    const usersWithFollowStatus = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      isFollowed: user.followers.some((followerId) =>
        followerId.equals(currentUserId)
      ),
    }));

    res.status(200).json({ users: usersWithFollowStatus });
  } catch (err) {
    console.error("Search Users Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Follow user controller
exports.followUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Prevent duplicate follow
    if (currentUser.followings.includes(targetUser._id)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Add current user to target's followers only if not already present
    if (!targetUser.followers.includes(currentUser._id)) {
      targetUser.followers.push(currentUser._id);
    }

    currentUser.followings.push(targetUser._id);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (err) {
    console.error("Follow User Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Unfollow user controller
exports.unfollowUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    // Check currentUser is following targetUser
    if (!currentUser.followings.includes(targetUser._id)) {
      return res.status(400).json({ message: "You do not follow this user" });
    }

    // Remove targetUser from currentUser.followings
    currentUser.followings = currentUser.followings.filter(
      (id) => !id.equals(targetUser._id)
    );

    // Remove currentUser from targetUser.followers
    targetUser.followers = targetUser.followers.filter(
      (id) => !id.equals(currentUser._id)
    );

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow User Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get followings controller
exports.getFollowings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "followings",
      "username email bio"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ followings: user.followings });
  } catch (err) {
    console.error("Get Followings Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get followers controller
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "followers",
      "username email bio"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ followers: user.followers });
  } catch (err) {
    console.error("Get Followers Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user profile controller with multer file upload
exports.updateProfile = async (req, res) => {
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
    console.error("Update Profile Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Fetch public user profile
exports.getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by ID excluding sensitive fields
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followers || [],
        followings: user.followings || [],
      },
      message: "User profile fetched successfully",
    });
  } catch (err) {
    console.error("Get User Profile Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};
