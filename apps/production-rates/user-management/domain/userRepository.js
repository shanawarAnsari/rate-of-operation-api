// Note: Replace this with your actual database connection
// const db = require('../../../../config/database');

const fs = require("fs").promises;
const path = require("path");

// Path to mock data file
const mockDataPath = path.join(__dirname, "../data/mockUsers.json");

/**
 * Helper function to read mock data
 */
const readMockData = async () => {
  try {
    const data = await fs.readFile(mockDataPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading mock data:", error);
    return [];
  }
};

/**
 * Helper function to write mock data
 */
const writeMockData = async (data) => {
  try {
    await fs.writeFile(mockDataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing mock data:", error);
    throw error;
  }
};

/**
 * User Repository - Database operations for USER_MANAGEMENT table
 */

/**
 * Find all users
 */
const findAll = async () => {
  try {
    // Using mock data for now
    const users = await readMockData();
    return users; // Database code (keep safe for future use):
    // const query = `
    //   SELECT email, role, category, interface, updated_by, updated_on
    //   FROM USER_MANAGEMENT
    //   ORDER BY updated_on DESC
    // `;
    // const result = await db.query(query);
    // return result.rows;
  } catch (error) {
    console.error("Error finding all users:", error);
    throw error;
  }
};

/**
 * Find user by email
 */
const findByEmail = async (email) => {
  try {
    // Using mock data for now
    const users = await readMockData();
    const user = users.find((u) => u.email === email);
    return user || null; // Database code (keep safe for future use):
    // const query = `
    //   SELECT email, role, category, interface, updated_by, updated_on
    //   FROM USER_MANAGEMENT
    //   WHERE email = ?
    // `;
    // const result = await db.query(query, [email]);
    // return result.rows[0] || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

/**
 * Create new user
 */
const create = async (userData) => {
  try {
    // Using mock data for now
    const users = await readMockData();
    const newUser = {
      ...userData,
      updated_on: userData.updated_on || new Date().toISOString(),
    };

    users.push(newUser);
    await writeMockData(users);
    return newUser; // Database code (keep safe for future use):
    // const {
    //   email,
    //   role,
    //   category,
    //   interface: userInterface,
    //   updated_by,
    //   updated_on,
    // } = userData;
    //
    // const query = `
    //   INSERT INTO USER_MANAGEMENT (email, role, category, interface, updated_by, updated_on)
    //   VALUES (?, ?, ?, ?, ?, ?)
    // `;
    //
    // const values = [
    //   email,
    //   role,
    //   JSON.stringify(category), // Store array as JSON string
    //   JSON.stringify(userInterface), // Store array as JSON string
    //   updated_by,
    //   updated_on,
    // ];
    //
    // await db.query(query, values);
    // return await findByEmail(email);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

/**
 * Update user
 */
const update = async (email, updateData) => {
  try {
    // Using mock data for now
    const users = await readMockData();
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      return null;
    }

    // Update the user data
    users[userIndex] = { ...users[userIndex], ...updateData };
    await writeMockData(users);
    return users[userIndex];

    // Database code (keep safe for future use):
    // const fields = [];
    // const values = [];
    //
    // // Build dynamic update query
    // if (updateData.role !== undefined) {
    //   fields.push("role = ?");
    //   values.push(updateData.role);
    // }
    //
    // if (updateData.category !== undefined) {
    //   fields.push("category = ?");
    //   values.push(JSON.stringify(updateData.category));
    // }
    //
    // if (updateData.interface !== undefined) {
    //   fields.push("interface = ?");
    //   values.push(JSON.stringify(updateData.interface));
    // }
    //    // if (updateData.updated_by !== undefined) {
    //   fields.push("updated_by = ?");
    //   values.push(updateData.updated_by);
    // }
    //
    // if (fields.length === 0) {
    //   throw new Error("No fields to update");
    // }
    //
    // values.push(email); // Add email for WHERE clause
    //
    // const query = `
    //   UPDATE USER_MANAGEMENT
    //   SET ${fields.join(", ")}
    //   WHERE email = ?
    // `;
    //
    // await db.query(query, values);
    // return await findByEmail(email);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Delete user
 */
const deleteUser = async (email) => {
  try {
    // Using mock data for now
    const users = await readMockData();
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);
    await writeMockData(users);
    return true;

    // Database code (keep safe for future use):
    // const query = `DELETE FROM USER_MANAGEMENT WHERE email = ?`;
    // const result = await db.query(query, [email]);
    // return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

module.exports = {
  findAll,
  findByEmail,
  create,
  update,
  delete: deleteUser,
};
