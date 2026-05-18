const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const { use } = require("../routes/chatRoutes");

// Create or Access One on One Chat
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  // If chat exists
  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // else create new chat
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    // now store chat in database
    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

// Fetch One on One Chat
const fetchChats = asyncHandler(async (req, res) => {
  try {
    // Find all the chat user is part of and populate and sort
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });

        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    res.send(error.message);
  }
});

//  Create group chat

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  // req.body.user was sent as a string from frontend at backend we are parsing it in form of obj
  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More Than 2 users are required to form a group");
  }

  // push  current user to group
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).send(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//  Rename Group
const renameGroup = asyncHandler(async (req, res) => {
  // get grom frontend
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true, // gives the updated value of group name
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// Remove From Group
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      // remove the user with userId from group chat
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});
// Add To Group
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      // push inside users array of group chat
      $push: { users: userId },
    },
    {
      new: true, // to return the updated field
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

// Update Chat Wallpaper
const updateChatWallpaper = asyncHandler(async (req, res) => {
  const { chatId, wallpaper } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      wallpaper: wallpaper,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// Delete Chat
const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { deleteType } = req.body; // "me" or "everyone"
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is part of the chat
  const isParticipant = chat.users.some(user => user.toString() === userId.toString());
  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorized to delete this chat");
  }

  if (deleteType === "everyone") {
    // Check permissions for delete everyone
    if (chat.isGroupChat) {
      // Only group admin can delete for everyone
      if (chat.groupAdmin.toString() !== userId.toString()) {
        res.status(403);
        throw new Error("Only group admin can delete chat for everyone");
      }
    }
    // For one-on-one, either participant can delete for everyone

    // Delete all messages associated with this chat
    const Message = require("../models/messageModel");
    await Message.deleteMany({ chat: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: "Chat deleted for everyone", chatId });
  } else {
    // Delete for me - remove user from chat or mark as deleted
    if (chat.isGroupChat) {
      // Remove user from participants
      await Chat.findByIdAndUpdate(chatId, {
        $pull: { users: userId },
      });
      res.json({ message: "Chat deleted for you", chatId });
    } else {
      // For one-on-one, we'll use a deletedFor array approach
      // Add deletedFor field to chat model if it doesn't exist
      if (!chat.deletedFor) {
        chat.deletedFor = [];
      }

      if (!chat.deletedFor.includes(userId)) {
        chat.deletedFor.push(userId);
        await chat.save();
      }

      res.json({ message: "Chat deleted for you", chatId });
    }
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  updateChatWallpaper,
  deleteChat,
};
