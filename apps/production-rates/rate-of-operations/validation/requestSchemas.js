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
  RECIPE_TYPE: Joi.array().items(Joi.string()),
  MAKER_RESOURCE: Joi.array().items(Joi.string()),
  PACKER_RESOURCE: Joi.array().items(Joi.string()),
  PRODUCT_CODE: Joi.array().items(Joi.string()),
  PROD_DESC: Joi.array().items(Joi.string()),
  PRODUCT_VARIANT: Joi.array().items(Joi.string()),
  PRODUCT_SIZE: Joi.array().items(Joi.string()),
  SETUP_GROUP: Joi.array().items(Joi.string()),
  tro_change: Joi.array()
    .items(Joi.string().valid("0% to 5%", "5% to 10%", "10% to 15%", "above 15%"))
    .messages({
      "array.includesOne":
        "tro_change must be one of the allowed values: 0% to 5%, 5% to 10%, 10% to 15%, above 15%",
    }),
});

// Schema for getRecipies endpoint
const getRecipiesSchema = {
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
const searchRecipiesSchema = {
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

// Schema for updateRecipies endpoint
const recipeUpdateItemSchema = Joi.object({
  RATE_OF_OPERATION_KEY: Joi.string().required().messages({
    "string.empty": "RATE_OF_OPERATION_KEY is required and cannot be empty",
    "any.required": "RATE_OF_OPERATION_KEY is a required field",
  }),
  NEW_RO: Joi.number().required().messages({
    "number.base": "NEW_RO must be a valid number",
  }),
  RO_PCT_CHANGE: Joi.number().required().messages({
    "number.base": "RO_PCT_CHANGE must be a valid number",
  }),
  NEW_PLANNING_TIME: Joi.number().messages({
    "number.base": "NEW_PLANNING_TIME must be a valid number",
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

const updateRecipiesSchema = {
  body: Joi.array().items(recipeUpdateItemSchema).required().messages({
    "array.base": "Request body must be an array of recipe updates",
  }),
};

// Schema for download endpoint
const downloadRecipiesSchema = {
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
  getRecipiesSchema,
  searchRecipiesSchema,
  updateRecipiesSchema,
  downloadRecipiesSchema,
};