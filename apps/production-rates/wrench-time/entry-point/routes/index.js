const express = require("express");
const router = express.Router();
const rate_of_operations_controller = require("../controller");
const { validateRequest } = require("../../../../common/joiValidator/validation");
const {
    getRecipiesSchema,
    searchRecipiesSchema,
    updateRecipiesSchema,
    downloadRecipiesSchema,
} = require("../../validation/requestSchemas.js");

// Routes with validation
router.post(
    "/getRecipies",
    validateRequest(getRecipiesSchema),
    rate_of_operations_controller.getRateOfOperations
);
router.get("/getCategories", rate_of_operations_controller.getCategories);
router.get("/getFilters", rate_of_operations_controller.getFilters);
router.get("/getReviewedStatus", rate_of_operations_controller.getReviewedStatus);
router.post(
    "/search",
    validateRequest(searchRecipiesSchema),
    rate_of_operations_controller.searchRecipies
);
router.post(
    "/updateRecipies",
    validateRequest(updateRecipiesSchema),
    rate_of_operations_controller.updateRecipies
);
router.post(
    "/downloadRecipes",
    validateRequest(downloadRecipiesSchema),
    rate_of_operations_controller.downloadRecipies
);

module.exports = router;
