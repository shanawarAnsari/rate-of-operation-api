const Joi = require("joi");

/**
 * Validation schema for creating a new user
 */
const createUser = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    role: Joi.string().required().messages({
      "any.required": "Role is required",
    }),

    category: Joi.array().items(Joi.string()).min(1).required().messages({
      "array.min": "At least one category is required",
      "any.required": "Category is required",
    }),
    interface: Joi.array().items(Joi.string()).min(1).required().messages({
      "array.min": "At least one interface is required",
      "any.required": "Interface is required",
    }),

    updated_by: Joi.string().required().messages({
      "any.required": "Updated by is required",
    }),
  }),
};

/**
 * Validation schema for updating a user
 */
const updateUser = {
  params: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),

  body: Joi.object({
    role: Joi.string(),

    category: Joi.array().items(Joi.string()).min(1).messages({
      "array.min": "At least one category is required",
    }),
    interface: Joi.array().items(Joi.string()).min(1).messages({
      "array.min": "At least one interface is required",
    }),

    updated_by: Joi.string(),
  })
    .min(1)
    .messages({
      "object.min": "At least one field is required for update",
    }),
};

/**
 * Validation schema for getting user by email
 */
const getUserByEmail = {
  params: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),
};

/**
 * Validation schema for deleting a user
 */
const deleteUser = {
  params: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),
};

module.exports = {
  createUser,
  updateUser,
  getUserByEmail,
  deleteUser,
};
