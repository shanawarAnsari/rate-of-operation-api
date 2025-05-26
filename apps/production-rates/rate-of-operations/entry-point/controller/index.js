const appService = require("../../doamin");

const rate_of_opeartions_controller = {
  getFilters: async (req, res, next) => {
    try {
      let responseDto = await appService.getFilters(
        req,
        res,
        next
      );
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getRateOfOperations: async (req, res, next) => {
    try {
      let responseDto = await appService.getRecipies(
        req,
        res,
        next
      );
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getCategories: async (req, res, next) => {
    try {
      let responseDto = await appService.getCategories(
        req,
        res,
        next
      );
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
  getReviewedStatus: async (req, res, next) => {
    try {
      let responseDto = await appService.getReviewedStatus(
        req,
        res,
        next
      );
      res.status(200).json(responseDto);
    } catch (err) {
      next(err);
    }
  },
}
module.exports = rate_of_opeartions_controller;
