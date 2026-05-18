const express = require("express");
const { protect } = require("../middleware/authMiddeleware");
const { model } = require("mongoose");
const {
  sendMessage,
  allMessages,
  markMessagesAsRead,
  deleteMessage,
} = require("../controllers/messageControllers");

const router = express.Router();

// To send a message
router.route("/").post(protect, sendMessage);

// To mark messages as read
router.route("/read").put(protect, markMessagesAsRead);

// To Fetch all Message of a chatId
router.route("/:chatId").get(protect, allMessages);

// To delete a message
router.route("/:messageId").delete(protect, deleteMessage);

module.exports = router;
