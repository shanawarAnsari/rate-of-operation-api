const userService = require("../domain/userService");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const newUser = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      data: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { email } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(email, updateData);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email)
    await userService.deleteUser(decodedEmail);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
