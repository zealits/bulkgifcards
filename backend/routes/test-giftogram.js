const express = require("express");
const router = express.Router();
const giftogramService = require("../services/giftogramService");

// @route   GET /api/test-giftogram/config
// @desc    Test Giftogram configuration
// @access  Public (for testing only)
router.get("/config", (req, res) => {
  console.log("=== GIFTOGRAM CONFIGURATION TEST ===");
  
  const config = {
    apiUrl: process.env.GIFTOGRAM_API_URL,
    apiKey: process.env.GIFTOGRAM_API_KEY ? `${process.env.GIFTOGRAM_API_KEY.substring(0, 10)}...` : "NOT SET",
    environment: process.env.GIFTOGRAM_ENVIRONMENT,
    campaignId: process.env.GIFTOGRAM_CAMPAIGN_ID,
  };
  
  console.log("Configuration:", config);
  
  res.json({
    success: true,
    message: "Giftogram configuration check",
    config,
    envVariablesSet: {
      GIFTOGRAM_API_URL: !!process.env.GIFTOGRAM_API_URL,
      GIFTOGRAM_API_KEY: !!process.env.GIFTOGRAM_API_KEY,
      GIFTOGRAM_ENVIRONMENT: !!process.env.GIFTOGRAM_ENVIRONMENT,
      GIFTOGRAM_CAMPAIGN_ID: !!process.env.GIFTOGRAM_CAMPAIGN_ID,
    }
  });
});

// @route   GET /api/test-giftogram/campaigns
// @desc    Test fetching campaigns from Giftogram API
// @access  Public (for testing only)
router.get("/campaigns", async (req, res) => {
  try {
    console.log("=== TESTING GIFTOGRAM CAMPAIGNS API ===");
    
    const result = await giftogramService.getCampaigns();
    
    res.json({
      success: true,
      message: "Successfully fetched campaigns",
      data: result.data
    });
  } catch (error) {
    console.error("Test campaigns error:", error.message);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message,
      details: {
        type: error.constructor.name,
        message: error.message
      }
    });
  }
});

// @route   POST /api/test-giftogram/create-order
// @desc    Test creating a single gift card order
// @access  Public (for testing only)
router.post("/create-order", async (req, res) => {
  try {
    console.log("=== TESTING GIFTOGRAM CREATE ORDER API ===");
    
    const testOrderData = {
      amount: 5, // Small test amount
      recipientEmail: "test@example.com",
      recipientName: "Test User",
      message: "Test gift card from API"
    };
    
    console.log("Test order data:", testOrderData);
    
    const result = await giftogramService.createGiftCardOrder(testOrderData);
    
    res.json({
      success: true,
      message: "Successfully created test gift card order",
      data: result.data
    });
  } catch (error) {
    console.error("Test create order error:", error.message);
    
    res.status(500).json({
      success: false,
      message: "Failed to create test gift card order",
      error: error.message,
      details: {
        type: error.constructor.name,
        message: error.message
      }
    });
  }
});

module.exports = router; 