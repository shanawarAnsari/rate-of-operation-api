const userRepository = require("./userRepository");


const getAllUsers = async () => {
  return await userRepository.findAll();
};

const getUserByEmail = async (email) => {
  return await userRepository.findByEmail(email);
};

const createUser = async (userData) => {
  // Check if user already exists
  const existingUser = await userRepository.findByEmail(userData.email);
  if (existingUser?.length > 0) {
    const error = new Error("User with this email already exists");
    error.code = "DUPLICATE_EMAIL";
    throw error;
  }
  // Add timestamp and updated_by info
  const userToCreate = {
    ...userData,
    updated_on: new Date(),
    // If updated_by is not provided, you might want to get it from request context
    updated_by: userData.updated_by || "Web App User",
  };

  return await userRepository.create(userToCreate);
};

const updateUser = async (email, updateData) => {
  // Check if user exists
  const existingUser = await userRepository.findByEmail(email);
  if (!existingUser) {
    return null;
  }

  // Remove email from update data to prevent changing primary key
  const { email: _, ...dataToUpdate } = updateData;

  return await userRepository.update(email, dataToUpdate);
};

const deleteUser = async (email) => {
  // Check if user exists
  const existingUser = await userRepository.findByEmail(email);
  if (!existingUser) {
    return false;
  }

  return await userRepository.delete(email);
};

module.exports = {
  getAllUsers,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
