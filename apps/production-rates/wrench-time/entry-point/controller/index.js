const appService = require("../../doamin");

const wrenchtime_controller = {
  getFilters: async (req, res, next) => {
    try {
      let responseDto = await appService.getFilters(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getWrenchtime: async (req, res, next) => {
    try {
      let responseDto = await appService.getWrenchtime(req, res, next);
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
  searchWrenchtime: async (req, res, next) => {
    try {
      let responseDto = await appService.searchWrenchtime(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  updateWrenchtime: async (req, res, next) => {
    try {
      let responseDto = await appService.updateWrenchtime(req, res, next);
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  downloadWrenchtime: async (req, res, next) => {
    try {
      let responseDto = await appService.downloadWrenchtime(req, res, next);
      // Set appropriate headers based on file type
      const fileType = req.body.fileType || "xlsx";
      const filename = `wrenchtime-${Date.now()}.${fileType}`;

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
module.exports = wrenchtime_controller;
