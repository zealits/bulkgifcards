const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const EmailList = require("../models/EmailList");
const GiftCard = require("../models/GiftCard");
const { authenticateToken } = require("../middleware/auth");
const { processExcelFile } = require("../utils/excelProcessor");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   GET /api/dashboard/stats
// @desc    Get dashboard stats
// @access  Private
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all email lists for this user
    const emailLists = await EmailList.find({ userId });

    // Get gift card stats
    const giftCardStats = await GiftCard.getStatsByUser(userId);

    // Calculate stats
    let totalUploads = emailLists.length;
    let totalEmails = 0;
    let totalValidEmails = 0;
    let pendingEmails = 0;
    let sentEmails = 0;
    let failedEmails = 0;

    emailLists.forEach((list) => {
      totalEmails += list.totalEmails;
      totalValidEmails += list.validEmails;

      list.emails.forEach((email) => {
        switch (email.status) {
          case "pending":
            pendingEmails++;
            break;
          case "sent":
            sentEmails++;
            break;
          case "failed":
            failedEmails++;
            break;
        }
      });
    });

    res.json({
      success: true,
      data: {
        totalUploads,
        totalEmails,
        totalValidEmails,
        pendingEmails,
        sentEmails,
        failedEmails,
        // Gift card statistics
        giftCards: {
          totalGiftCards: giftCardStats.totalGiftCards,
          totalGiftCardAmount: giftCardStats.totalAmount,
          pendingGiftCards: giftCardStats.pendingCount,
          deliveredGiftCards: giftCardStats.deliveredCount,
          failedGiftCards: giftCardStats.failedCount,
        },
        recentUploads: emailLists
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
          .slice(0, 5)
          .map((list) => ({
            id: list._id,
            fileName: list.fileName,
            totalEmails: list.totalEmails,
            validEmails: list.validEmails,
            uploadedAt: list.uploadedAt,
          })),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard stats",
    });
  }
});

// @route   POST /api/dashboard/upload
// @desc    Upload and process Excel file
// @access  Private
router.post("/upload", authenticateToken, upload.single("excelFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user._id;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Process the Excel file
    const result = processExcelFile(filePath);

    if (!result.success) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message: "Failed to process Excel file: " + result.error,
      });
    }

    if (result.emails.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message: "No valid email addresses found in the uploaded file",
      });
    }

    // Save to database
    const emailList = new EmailList({
      userId,
      fileName,
      filePath,
      emails: result.emails,
      totalEmails: result.totalEmails,
      validEmails: result.validEmails,
    });

    await emailList.save();

    res.json({
      success: true,
      message: `Successfully processed ${result.validEmails} email addresses from ${fileName}`,
      data: {
        id: emailList._id,
        fileName: emailList.fileName,
        totalEmails: emailList.totalEmails,
        validEmails: emailList.validEmails,
        uploadedAt: emailList.uploadedAt,
        emails: emailList.emails.slice(0, 10), // Return first 10 emails for preview
      },
    });
  } catch (error) {
    console.error("File upload error:", error);

    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error during file upload",
    });
  }
});

// @route   GET /api/dashboard/email-lists
// @desc    Get all email lists for the user
// @access  Private
router.get("/email-lists", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const emailLists = await EmailList.find({ userId })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-emails"); // Don't include emails array in list view

    const total = await EmailList.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        emailLists,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get email lists error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching email lists",
    });
  }
});

// @route   GET /api/dashboard/email-lists/:id
// @desc    Get specific email list with all emails
// @access  Private
router.get("/email-lists/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const listId = req.params.id;

    const emailList = await EmailList.findOne({ _id: listId, userId });

    if (!emailList) {
      return res.status(404).json({
        success: false,
        message: "Email list not found",
      });
    }

    res.json({
      success: true,
      data: emailList,
    });
  } catch (error) {
    console.error("Get email list error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching email list",
    });
  }
});

// @route   DELETE /api/dashboard/email-lists/:id
// @desc    Delete email list
// @access  Private
router.delete("/email-lists/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const listId = req.params.id;

    const emailList = await EmailList.findOne({ _id: listId, userId });

    if (!emailList) {
      return res.status(404).json({
        success: false,
        message: "Email list not found",
      });
    }

    // Delete the uploaded file
    if (fs.existsSync(emailList.filePath)) {
      fs.unlinkSync(emailList.filePath);
    }

    // Delete from database
    await EmailList.findByIdAndDelete(listId);

    res.json({
      success: true,
      message: "Email list deleted successfully",
    });
  } catch (error) {
    console.error("Delete email list error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting email list",
    });
  }
});

// @route   GET /api/dashboard/emails/:listId
// @desc    Get paginated emails from a specific list
// @access  Private
router.get("/emails/:listId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const listId = req.params.listId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const emailList = await EmailList.findOne({ _id: listId, userId });

    if (!emailList) {
      return res.status(404).json({
        success: false,
        message: "Email list not found",
      });
    }

    const emails = emailList.emails.slice(skip, skip + limit);
    const total = emailList.emails.length;

    res.json({
      success: true,
      data: {
        emails,
        listInfo: {
          id: emailList._id,
          fileName: emailList.fileName,
          totalEmails: emailList.totalEmails,
          validEmails: emailList.validEmails,
          uploadedAt: emailList.uploadedAt,
        },
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get emails error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching emails",
    });
  }
});

module.exports = router;
