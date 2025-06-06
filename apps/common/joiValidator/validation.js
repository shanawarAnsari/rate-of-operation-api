const Joi = require("joi");

/**
 * Creates a middleware function that validates request data against the provided schema
 * @param {Object} schema - Joi schema object containing validation rules for different parts of the request
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown props
      stripUnknown: false, // Don't remove unknown props
    };

    // Validate request body if schema.body is provided
    if (schema.body && req.body) {
      const { error } = schema.body.validate(req.body, validationOptions);
      if (error) {
        error.isJoi = true;
        error.validationSource = "body";
        error.details = error.details || [];
        return next(error);
      }
    }

    // Validate query params if schema.query is provided
    if (schema.query && req.query) {
      const { error } = schema.query.validate(req.query, validationOptions);
      if (error) {
        error.isJoi = true;
        error.validationSource = "query";
        error.details = error.details || [];
        return next(error);
      }
    }

    // Validate URL params if schema.params is provided
    if (schema.params && req.params) {
      const { error } = schema.params.validate(req.params, validationOptions);
      if (error) {
        error.isJoi = true;
        error.validationSource = "params";
        error.details = error.details || [];
        return next(error);
      }
    }

    // If all validations pass, proceed to next middleware/controller
    next();
  };
};

module.exports = {
  validateRequest,
};