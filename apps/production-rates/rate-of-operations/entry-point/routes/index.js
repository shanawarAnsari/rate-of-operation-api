const express = require("express");

const router = express.Router();
const rate_of_operations_controller = require("../controller");

router.post("/getRecipies", rate_of_operations_controller.getRateOfOperations);
router.get("/getCategories", rate_of_operations_controller.getCategories);
router.get("/getFilters", rate_of_operations_controller.getFilters);
router.get("/getReviewedStatus", rate_of_operations_controller.getReviewedStatus);
router.post("/search", rate_of_operations_controller.searchRecipies);

module.exports = router;
