const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

// To Register User  Sign up page
// asyncHandler to handel errors
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body; // Destructuring request body

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  // email for every user is unique
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      status: user.status,
      token: generateToken(user._id), // return jwt  auth token
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

// For User Authentication in login page
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body; // taking value from frontend , so tell server to accept the data

  const user = await User.findOne({ email }); // email for every user is unique

  if (user && (await user.matchPassword(password))) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      status: user.status,
      token: generateToken(user._id), // jwt for authorization
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// To search User
// API Query --> /api/user?search=zuken
const allUser = asyncHandler(async (req, res) => {
  // The $or operator performs a logical OR operation on an array of one or more <expressions> and selects the documents that satisfy at least one of the <expressions>.

  //$regex Provides regular expression capabilities for pattern matching strings in queries.

  // $options: i --> Case insensitivity to match upper and lower cases.
  const keyword = req.query.search
    ? {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
    }
    : {}; // else part

  //$ne --> not equals;
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

// Update user status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (status === undefined || status === null) {
    res.status(400);
    throw new Error("Status is required");
  }

  if (status.length > 139) {
    res.status(400);
    throw new Error("Status must be 139 characters or less");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { status: status },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    pic: user.pic,
    status: user.status,
    token: generateToken(user._id),
  });
});

// Update user profile (name, pic)
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, pic } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.name = name || user.name;
    user.pic = pic || user.pic;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      pic: updatedUser.pic,
      status: updatedUser.status,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = { allUser, registerUser, authUser, updateUserStatus, updateUserProfile };
