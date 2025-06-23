const appService = require("../../doamin");

const rate_of_opeartions_controller = {
  getFilters: async (req, res, next) => {
    try {
      let responseDto = await appService.getFilters(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getRateOfOperations: async (req, res, next) => {
    try {
      let responseDto = await appService.getRecipies(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getCategories: async (req, res, next) => {
    try {
      let responseDto = await appService.getCategories(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getReviewedStatus: async (req, res, next) => {
    try {
      let responseDto = await appService.getReviewedStatus(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  searchRecipies: async (req, res, next) => {
    try {
      let responseDto = await appService.searchRecipies(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  updateRecipies: async (req, res, next) => {
    try {
      let responseDto = await appService.updateRecipies(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  downloadRecipies: async (req, res, next) => {
    try {
      let responseDto = await appService.downloadRecipies(req, res, next);
      // Set appropriate headers based on file type
      const fileType = req.body.fileType || "xlsx";
      const filename = `rate-of-operations-${Date.now()}.${fileType}`;

      if (fileType === "xlsx") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      } else if (fileType === "csv") {
        res.setHeader("Content-Type", "text/csv");
      }

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(responseDto);
    } catch (err) {
      next(err);
    }
  },
};
module.exports = rate_of_opeartions_controller;
