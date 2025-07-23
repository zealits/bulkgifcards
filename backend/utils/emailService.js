const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from config folder
dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

// Validate SMTP configuration
const validateSMTPConfig = () => {
  const requiredEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_MAIL", "SMTP_PASSWORD"];
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error("Missing SMTP environment variables:", missing);
    return false;
  }

  console.log("SMTP Configuration:");
  console.log("- Host:", process.env.SMTP_HOST);
  console.log("- Port:", process.env.SMTP_PORT);
  console.log("- Email:", process.env.SMTP_MAIL);
  console.log("- Password:", process.env.SMTP_PASSWORD ? "***" + process.env.SMTP_PASSWORD.slice(-4) : "NOT SET");

  return true;
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  if (!validateSMTPConfig()) {
    throw new Error("SMTP configuration is incomplete");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  });
};

// Test SMTP connection
const testSMTPConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection test failed:", error.message);
    return false;
  }
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken, name) => {
  try {
    const transporter = createTransporter();

    // Test connection first
    const isConnected = await testSMTPConnection();
    if (!isConnected) {
      throw new Error("SMTP connection failed");
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"Giftogram" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: "Verify Your Email - Giftogram",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Giftogram!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with Giftogram! To complete your registration and start using our platform, please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can also copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">
              ${verificationUrl}
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This verification link will expire in 24 hours for security purposes.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't create an account with Giftogram, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to:", email);
    console.log("Message ID:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Giftogram" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: "Welcome to Giftogram - Your Account is Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Giftogram!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Congratulations! Your email has been successfully verified and your Giftogram account is now active.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You can now access your dashboard and start uploading Excel files to manage your email lists.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">
              Thank you for choosing Giftogram!
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully to:", email);
    console.log("Message ID:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  generateVerificationToken,
  testSMTPConnection,
};
