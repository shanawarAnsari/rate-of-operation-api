const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoutes = require("./entrypoints/userRoutes");
const errorhandler = require("../../common/errorHandler");

const user_management_app = express();

user_management_app.use(bodyParser.urlencoded({ extended: true }));
user_management_app.use(bodyParser.json());
user_management_app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://app-productionrate-d-eus2-1.azurewebsites.net",
      "https://app-productionrate-q-eus2-1.azurewebsites.net",
      "https://dev2-api.productionrate.app.kimclark.com",
      "https://qa2-api.productionrate.app.kimclark.com",
    ],
  })
);

// Register user management routes
user_management_app.use("/user-management", userRoutes);
user_management_app.use(errorhandler);

module.exports = user_management_app;
