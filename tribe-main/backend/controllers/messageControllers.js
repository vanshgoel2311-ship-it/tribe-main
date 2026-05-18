const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const sendMessage = asyncHandler(async (req, res) => {
  // sender Info from protect middleware
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid Data Passed into request");
    res.sendStatus(400);
  }

  // According to Chat Schema
  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    res.status(400);
    throw new Error("ChatId is required");
  }

  try {
    await Message.updateMany(
      { chat: chatId },
      { $addToSet: { readBy: req.user._id } }
    );
    res.status(200).send("Messages marked as read");
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  console.log("Delete message request - messageId:", messageId);
  console.log("Delete message request - user:", req.user._id);

  const message = await Message.findById(messageId);

  if (!message) {
    console.log("Message not found:", messageId);
    res.status(404);
    throw new Error("Message not found");
  }

  console.log("Message found - sender:", message.sender.toString());

  // Check if the user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    console.log("Unauthorized delete attempt");
    res.status(401);
    throw new Error("You can only delete your own messages");
  }

  await Message.findByIdAndDelete(messageId);
  console.log("Message deleted successfully");
  res.json({ message: "Message removed" });
});

module.exports = { sendMessage, allMessages, markMessagesAsRead, deleteMessage };
