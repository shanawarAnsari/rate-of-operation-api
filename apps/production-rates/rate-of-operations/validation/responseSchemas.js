const Joi = require("joi");

// Common recipe data schema
const recipeSchema = Joi.object({
  RATE_OF_OPERATION_KEY: Joi.string().required(),
  SNAPSHOT_DATE: Joi.date().iso().required(),
  RECIPE_NUMBER: Joi.string().required(),
  MAKER_RESOURCE: Joi.string().allow(null, ""),
  PACKER_RESOURCE: Joi.string().allow(null, ""),
  BUSINESS_UNIT: Joi.string().allow(null, ""),
  INTERFACE: Joi.string().allow(null, ""),
  RECIPE_TYPE: Joi.string().allow(null, ""),
  SAP_PRODUCT: Joi.string().allow(null, ""),
  PROD_DESC: Joi.string().allow(null, ""),
  PRODUCT_CODE: Joi.string().allow(null, ""),
  TRADE_CODE: Joi.string().allow(null, ""),
  PRODUCT_VARIANT: Joi.string().allow(null, ""),
  PRODUCT_SIZE: Joi.string().allow(null, ""),
  PROD_PER_PACKAGE: Joi.number().allow(null),
  PROD_PER_CASE: Joi.number().allow(null),
  PROD_PER_SU: Joi.number().allow(null),
  MAKER_PHASE_CHARGE_QTY_020: Joi.number().allow(null),
  MAKER_PHASE_OPS_QTY_020: Joi.number().allow(null),
  RECIPE_BASE_QTY: Joi.number().allow(null),
  BASE_QTY_UOM: Joi.string().allow(null, ""),
  CURRENT_PLANNING_TIME: Joi.number().allow(null),
  PLANNING_UOM: Joi.string().allow(null, ""),
  SETUP_GROUP: Joi.string().allow(null, ""),
  CURRENT_RO: Joi.number().allow(null),
  RULEBASED_RO: Joi.number().allow(null),
  AIML_RO: Joi.number().allow(null),
  RECOMMENDED_RO: Joi.number().allow(null),
  NEW_RO: Joi.number().allow(null),
  RO_PCT_CHANGE: Joi.number().allow(null),
  NEW_PLANNING_TIME: Joi.number().allow(null),
  RECOMMENDED_RO_SOURCE: Joi.string().allow(null, ""),
  RULEBASED_RO_SOURCE: Joi.string().allow(null, ""),
  REVIEWED: Joi.string().allow(null, ""),
  ERROR_CODE: Joi.number().allow(null),
  ERROR_REPORT: Joi.string().allow(null, ""),
  COMMENT: Joi.string().allow(null, ""),
  CONSTRAINING_RESOURCE: Joi.string().allow(null, ""),
  CONSTRAINING_RESOURCE_2: Joi.string().allow(null, ""),
  CONSTRAINING_RESOURCE_3: Joi.string().allow(null, ""),
  CONSTRAINING_RESOURCE_COUNT: Joi.number().allow(null),
  UPDATED_BY: Joi.string().allow(null, ""),
  CREATED_ON: Joi.date().iso().allow(null),
  UPDATED_ON: Joi.date().iso().allow(null),
});

// Pagination response schema with data
const paginatedResponseSchema = Joi.object({
  rows: Joi.array().items(recipeSchema),
  rowsCount: Joi.number().integer().min(0),
});

// Categories response schema
const categoriesResponseSchema = Joi.array().items(Joi.string());

// Filters response schema
const filtersResponseSchema = Joi.object({
  RECIPE_TYPE: Joi.array().items(Joi.string()),
  MAKER_RESOURCE: Joi.array().items(Joi.string()),
  PACKER_RESOURCE: Joi.array().items(Joi.string()),
  PRODUCT_CODE: Joi.array().items(Joi.string()),
  PROD_DESC: Joi.array().items(Joi.string()),
  PRODUCT_VARIANT: Joi.array().items(Joi.string()),
  PRODUCT_SIZE: Joi.array().items(Joi.string()),
  SETUP_GROUP: Joi.array().items(Joi.string()),
});

// Reviewed status response schema
const reviewedStatusResponseSchema = Joi.array().items(Joi.string());

// Update response schema
const updateResultItemSchema = Joi.object({
  success: Joi.boolean().required(),
  key: Joi.string(),
  error: Joi.string(),
  rowsAffected: Joi.number().integer(),
});

const updateResponseSchema = Joi.object({
  success: Joi.boolean().required(),
  results: Joi.array().items(updateResultItemSchema),
  totalUpdated: Joi.number().integer().min(0),
  totalFailed: Joi.number().integer().min(0),
});

module.exports = {
  recipeSchema,
  paginatedResponseSchema,
  categoriesResponseSchema,
  filtersResponseSchema,
  reviewedStatusResponseSchema,
  updateResponseSchema,
};
