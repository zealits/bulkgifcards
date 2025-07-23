const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from config folder
dotenv.config({ path: path.join(__dirname, "config", ".env") });

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/giftcards", require("./routes/giftcards"));
app.use("/api/test-giftogram", require("./routes/test-giftogram"));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all to serve index.html for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/giftogram", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!", port: process.env.PORT || 1996 });
});

const PORT = process.env.PORT || 1996;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
