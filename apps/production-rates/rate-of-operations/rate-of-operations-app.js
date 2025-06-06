const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./entry-point/routes");
const authRoutes = require("../../common/oktaTokenVerifier/authRoutes");
const errorhandler = require("../../common/errorHandler");

const rate_of_operations_app = express();

rate_of_operations_app.use(bodyParser.urlencoded({ extended: true }));
rate_of_operations_app.use(bodyParser.json());
rate_of_operations_app.use(cors({
  origin: ['http://localhost:3000',
    'http://localhost:8080',
    'https://app-productionrate-d-eus2-1.azurewebsites.net',
    'https://app-productionrate-q-eus2-1.azurewebsites.net',
    'https://dev2-api.productionrate.app.kimclark.com',
    'https://qa2-api.productionrate.app.kimclark.com'
  ]
}));

//rate_of_operations_app.use('/auth', authRoutes);
rate_of_operations_app.use("/rate-of-operations", routes);
rate_of_operations_app.use(errorhandler);

module.exports = rate_of_operations_app;
