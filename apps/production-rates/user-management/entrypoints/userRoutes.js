const express = require("express");
const userController = require("./userController");
const userValidation = require("../validation/userValidation");
const { validateRequest } = require("../../../common/joiValidator/validation");

const router = express.Router();

// GET /users - Get all users
router.get("/", userController.getAllUsers);

// GET /users/:email - Get user by email
router.get(
  "/:email",
  validateRequest(userValidation.getUserByEmail),
  userController.getUserByEmail
);

// POST /users - Create new user
router.post(
  "/user",
  validateRequest(userValidation.createUser),
  userController.createUser
);

// PUT /users/:email - Update user
router.put(
  "/:email",
  validateRequest(userValidation.updateUser),
  userController.updateUser
);

// DELETE /users/:email - Delete user
router.delete(
  "/:email",
  validateRequest(userValidation.deleteUser),
  userController.deleteUser
);

module.exports = router;
