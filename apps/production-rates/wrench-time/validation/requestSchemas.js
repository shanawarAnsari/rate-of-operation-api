const Joi = require("joi");

// Common schema components
const paginationSchema = {
  pageNumber: Joi.number().integer().default(1).messages({
    "number.base": "pageNumber must be a number",
    "number.integer": "pageNumber must be an integer",
  }),
  rowsPerPage: Joi.number().integer().default(10).messages({
    "number.base": "rowsPerPage must be a number",
    "number.integer": "rowsPerPage must be an integer",
  }),
};

const filterSchema = Joi.object({
  INTERFACE: Joi.array().items(Joi.string()),
  SETUP_MATRIX: Joi.array().items(Joi.string()),
  LOCATION: Joi.array().items(Joi.string()),
  FROM_SETUP_GROUP: Joi.array().items(Joi.string()),
  TO_SETUP_GROUP: Joi.array().items(Joi.string()),
  FROM_MACHINE: Joi.array().items(Joi.string()),
  TO_MACHINE: Joi.array().items(Joi.string()),
  FROM_PRODUCT_SIZE: Joi.array().items(Joi.string()),
  TO_PRODUCT_SIZE: Joi.array().items(Joi.string()),
  FROM_PRODUCT_VARIANT: Joi.array().items(Joi.string()),
  TO_PRODUCT_VARIANT: Joi.array().items(Joi.string()),
  BUSINESS_UNIT: Joi.array().items(Joi.string()),
  SETUPTIME_PCT_CHANGE: Joi.array()
    .items(Joi.string().valid("0% to 5%", "5% to 10%", "10% to 15%", "above 15%"))
    .messages({
      "array.includesOne":
        "SETUPTIME_PCT_CHANGE must be one of the allowed values: 0% to 5%, 5% to 10%, 10% to 15%, above 15%",
    }),
});

// Schema for getWrenchtime endpoint
const getWrenchtimeSchema = {
  body: Joi.object({
    pageNumber: paginationSchema.pageNumber,
    rowsPerPage: paginationSchema.rowsPerPage,
    reviewedStatus: Joi.string().required().messages({
      "string.base": "reviewedStatus must be a string",
    }),
    filters: filterSchema.optional(),
  }),
};

// Schema for search endpoint
const searchWrenchtimeSchema = {
  body: Joi.object({
    searchText: Joi.string().required().messages({
      "string.empty": "searchText is required and cannot be empty",
      "any.required": "searchText is a required field",
    }),
    pageNumber: paginationSchema.pageNumber,
    rowsPerPage: paginationSchema.rowsPerPage,
    reviewedStatus: Joi.string().required().messages({
      "string.base": "reviewedStatus must be a string",
    }),
    filters: filterSchema.optional(),
  }),
};

// Schema for updateWrenchtime endpoint
const wrenchtimeUpdateItemSchema = Joi.object({
  SETUP_TIME_KEY: Joi.string().required().messages({
    "string.empty": "SETUP_TIME_KEY is required and cannot be empty",
    "any.required": "SETUP_TIME_KEY is a required field",
  }),
  NEW_SETUPTIME_MINUTES: Joi.number().required().messages({
    "number.base": "NEW_SETUPTIME_MINUTES must be a valid number",
  }),
  SETUPTIME_PCT_CHANGE: Joi.number().required().messages({
    "number.base": "SETUPTIME_PCT_CHANGE must be a valid number",
  }),
  NEW_SETUPTIME_SECONDS: Joi.number().messages({
    "number.base": "NEW_SETUPTIME_SECONDS must be a valid number",
  }),
  REVIEWED: Joi.string().required().messages({
    "string.base": "REVIEWED must be a string value",
  }),
  UPDATED_BY: Joi.string().required().messages({
    "string.base": "UPDATED_BY must be a string value",
  }),
  UPDATED_ON: Joi.date().optional().messages({
    "date.base": "UPDATED_ON must be a valid date",
  }),
});

const updateWrenchtimeSchema = {
  body: Joi.array().items(wrenchtimeUpdateItemSchema).required().messages({
    "array.base": "Request body must be an array of wrenchtime updates",
  }),
};

// Schema for download endpoint
const downloadWrenchtimeSchema = {
  body: Joi.object({
    reviewedStatus: Joi.string().required().messages({
      "string.base": "reviewedStatus must be a string",
    }),
    filters: filterSchema.optional(),
    fileType: Joi.string().valid("xlsx", "csv").default("xlsx").messages({
      "string.base": "fileType must be a string",
      "any.only": "fileType must be either 'xlsx' or 'csv'",
    }),
  }),
};

module.exports = {
  getWrenchtimeSchema,
  searchWrenchtimeSchema,
  updateWrenchtimeSchema,
  downloadWrenchtimeSchema,
};
