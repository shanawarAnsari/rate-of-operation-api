const express = require("express");
const router = express.Router();
const wrenchtime_controller = require("../controller");
const { validateRequest } = require("../../../../common/joiValidator/validation");
const {
  getWrenchtimeSchema,
  searchWrenchtimeSchema,
  updateWrenchtimeSchema,
  downloadWrenchtimeSchema,
} = require("../../validation/requestSchemas.js");

// Routes with validation
router.post(
  "/getWrenchtime",
  validateRequest(getWrenchtimeSchema),
  wrenchtime_controller.getWrenchtime
);
router.get("/getCategories", wrenchtime_controller.getCategories);
router.get("/getFilters", wrenchtime_controller.getFilters);
router.get("/getReviewedStatus", wrenchtime_controller.getReviewedStatus);
router.post(
  "/search",
  validateRequest(searchWrenchtimeSchema),
  wrenchtime_controller.searchWrenchtime
);
router.post(
  "/updateWrenchtime",
  validateRequest(updateWrenchtimeSchema),
  wrenchtime_controller.updateWrenchtime
);
router.post(
  "/downloadWrenchtime",
  validateRequest(downloadWrenchtimeSchema),
  wrenchtime_controller.downloadWrenchtime
);

module.exports = router;
