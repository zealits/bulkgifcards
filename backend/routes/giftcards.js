const express = require("express");
const router = express.Router();
const GiftCard = require("../models/GiftCard");
const EmailList = require("../models/EmailList");
const { authenticateToken } = require("../middleware/auth");
const giftogramService = require("../services/giftogramService");

// @route   GET /api/giftcards/campaigns
// @desc    Get available gift card campaigns
// @access  Private
router.get("/campaigns", authenticateToken, async (req, res) => {
  try {
    const campaigns = await giftogramService.getCampaigns();

    res.json({
      success: true,
      data: campaigns.data,
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift card campaigns",
    });
  }
});

// @route   POST /api/giftcards/send
// @desc    Send gift cards to selected email addresses
// @access  Private
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { emailListId, selectedEmails, amount, message, campaignId } = req.body;

    // Validation
    if (!emailListId || !selectedEmails || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide emailListId, selectedEmails, and amount",
      });
    }

    if (!Array.isArray(selectedEmails) || selectedEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one email address",
      });
    }

    if (amount <= 0 || amount > 1000) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between $1 and $1000",
      });
    }

    // Verify email list belongs to user
    const emailList = await EmailList.findOne({ _id: emailListId, userId });
    if (!emailList) {
      return res.status(404).json({
        success: false,
        message: "Email list not found",
      });
    }

    // Validate selected emails exist in the list
    const validEmails = emailList.emails.filter((email) => selectedEmails.includes(email.email));

    if (validEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses found in selection",
      });
    }

    // Process gift cards
    const result = await giftogramService.processBulkGiftCards(validEmails, amount, message || "Enjoy your gift card!");

    // Save gift card records to database
    const giftCardRecords = [];

    for (const success of result.results) {
      const giftCard = new GiftCard({
        userId,
        emailListId,
        giftogramOrderId: success.orderId,
        externalId: `GC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        campaignId: campaignId || process.env.GIFTOGRAM_CAMPAIGN_ID,
        amount,
        recipientEmail: success.email,
        recipientName: success.name || success.email.split("@")[0],
        message: message || "Enjoy your gift card!",
        status: "pending",
        metadata: {
          mock: success.orderId ? success.orderId.startsWith("mock-") : false,
        },
      });

      giftCardRecords.push(giftCard);
    }

    // Save all records
    if (giftCardRecords.length > 0) {
      await GiftCard.insertMany(giftCardRecords);
    }

    // Update email statuses in the original list
    const updatedEmails = emailList.emails.map((email) => {
      if (selectedEmails.includes(email.email)) {
        return { ...email, status: "sent" };
      }
      return email;
    });

    emailList.emails = updatedEmails;
    await emailList.save();

    res.json({
      success: true,
      message: `Successfully processed gift cards for ${result.successful} recipients`,
      data: {
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        totalAmount: result.successful * amount,
        results: result.results,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Send gift cards error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send gift cards",
    });
  }
});

// @route   GET /api/giftcards/history
// @desc    Get gift card history for user
// @access  Private
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const giftCards = await GiftCard.find({ userId })
      .populate("emailListId", "fileName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-metadata");

    const total = await GiftCard.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        giftCards,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get gift card history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift card history",
    });
  }
});

// @route   GET /api/giftcards/stats
// @desc    Get gift card statistics for user
// @access  Private
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await GiftCard.getStatsByUser(userId);
    const recentCards = await GiftCard.getRecentByUser(userId, 5);

    res.json({
      success: true,
      data: {
        stats,
        recentCards,
      },
    });
  } catch (error) {
    console.error("Get gift card stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift card statistics",
    });
  }
});

// @route   GET /api/giftcards/:id/status
// @desc    Get gift card status and update from Giftogram
// @access  Private
router.get("/:id/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const giftCardId = req.params.id;

    const giftCard = await GiftCard.findOne({ _id: giftCardId, userId });

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: "Gift card not found",
      });
    }

    // Update status from Giftogram if it's not a mock order
    if (!giftCard.metadata.mock) {
      try {
        const giftogramStatus = await giftogramService.getOrder(giftCard.giftogramOrderId);
        if (giftogramStatus.success) {
          await giftCard.updateFromGiftogram(giftogramStatus.data);
        }
      } catch (error) {
        console.error("Error updating gift card status:", error);
        // Continue with existing status
      }
    }

    res.json({
      success: true,
      data: giftCard,
    });
  } catch (error) {
    console.error("Get gift card status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gift card status",
    });
  }
});

// @route   DELETE /api/giftcards/:id
// @desc    Cancel a pending gift card (if possible)
// @access  Private
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const giftCardId = req.params.id;

    const giftCard = await GiftCard.findOne({ _id: giftCardId, userId });

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: "Gift card not found",
      });
    }

    if (giftCard.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a delivered gift card",
      });
    }

    // Mark as cancelled (actual cancellation with Giftogram would require API call)
    giftCard.status = "cancelled";
    await giftCard.save();

    res.json({
      success: true,
      message: "Gift card cancelled successfully",
      data: giftCard,
    });
  } catch (error) {
    console.error("Cancel gift card error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel gift card",
    });
  }
});

module.exports = router;
