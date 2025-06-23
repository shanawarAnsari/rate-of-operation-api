const { executeQuery } = require("../../../common/sqlConnectionManager");
const excel = require("exceljs");
const { Parser } = require("json2csv");
const { buildWhereClause } = require("../helpers/sqlHelpers")

const appService = {
  getRecipies: async (req) => {
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);
    const offset = (pageNumber - 1) * rowsPerPage;

    const reviewedStatus = req.body.reviewedStatus === "All"
      ? ""
      : `AND REVIEWED='${req.body.reviewedStatus}'`;

    const filterConditions = req.body.filters
      ? buildWhereClause(req.body.filters)
      : "";

    const baseWhere = `WHERE RECIPE_NUMBER IS NOT NULL ${reviewedStatus} ${filterConditions}`;

    const query = `
        SELECT * 
        FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
        ${baseWhere}
        ORDER BY SNAPSHOT_DATE DESC
        OFFSET @offset ROWS
        FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
        ${baseWhere};
    `;

    const params = {
      offset,
      rowsPerPage
    };

    const rows = await executeQuery(query, params);
    const countResult = await executeQuery(countQuery, params);
    const rowsCount = countResult && countResult[0] ? countResult[0].totalCount : 0;

    return { rows, rowsCount };
  },

  getCategories: async () => {
    try {
      const response = ["Personal Care"];
      return response;
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  },

  getFilters: async (req) => {
    let query = `SELECT Distinct INTERFACE,RECIPE_TYPE,
      MAKER_RESOURCE,PACKER_RESOURCE,PRODUCT_CODE,
      PROD_DESC,PRODUCT_VARIANT,PRODUCT_SIZE,SETUP_GROUP
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE];`;

    let response = await executeQuery(query);
    return response;
  },

  getReviewedStatus: async (req) => {

    let query = `SELECT Distinct REVIEWED
    FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE];`;

    let response = await executeQuery(query);
    return response;
  },

  searchRecipies: async (req) => {
    if (!req.body.searchText || req.body.searchText.trim() === "") {
      return { rows: [], rowsCount: 0 };
    }

    const searchText = req.body.searchText.trim();
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);
    const offset = (pageNumber - 1) * rowsPerPage;

    const reviewedStatus = req.body.reviewedStatus === "All"
      ? ""
      : `AND REVIEWED='${req.body.reviewedStatus}'`;

    const filterConditions = req.body.filters
      ? buildWhereClause(req.body.filters)
      : "";

    const searchCondition = `
      RATE_OF_OPERATION_KEY LIKE @searchPattern OR
      RECIPE_NUMBER LIKE @searchPattern OR
      MAKER_RESOURCE LIKE @searchPattern OR
      PACKER_RESOURCE LIKE @searchPattern OR
      BUSINESS_UNIT LIKE @searchPattern OR
      INTERFACE LIKE @searchPattern OR
      RECIPE_TYPE LIKE @searchPattern OR
      SAP_PRODUCT LIKE @searchPattern OR
      PROD_DESC LIKE @searchPattern OR
      PRODUCT_CODE LIKE @searchPattern OR
      TRADE_CODE LIKE @searchPattern OR
      PRODUCT_VARIANT LIKE @searchPattern OR
      PRODUCT_SIZE LIKE @searchPattern OR
      BASE_QTY_UOM LIKE @searchPattern OR
      PLANNING_UOM LIKE @searchPattern OR
      SETUP_GROUP LIKE @searchPattern OR
      RECOMMENDED_RO_SOURCE LIKE @searchPattern OR
      RULEBASED_RO_SOURCE LIKE @searchPattern OR
      REVIEWED LIKE @searchPattern OR
      ERROR_REPORT LIKE @searchPattern OR
      COMMENT LIKE @searchPattern OR
      CONSTRAINING_RESOURCE LIKE @searchPattern OR
      CONSTRAINING_RESOURCE_2 LIKE @searchPattern OR
      CONSTRAINING_RESOURCE_3 LIKE @searchPattern OR
      UPDATED_BY LIKE @searchPattern
    `;

    const baseWhere = `
      WHERE RECIPE_NUMBER IS NOT NULL
      ${reviewedStatus}
      ${filterConditions}
      AND (${searchCondition})
    `;

    const query = `
      SELECT *
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      ${baseWhere}
      ORDER BY SNAPSHOT_DATE DESC
      OFFSET @offset ROWS
      FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      ${baseWhere};
    `;

    const params = {
      offset,
      rowsPerPage,
      searchPattern: `%${searchText}%`
    };

    try {
      const rows = await executeQuery(query, params);
      const countResult = await executeQuery(countQuery, params);
      const rowsCount = countResult && countResult[0] ? countResult[0].totalCount : 0;

      return { rows, rowsCount };
    } catch (error) {
      console.error("Error executing search query:", error);
      throw error;
    }
  },
  updateRecipies: async (req) => {

    if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
      throw new Error("Invalid request body. Expected an array of recipe updates.");
    }

    const updateResults = [];
    const currentDate = new Date().toISOString();

    for (const recipe of req.body) {
      if (!recipe.RATE_OF_OPERATION_KEY) {
        updateResults.push({
          success: false,
          error: "Missing RATE_OF_OPERATION_KEY",
          recipe,
        });
        continue;
      }

      try {
        const setClause = [];
        const params = {
          key: recipe.RATE_OF_OPERATION_KEY,
        };

        if (recipe.NEW_RO !== undefined) {
          setClause.push("NEW_RO = @newRo");
          params.newRo = recipe.NEW_RO;
        }

        if (recipe.RO_PCT_CHANGE !== undefined) {
          setClause.push("RO_PCT_CHANGE = @roPctChange");
          params.roPctChange = recipe.RO_PCT_CHANGE;
        }

        if (recipe.NEW_PLANNING_TIME !== undefined) {
          setClause.push("NEW_PLANNING_TIME = @newPlanningTime");
          params.newPlanningTime = recipe.NEW_PLANNING_TIME;
        }

        if (recipe.REVIEWED !== undefined) {
          setClause.push("REVIEWED = @reviewed");
          params.reviewed = recipe.REVIEWED;
        }

        if (recipe.UPDATED_BY !== undefined) {
          setClause.push("UPDATED_BY = @updatedBy");
          params.updatedBy = recipe.UPDATED_BY;
        }


        setClause.push("UPDATED_ON = @updatedOn");
        params.updatedOn = recipe.UPDATED_ON || currentDate;

        if (setClause.length === 0) {
          updateResults.push({
            success: false,
            error: "No fields to update",
            key: recipe.RATE_OF_OPERATION_KEY,
          });
          continue;
        }

        const query = `
          UPDATE [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
          SET ${setClause.join(", ")}
          WHERE RATE_OF_OPERATION_KEY = @key AND REVIEWED = 'N';  
          
          SELECT @@ROWCOUNT AS updatedRows;
        `;
        const result = await executeQuery(query, params);
        const updatedRows = result && result[0] ? result[0].updatedRows : 0;

        if (updatedRows > 0) {
          updateResults.push({
            success: true,
            key: recipe.RATE_OF_OPERATION_KEY,
            rowsAffected: updatedRows,
          });
        } else {
          updateResults.push({
            success: false,
            key: recipe.RATE_OF_OPERATION_KEY,
            error: "Update skipped!Recipe already reviewed or updated by another user while you were working on it.",
          });
        }
      } catch (error) {
        console.error(`Error updating recipe ${recipe.RATE_OF_OPERATION_KEY}:`, error);
        updateResults.push({
          success: false,
          error: error.message,
          key: recipe.RATE_OF_OPERATION_KEY,
        });
      }
    }

    const totalUpdated = updateResults.filter((r) => r.success).length;
    const totalSkipped = updateResults.filter((r) => !r.success && r.error.includes("REVIEWED")).length;
    const totalFailed = updateResults.filter((r) => !r.success && !r.error.includes("REVIEWED")).length;

    return {
      success: totalFailed === 0,
      results: updateResults,
      totalUpdated,
      totalSkipped,
      totalFailed,
      message: totalUpdated > 0 ? `${totalUpdated} recipe(s) updated successfully.` : " " +
        totalSkipped > 0 ? `${totalSkipped} skipped due to REVIEWED not being 'N'. ` : " " +
          totalFailed > 0 ? `${totalFailed} failed due to errors.` : " ",
    };
  },

  downloadRecipies: async (req) => {
    try {
      const reviewedStatus = req.body.reviewedStatus === "All"
        ? ""
        : `AND REVIEWED='${req.body.reviewedStatus}'`;

      const filterConditions = req.body.filters
        ? buildWhereClause(req.body.filters)
        : "";

      const baseWhere = `
        WHERE RECIPE_NUMBER IS NOT NULL
        ${reviewedStatus}
        ${filterConditions}
      `;

      const query = `
        SELECT * 
        FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
        ${baseWhere}
        ORDER BY SNAPSHOT_DATE DESC;
      `;

      const rows = await executeQuery(query);

      if (!rows || rows.length === 0) {
        throw new Error("No data available for download");
      }

      const fileType = req.body.fileType || "xlsx";

      if (fileType === "xlsx") {
        return await generateExcel(rows);
      } else if (fileType === "csv") {
        return generateCSV(rows);
      } else {
        throw new Error("Unsupported file type. Please choose 'xlsx' or 'csv'");
      }
    } catch (error) {
      console.error("Error generating download:", error);
      throw error;
    }
  },
};


async function generateExcel(data) {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet("Rate of Operations");

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map((header) => ({
      header: header,
      key: header,
      width: 15,
    }));
  }

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };


  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}


function generateCSV(data) {
  try {
    const fields = data.length > 0 ? Object.keys(data[0]) : [];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);
    return csv;
  } catch (error) {
    console.error("Error generating CSV:", error);
    throw error;
  }
}

module.exports = appService;