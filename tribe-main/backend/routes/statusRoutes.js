const express = require("express");
const {
    createStatus,
    getActiveStatuses,
    getUserStatuses,
    markStatusViewed,
    deleteStatus,
    deleteExpiredStatuses,
} = require("../controllers/statusControllers");
const { protect } = require("../middleware/authMiddeleware");

const router = express.Router();

// Create new status & get all active statuses
router.route("/").post(protect, createStatus).get(protect, getActiveStatuses);

// Get specific user's statuses
router.route("/user/:userId").get(protect, getUserStatuses);

// Mark status as viewed
router.route("/:statusId/view").put(protect, markStatusViewed);

// Delete status
router.route("/:statusId").delete(protect, deleteStatus);

// Cleanup expired statuses (can be called by cron job)
router.route("/cleanup/expired").delete(protect, deleteExpiredStatuses);

module.exports = router;
