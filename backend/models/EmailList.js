const mongoose = require("mongoose");

const emailListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    emails: [
      {
        email: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          enum: ["pending", "sent", "failed"],
          default: "pending",
        },
      },
    ],
    totalEmails: {
      type: Number,
      default: 0,
    },
    validEmails: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailList", emailListSchema);
