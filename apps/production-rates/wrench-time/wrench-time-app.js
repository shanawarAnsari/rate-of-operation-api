const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./entry-point/routes");
const errorhandler = require("../../common/errorHandler");

const wrenchtime_app = express();

wrenchtime_app.use(bodyParser.urlencoded({ extended: true }));
wrenchtime_app.use(bodyParser.json());
wrenchtime_app.use(
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

wrenchtime_app.use("/wrenchtime", routes);
wrenchtime_app.use(errorhandler);

module.exports = wrenchtime_app;
