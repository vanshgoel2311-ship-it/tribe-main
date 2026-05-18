const mongoose = require("mongoose");

const statusSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mediaUrl: {
            type: String,
        },
        mediaType: {
            type: String,
            enum: ["image", "video", "text"],
            required: true,
        },
        caption: {
            type: String,
            default: "",
            maxlength: 200,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        views: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                viewedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

// Index for auto-deletion and efficient queries
statusSchema.index({ expiresAt: 1 });
statusSchema.index({ user: 1, expiresAt: 1 });

// Automatically set expiresAt to 24 hours from creation
statusSchema.pre("save", function (next) {
    if (this.isNew && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
    next();
});

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
