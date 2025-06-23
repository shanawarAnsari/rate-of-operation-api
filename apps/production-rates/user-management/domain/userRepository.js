const fs = require("fs").promises;
const path = require("path");
const { executeQuery } = require("../../../common/sqlConnectionManager");

const findAll = async () => {
  try {
    const query = `
      SELECT EMAIL_ID, CATEGORIES, ROLE, UPDATED_ON,  UPDATED_BY, INTERFACES
      FROM [dbo].[T_NA_PRODRATE_USER]
      ORDER BY EMAIL_ID`;

    const result = await executeQuery(query);
    return result;
  } catch (error) {
    console.error("Error finding all users:", error);
    throw error;
  }
};

const findByEmail = async (email) => {
  try {

    const query = `SELECT EMAIL_ID, CATEGORIES, ROLE, UPDATED_ON,  UPDATED_BY, INTERFACES
      FROM [dbo].[T_NA_PRODRATE_USER]
      WHERE EMAIL_ID = @Email`;
    const result = await executeQuery(query, { Email: email });
    return result || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};


const create = async (userData) => {
  try {
    const {
      email,
      role,
      category,
      interface: userInterface,
      updated_by,
      updated_on,
    } = userData;

    const insertQuery = `INSERT INTO [dbo].[T_NA_PRODRATE_USER] 
      (EMAIL_ID, ROLE, CATEGORIES, INTERFACES, UPDATED_BY, UPDATED_ON)
      VALUES (@Email, @Role, @Categories, @Interfaces, @UpdatedBy, @UpdatedOn)`;

    const values = {
      Email: email,
      Role: role,
      Categories: JSON.stringify(category),
      Interfaces: JSON.stringify(userInterface),
      UpdatedBy: updated_by,
      UpdatedOn: (updated_on).toString(),
    };

    const result = await executeQuery(insertQuery, values);
    return result;
  } catch (error) {
    console.error("Error creating user:", error.message);
    throw error;
  }
};

const update = async (email, updateData) => {
  try {
    const fields = [];
    const values = { Email: email };

    if (updateData.role !== undefined) {
      fields.push("ROLE = @Role");
      values.Role = updateData.role;
    }

    if (updateData.category !== undefined) {
      fields.push("CATEGORIES = @Categories");
      values.Categories = JSON.stringify(updateData.category);
    }

    if (updateData.interface !== undefined) {
      fields.push("INTERFACES = @Interfaces");
      values.Interfaces = JSON.stringify(updateData.interface);
    }

    if (updateData.updated_by !== undefined) {
      fields.push("UPDATED_BY = @UpdatedBy");
      values.UpdatedBy = updateData.updated_by;
    }

    if (updateData.updated_on !== undefined) {
      fields.push("UPDATED_ON = @UpdatedOn");
      values.UpdatedOn = updateData.updated_on;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const updateQuery = `UPDATE [dbo].[T_NA_PRODRATE_USER]
      SET ${fields.join(", ")}
      WHERE EMAIL_ID = @Email`;

    const result = await executeQuery(updateQuery, values);
    return result;
  } catch (error) {
    console.error("Error updating user:", error.message);
    throw error;
  }
};

const deleteUser = async (email) => {
  try {
    const deleteQuery = `DELETE FROM [dbo].[T_NA_PRODRATE_USER] WHERE EMAIL_ID = @Email`;
    const result = await executeQuery(deleteQuery, { Email: email });
    return result
  } catch (error) {
    console.error("Error deleting user:", error.message);
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
