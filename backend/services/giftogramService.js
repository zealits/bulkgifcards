const axios = require("axios");

class GiftogramService {
  constructor() {
    this.apiUrl = process.env.GIFTOGRAM_API_URL || "https://sandbox-api.giftogram.com";
    this.apiKey = process.env.GIFTOGRAM_API_KEY;
    this.environment = process.env.GIFTOGRAM_ENVIRONMENT || "sandbox";
    this.campaignId = process.env.GIFTOGRAM_CAMPAIGN_ID;
  }

  // Create axios instance with authentication
  getApiClient() {
    return axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  // Get available gift card campaigns
  async getCampaigns() {
    try {
      console.log("=== GIFTOGRAM CAMPAIGNS REQUEST ===");
      console.log("URL:", `${this.apiUrl}/api/v1/campaigns`);

      const client = this.getApiClient();
      const response = await client.get("/api/v1/campaigns");

      console.log("=== GIFTOGRAM CAMPAIGNS SUCCESS ===");
      console.log("Status:", response.status);
      console.log("Data:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.log("=== GIFTOGRAM CAMPAIGNS ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);

      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response statusText:", error.response.statusText);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      }

      // REMOVED MOCK FALLBACK - Return actual error
      throw new Error(
        `Giftogram Campaigns API Error: ${error.response?.status || "Unknown"} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Create a gift card order
  async createGiftCardOrder(orderData) {
    try {
      // Log configuration details
      console.log("=== GIFTOGRAM API CONFIGURATION ===");
      console.log("API URL:", this.apiUrl);
      console.log("API Key (first 10 chars):", this.apiKey ? this.apiKey.substring(0, 10) + "..." : "NOT SET");
      console.log("Campaign ID:", this.campaignId);
      console.log("Environment:", this.environment);

      const client = this.getApiClient();

      // Log request headers
      console.log("=== REQUEST HEADERS ===");
      console.log("Authorization:", client.defaults.headers.Authorization);
      console.log("Content-Type:", client.defaults.headers["Content-Type"]);

      // Validate required fields
      this.validateOrderData(orderData);

      // Generate unique external ID
      const externalId = `GC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const payload = {
        external_id: externalId,
        campaign_id: orderData.campaignId || this.campaignId,
        notes: `Gift card for ${orderData.recipientName} (${orderData.recipientEmail})`,
        reference_number: externalId,
        message: orderData.message || "Enjoy your gift card!",
        subject: "Your Gift Card is Ready!",
        recipients: [
          {
            email: orderData.recipientEmail,
            name: orderData.recipientName || orderData.recipientEmail.split("@")[0],
          },
        ],
        denomination: orderData.amount.toString(),
      };

      console.log("=== GIFTOGRAM API REQUEST ===");
      console.log("URL:", `${this.apiUrl}/api/v1/orders`);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await client.post("/api/v1/orders", payload);

      console.log("=== GIFTOGRAM API SUCCESS RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Data:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: {
          orderId: response.data.data.order_id,
          externalId: externalId,
          status: response.data.data.status,
          amount: orderData.amount,
          recipientEmail: orderData.recipientEmail,
          recipientName: orderData.recipientName,
          message: orderData.message,
          createdAt: new Date(),
        },
      };
    } catch (error) {
      console.log("=== GIFTOGRAM API ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error(
        "Request config:",
        error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              baseURL: error.config.baseURL,
              headers: error.config.headers,
            }
          : "No config available"
      );

      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response statusText:", error.response.statusText);
        console.error("Response headers:", JSON.stringify(error.response.headers, null, 2));
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error("Request made but no response received:", error.request);
      }

      // REMOVED MOCK FALLBACK - Return actual error
      throw new Error(
        `Giftogram API Error: ${error.response?.status || "Unknown"} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Get order status
  async getOrder(orderId) {
    try {
      console.log("=== GIFTOGRAM ORDER STATUS REQUEST ===");
      console.log("URL:", `${this.apiUrl}/api/v1/orders/${orderId}`);

      const client = this.getApiClient();
      const response = await client.get(`/api/v1/orders/${orderId}`);

      console.log("=== GIFTOGRAM ORDER STATUS SUCCESS ===");
      console.log("Status:", response.status);
      console.log("Data:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.log("=== GIFTOGRAM ORDER STATUS ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);

      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response statusText:", error.response.statusText);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      }

      // REMOVED MOCK FALLBACK - Return actual error
      throw new Error(
        `Giftogram Order Status API Error: ${error.response?.status || "Unknown"} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Validate order data
  validateOrderData(orderData) {
    const requiredFields = ["amount", "recipientEmail"];
    const missing = requiredFields.filter((field) => !orderData[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.recipientEmail)) {
      throw new Error("Invalid recipient email format");
    }

    // Validate amount
    if (orderData.amount <= 0 || orderData.amount > 1000) {
      throw new Error("Amount must be between $1 and $1000");
    }

    return true;
  }

  // Process bulk gift card orders
  async processBulkGiftCards(emailList, amount, message = "Enjoy your gift card!") {
    const results = [];
    const errors = [];

    console.log(`Processing bulk gift cards for ${emailList.length} recipients, $${amount} each`);

    for (const emailData of emailList) {
      try {
        const orderData = {
          campaignId: this.campaignId,
          amount: amount,
          recipientEmail: emailData.email,
          recipientName: emailData.name || emailData.email.split("@")[0],
          message: message,
        };

        const result = await this.createGiftCardOrder(orderData);

        if (result.success) {
          results.push({
            email: emailData.email,
            name: emailData.name,
            success: true,
            orderId: result.data.orderId,
            amount: amount,
          });
        } else {
          errors.push({
            email: emailData.email,
            error: "Failed to create order",
          });
        }

        // Add small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing gift card for ${emailData.email}:`, error.message);
        errors.push({
          email: emailData.email,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      totalProcessed: emailList.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors,
    };
  }
}

module.exports = new GiftogramService();
