const asyncHandler = require("express-async-handler");
const Status = require("../models/statusModel");
const User = require("../models/userModel");

// Create new status
const createStatus = asyncHandler(async (req, res) => {
    const { mediaUrl, mediaType, caption } = req.body;

    if (mediaType === "text" && !caption) {
        res.status(400);
        throw new Error("Caption is required for text status");
    }

    if ((mediaType === "image" || mediaType === "video") && !mediaUrl) {
        res.status(400);
        throw new Error("Media URL is required for image/video status");
    }

    if (!["image", "video", "text"].includes(mediaType)) {
        res.status(400);
        throw new Error("Invalid media type");
    }

    // Set expiry to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const status = await Status.create({
        user: req.user._id,
        mediaUrl,
        mediaType,
        caption: caption || "",
        expiresAt,
    });

    const populatedStatus = await Status.findById(status._id)
        .populate("user", "name pic")
        .populate("views.user", "name pic");

    res.status(201).json(populatedStatus);
});

// Get all active statuses from all users
const getActiveStatuses = asyncHandler(async (req, res) => {
    const now = new Date();

    // Find all non-expired statuses
    const statuses = await Status.find({
        expiresAt: { $gt: now },
    })
        .populate("user", "name pic email")
        .populate("views.user", "name pic")
        .sort({ createdAt: -1 });

    // Group by user
    const groupedStatuses = statuses.reduce((acc, status) => {
        const userId = status.user._id.toString();
        if (!acc[userId]) {
            acc[userId] = {
                user: status.user,
                statuses: [],
            };
        }
        acc[userId].statuses.push(status);
        return acc;
    }, {});

    res.json(Object.values(groupedStatuses));
});

// Get specific user's active statuses
const getUserStatuses = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const now = new Date();

    const statuses = await Status.find({
        user: userId,
        expiresAt: { $gt: now },
    })
        .populate("user", "name pic email")
        .populate("views.user", "name pic")
        .sort({ createdAt: 1 });

    res.json(statuses);
});

// Mark status as viewed
const markStatusViewed = asyncHandler(async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
        res.status(404);
        throw new Error("Status not found");
    }

    // Check if already viewed by this user
    const alreadyViewed = status.views.some(
        (view) => view.user.toString() === userId.toString()
    );

    if (!alreadyViewed) {
        status.views.push({ user: userId, viewedAt: new Date() });
        await status.save();
    }

    const updatedStatus = await Status.findById(statusId)
        .populate("user", "name pic")
        .populate("views.user", "name pic");

    res.json(updatedStatus);
});

// Delete status
const deleteStatus = asyncHandler(async (req, res) => {
    const { statusId } = req.params;

    const status = await Status.findById(statusId);

    if (!status) {
        res.status(404);
        throw new Error("Status not found");
    }

    // Only owner can delete
    if (status.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to delete this status");
    }

    await Status.findByIdAndDelete(statusId);

    res.json({ message: "Status deleted successfully", statusId });
});

// Delete expired statuses (cleanup)
const deleteExpiredStatuses = asyncHandler(async (req, res) => {
    const now = new Date();

    const result = await Status.deleteMany({
        expiresAt: { $lt: now },
    });

    res.json({
        message: "Expired statuses deleted",
        count: result.deletedCount,
    });
});

module.exports = {
    createStatus,
    getActiveStatuses,
    getUserStatuses,
    markStatusViewed,
    deleteStatus,
    deleteExpiredStatuses,
};
