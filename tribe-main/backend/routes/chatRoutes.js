const express = require("express");
const { protect } = require("../middleware/authMiddeleware");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  updateChatWallpaper,
  deleteChat,
} = require("../controllers/chatControllers");

const router = express.Router();

// "/"
// post --> for Accessing or Creating Chat
// protect middelware to logged in user auth

// get --> to fetch all of the previous chats of user
router.route("/").post(protect, accessChat).get(protect, fetchChats);

// Group
// put request --> to update
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/groupremove").put(protect, removeFromGroup);
router.route("/groupadd").put(protect, addToGroup);
router.route("/wallpaper").put(protect, updateChatWallpaper);

// Delete chat route
router.route("/:chatId").delete(protect, deleteChat);

module.exports = router;
