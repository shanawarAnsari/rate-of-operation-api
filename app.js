const express = require("express");
const bodyParser = require("body-parser");
const errorHandler = require("./apps/common/errorHandler");
const rateOfOperationsRoutes = require("./apps/production-rates/rate-of-operations/entry-point/routes");

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/rate-of-operations", rateOfOperationsRoutes);

// Error handling middleware - should be registered after all routes
app.use(errorHandler);

// Default 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      type: "NotFound",
      status: 404,
      detail: "The requested resource was not found",
      instance: req.originalUrl,
    },
  });
});

module.exports = app;
