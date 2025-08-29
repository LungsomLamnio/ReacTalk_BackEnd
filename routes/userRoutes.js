const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middlewares/auth");
const userController = require("../controllers/userController");

// Setup multer storage and upload instance
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
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/profile", verifyToken, userController.getProfile);
router.get("/search/:username", userController.searchUsers);
router.post("/follow/:id", verifyToken, userController.followUser);
router.post("/unfollow/:id", verifyToken, userController.unfollowUser);
router.get("/following", verifyToken, userController.getFollowings);
router.get("/followers", verifyToken, userController.getFollowers);
router.get("/search", userController.searchUsers);
router.post(
  "/update-profile",
  verifyToken,
  upload.single("profilePicture"),
  userController.updateProfile
);

module.exports = router;
