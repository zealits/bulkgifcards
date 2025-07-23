const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emailListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailList",
      required: true,
    },
    // Giftogram API details
    giftogramOrderId: {
      type: String,
      required: true,
    },
    externalId: {
      type: String,
      required: true,
      unique: true,
    },
    campaignId: {
      type: String,
      required: true,
    },
    // Gift card details
    amount: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    currency: {
      type: String,
      default: "USD",
    },
    // Recipient details
    recipientEmail: {
      type: String,
      required: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    recipientName: {
      type: String,
      required: true,
    },
    // Message and customization
    message: {
      type: String,
      default: "Enjoy your gift card!",
      maxlength: 500,
    },
    subject: {
      type: String,
      default: "Your Gift Card is Ready!",
    },
    // Status tracking
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "failed", "cancelled"],
      default: "pending",
    },
    giftogramStatus: {
      type: String,
      default: "pending",
    },
    // Delivery tracking
    deliveredAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    // Metadata
    metadata: {
      mock: {
        type: Boolean,
        default: false,
      },
      retryCount: {
        type: Number,
        default: 0,
      },
      lastStatusCheck: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
giftCardSchema.index({ userId: 1, createdAt: -1 });
giftCardSchema.index({ emailListId: 1 });
giftCardSchema.index({ giftogramOrderId: 1 });
giftCardSchema.index({ externalId: 1 });
giftCardSchema.index({ status: 1 });
giftCardSchema.index({ recipientEmail: 1 });

// Virtual for total cost (amount + any fees)
giftCardSchema.virtual("totalCost").get(function () {
  return this.amount; // Currently no additional fees
});

// Instance method to update status from Giftogram
giftCardSchema.methods.updateFromGiftogram = function (giftogramData) {
  this.giftogramStatus = giftogramData.status;
  this.metadata.lastStatusCheck = new Date();

  // Map Giftogram status to our status
  switch (giftogramData.status) {
    case "delivered":
    case "sent":
      this.status = "delivered";
      this.deliveredAt = new Date(giftogramData.delivered_at || Date.now());
      break;
    case "failed":
    case "error":
      this.status = "failed";
      this.failureReason = giftogramData.failure_reason || "Unknown error";
      break;
    case "processing":
    case "pending":
      this.status = "processing";
      break;
    case "cancelled":
      this.status = "cancelled";
      break;
    default:
      // Keep current status
      break;
  }

  return this.save();
};

// Static method to get summary statistics
giftCardSchema.statics.getStatsByUser = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGiftCards: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        processingCount: {
          $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
        },
        deliveredCount: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        deliveredAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "delivered"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalGiftCards: 0,
      totalAmount: 0,
      pendingCount: 0,
      processingCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      deliveredAmount: 0,
    }
  );
};

// Static method to get recent gift cards
giftCardSchema.statics.getRecentByUser = async function (userId, limit = 10) {
  return this.find({ userId })
    .populate("emailListId", "fileName")
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-metadata");
};

module.exports = mongoose.model("GiftCard", giftCardSchema);
