const Joi = require("joi");

// Wrenchtime data schema
const wrenchtimeSchema = Joi.object({
  SETUP_TIME_KEY: Joi.string().required(),
  SNAPSHOT_DATE: Joi.date().iso().required(),
  BUSINESS_UNIT: Joi.string().allow(null, ""),
  INTERFACE: Joi.string().allow(null, ""),
  SETUP_MATRIX: Joi.string().allow(null, ""),
  LOCATION: Joi.string().allow(null, ""),
  FROM_SETUP_GROUP: Joi.string().allow(null, ""),
  TO_SETUP_GROUP: Joi.string().allow(null, ""),
  FROM_MACHINE: Joi.string().allow(null, ""),
  TO_MACHINE: Joi.string().allow(null, ""),
  FROM_PRODUCT_SIZE: Joi.string().allow(null, ""),
  TO_PRODUCT_SIZE: Joi.string().allow(null, ""),
  FROM_PRODUCT_VARIANT: Joi.string().allow(null, ""),
  TO_PRODUCT_VARIANT: Joi.string().allow(null, ""),
  CURRENT_SETUPTIME_SECONDS: Joi.number().allow(null),
  CURRENT_SETUPTIME_MINUTES: Joi.number().allow(null),
  RULEBASED_SETUPTIME_MINUTES: Joi.number().allow(null),
  AIML_SETUPTIME_MINUTES: Joi.number().allow(null),
  RECOMMENDED_SETUPTIME_MINUTES: Joi.number().allow(null),
  NEW_SETUPTIME_MINUTES: Joi.number().allow(null),
  SETUPTIME_PCT_CHANGE: Joi.number().allow(null),
  NEW_SETUPTIME_SECONDS: Joi.number().allow(null),
  RECOMMENDED_SETUPTIME_MINUTES_SOURCE: Joi.string().allow(null, ""),
  RULEBASED_SETUPTIME_MINUTES_SOURCE: Joi.string().allow(null, ""),
  REVIEWED: Joi.string().allow(null, ""),
  ASSET_SETUPGROUP_N_3MONTH: Joi.number().allow(null),
  ASSET_SETUPGROUP_ST_3MONTH: Joi.number().allow(null),
  ASSET_SETUPGROUP_N_6MONTH: Joi.number().allow(null),
  ASSET_SETUPGROUP_ST_6MONTH: Joi.number().allow(null),
  ASSET_SIZE_N_3MONTH: Joi.number().allow(null),
  ASSET_SIZE_ST_3MONTH: Joi.number().allow(null),
  ASSET_SIZE_N_6MONTH: Joi.number().allow(null),
  ASSET_SIZE_ST_6MONTH: Joi.number().allow(null),
  ASSET_VARIANT_N_3MONTH: Joi.number().allow(null),
  ASSET_VARIANT_ST_3MONTH: Joi.number().allow(null),
  ASSET_VARIANT_N_6MONTH: Joi.number().allow(null),
  ASSET_VARIANT_ST_6MONTH: Joi.number().allow(null),
  ASSET_N_3MONTH: Joi.number().allow(null),
  ASSET_ST_3MONTH: Joi.number().allow(null),
  ASSET_N_6MONTH: Joi.number().allow(null),
  ASSET_ST_6MONTH: Joi.number().allow(null),
  COMMENT: Joi.string().allow(null, ""),
  UPDATED_BY: Joi.string().allow(null, ""),
  CREATED_ON: Joi.date().iso().allow(null),
  UPDATED_ON: Joi.date().iso().allow(null),
});

// Pagination response schema with data
const paginatedResponseSchema = Joi.object({
  rows: Joi.array().items(wrenchtimeSchema),
  rowsCount: Joi.number().integer().min(0),
});

// Categories response schema
const categoriesResponseSchema = Joi.array().items(Joi.string());

// Filters response schema
const filtersResponseSchema = Joi.object({
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
  wrenchtimeSchema,
  paginatedResponseSchema,
  categoriesResponseSchema,
  filtersResponseSchema,
  reviewedStatusResponseSchema,
  updateResponseSchema,
};
