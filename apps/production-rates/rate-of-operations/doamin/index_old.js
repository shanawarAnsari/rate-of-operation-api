const { executeQuery } = require("../../../common/sqlConnectionManager");
const { getFilters, getRecipies, getReviewedStatus } = require("../responses");
const {
  buildWhereClause,
  processTroChangeFilter,
} = require("../helpers/sqlHelpers");
const excel = require("exceljs");
const { Parser } = require("json2csv");

const appService = {
  getRecipies: async (req) => {
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);

    const offset = (pageNumber - 1) * rowsPerPage;

    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const reviewedStatus =
      req.body.reviewedStatus === "All"
        ? ""
        : ` AND REVIEWED='${req.body.reviewedStatus}' `;

    const filterConditions = req.body.filters
      ? buildWhereClause(req.body.filters)
      : "";

    let query = `SELECT * 
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE SNAPSHOT_DATE BETWEEN @startDate AND @endDate
      ?reviewedStatus?
      ?filterConditions?
      ORDER BY SNAPSHOT_DATE desc
      OFFSET @offset ROWS
      FETCH NEXT @rowsPerPage ROWS ONLY;`;

    const params = {
      offset: offset,
      rowsPerPage: rowsPerPage,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    query = query.replace("?reviewedStatus?", reviewedStatus);
    query = query.replace("?filterConditions?", filterConditions);
    console.log("Query:", query);
    let recipesData = getRecipies();
    let rows = recipesData.rows;
    let rowsCount = recipesData.rowsCount;
    response = { rows, rowsCount };
    return response;
  },
  getCategories: async () => {
    response = ["Personal Care"];
    return response;
  },
  getFilters: async (req) => {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    let query = `SELECT Distinct RECIPE_TYPE,
      MAKER_RESOURCE,PACKER_RESOURCE,PRODUCT_CODE,
      PROD_DESC,PRODUCT_VARIANT,PRODUCT_SIZE,SETUP_GROUP
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE SNAPSHOT_DATE BETWEEN @startDate AND @endDate;`;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    let response = getFilters();
    return response;
  },
  getReviewedStatus: async (req) => {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    let query = `SELECT Distinct REVIEWED
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE SNAPSHOT_DATE BETWEEN @startDate AND @endDate;`;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    let response = getReviewedStatus();
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
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Handle reviewedStatus similar to getRecipies
    const reviewedStatus =
      req.body.reviewedStatus === "All"
        ? ""
        : ` AND REVIEWED='${req.body.reviewedStatus}' `;

    // Handle filters similar to getRecipies
    const filterConditions = req.body.filters
      ? buildWhereClause(req.body.filters)
      : "";

    // Handle tro_change filter specifically
    let troChangeCondition = "";
    if (
      req.body.filters &&
      req.body.filters.tro_change &&
      req.body.filters.tro_change.length > 0
    ) {
      const troChangeClause = processTroChangeFilter(req.body.filters.tro_change);
      if (troChangeClause) {
        troChangeCondition = ` AND (${troChangeClause})`;
      }
    }

    // Create the SQL search condition for all string columns
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

    // Query to get the filtered rows with pagination
    let query = `
      SELECT *
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE SNAPSHOT_DATE BETWEEN @startDate AND @endDate
      AND (${searchCondition})
      ?reviewedStatus?
      ?filterConditions?
      ?troChangeCondition?
      ORDER BY SNAPSHOT_DATE DESC
      OFFSET @offset ROWS
      FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    // Query to get the total count of matching rows
    let countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE SNAPSHOT_DATE BETWEEN @startDate AND @endDate
      AND (${searchCondition})
      ?reviewedStatus?
      ?filterConditions?
      ?troChangeCondition?
    `;

    const params = {
      offset: offset,
      rowsPerPage: rowsPerPage,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      searchPattern: `%${searchText}%`,
    };

    // Apply template replacements just like in getRecipies
    query = query.replace("?reviewedStatus?", reviewedStatus);
    query = query.replace("?filterConditions?", filterConditions);
    query = query.replace("?troChangeCondition?", troChangeCondition);
    countQuery = countQuery.replace("?reviewedStatus?", reviewedStatus);
    countQuery = countQuery.replace("?filterConditions?", filterConditions);
    countQuery = countQuery.replace("?troChangeCondition?", troChangeCondition);

    try {
      console.log("Search Query:", query);
      // Execute the queries
      const rows = await executeQuery(query, params);
      const countResult = await executeQuery(countQuery, params);
      const rowsCount =
        countResult && countResult[0] ? countResult[0].totalCount : 0;

      // If database query fails, fall back to mock data for testing
      if (!rows) {
        console.warn("Falling back to mock data for testing");
        // Get mock data
        const recipesData = getRecipies();
        const allMockResults = recipesData.rows;

        // Filter by search text
        let mockResults = allMockResults.filter((row) =>
          Object.entries(row).some(
            ([key, value]) =>
              value &&
              typeof value === "string" &&
              value.toLowerCase().includes(searchText.toLowerCase())
          )
        );

        // Apply reviewedStatus filter if not "All"
        if (req.body.reviewedStatus !== "All") {
          mockResults = mockResults.filter(
            (row) => row.REVIEWED === req.body.reviewedStatus
          );
        }

        // Apply regular filters
        if (req.body.filters) {
          Object.entries(req.body.filters).forEach(([key, values]) => {
            if (key !== "tro_change" && values && values.length > 0) {
              mockResults = mockResults.filter(
                (row) => row[key] && values.includes(row[key])
              );
            }
          });

          // Apply tro_change filter specifically
          if (
            req.body.filters.tro_change &&
            req.body.filters.tro_change.length > 0
          ) {
            mockResults = mockResults.filter((row) => {
              if (row.RO_PCT_CHANGE === null || row.RO_PCT_CHANGE === undefined) {
                return false;
              }

              const absPctChange = Math.abs(row.RO_PCT_CHANGE);

              return req.body.filters.tro_change.some((range) => {
                if (range === "above 15%") {
                  return absPctChange > 15;
                }

                const matches = range.match(/(\d+)% to (\d+)%/);
                if (matches && matches.length === 3) {
                  const min = parseInt(matches[1]);
                  const max = parseInt(matches[2]);
                  return absPctChange >= min && absPctChange <= max;
                }

                return false;
              });
            });
          }
        }

        const paginatedMockResults = mockResults.slice(offset, offset + rowsPerPage);
        return {
          rows: paginatedMockResults,
          rowsCount: mockResults.length,
        };
      }

      return { rows, rowsCount };
    } catch (error) {
      console.error("Error executing search query:", error);
      throw error;
    }
  },
  updateRecipies: async (req) => {
    // Validate request body
    if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
      throw new Error("Invalid request body. Expected an array of recipe updates.");
    }

    const updateResults = [];
    const currentDate = new Date().toISOString();

    // Process each recipe update
    for (const recipe of req.body) {
      // Validate required fields
      if (!recipe.RATE_OF_OPERATION_KEY) {
        updateResults.push({
          success: false,
          error: "Missing RATE_OF_OPERATION_KEY",
          recipe,
        });
        continue;
      }

      try {
        // Build SET clause for UPDATE statement
        const setClause = [];
        const params = {
          key: recipe.RATE_OF_OPERATION_KEY,
        };

        // Add fields to update if provided
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

        // Always update the UPDATED_ON field
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

        // Build and execute UPDATE query
        const query = `
          UPDATE [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
          SET ${setClause.join(", ")}
          WHERE RATE_OF_OPERATION_KEY = @key;
          
          SELECT @@ROWCOUNT AS updatedRows;
        `;

        console.log(`Updating recipe: ${recipe.RATE_OF_OPERATION_KEY}`);
        const result = await executeQuery(query, params);

        const updatedRows = result && result[0] ? result[0].updatedRows : 0;

        updateResults.push({
          success: updatedRows > 0,
          key: recipe.RATE_OF_OPERATION_KEY,
          rowsAffected: updatedRows,
        });
      } catch (error) {
        console.error(
          `Error updating recipe ${recipe.RATE_OF_OPERATION_KEY}:`,
          error
        );
        updateResults.push({
          success: false,
          error: error.message,
          key: recipe.RATE_OF_OPERATION_KEY,
        });
      }
    }

    return {
      success: updateResults.every((r) => r.success),
      results: updateResults,
      totalUpdated: updateResults.filter((r) => r.success).length,
      totalFailed: updateResults.filter((r) => !r.success).length,
    };
  },
  downloadRecipies: async (req) => {
    try {
      // For downloading all data, we'll bypass pagination completely
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      );

      // Handle reviewedStatus filter
      const reviewedStatus =
        req.body.reviewedStatus === "All"
          ? ""
          : ` AND REVIEWED='${req.body.reviewedStatus}' `;

      // Handle other filters
      const filterConditions = req.body.filters
        ? buildWhereClause(req.body.filters)
        : "";

      // Handle tro_change filter specifically
      let troChangeCondition = "";
      if (
        req.body.filters &&
        req.body.filters.tro_change &&
        req.body.filters.tro_change.length > 0
      ) {
        const troChangeClause = processTroChangeFilter(req.body.filters.tro_change);
        if (troChangeClause) {
          troChangeCondition = ` AND (${troChangeClause})`;
        }
      }

      // Create query without pagination
      let query = `SELECT * 
        FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
        WHERE SNAPSHOT_DATE BETWEEN @startDate AND @endDate
        ?reviewedStatus?
        ?filterConditions?
        ?troChangeCondition?
        ORDER BY SNAPSHOT_DATE desc`;

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      query = query.replace("?reviewedStatus?", reviewedStatus);
      query = query.replace("?filterConditions?", filterConditions);
      query = query.replace("?troChangeCondition?", troChangeCondition);

      console.log("Download Query:", query);

      // In a real implementation, we would use executeQuery here
      // For now, use the mock data from getRecipies()
      let recipesData = getRecipies();
      let allRows = recipesData.rows;

      // Apply filters manually for the mock data
      if (req.body.reviewedStatus !== "All") {
        allRows = allRows.filter((row) => row.REVIEWED === req.body.reviewedStatus);
      }

      // Apply other filters
      if (req.body.filters) {
        Object.entries(req.body.filters).forEach(([key, values]) => {
          if (key !== "tro_change" && values && values.length > 0) {
            allRows = allRows.filter((row) => row[key] && values.includes(row[key]));
          }
        });

        // Apply tro_change filter specifically
        if (req.body.filters.tro_change && req.body.filters.tro_change.length > 0) {
          allRows = allRows.filter((row) => {
            if (row.RO_PCT_CHANGE === null || row.RO_PCT_CHANGE === undefined) {
              return false;
            }

            const absPctChange = Math.abs(row.RO_PCT_CHANGE);

            return req.body.filters.tro_change.some((range) => {
              if (range === "above 15%") {
                return absPctChange > 15;
              }

              const matches = range.match(/(\d+)% to (\d+)%/);
              if (matches && matches.length === 3) {
                const min = parseInt(matches[1]);
                const max = parseInt(matches[2]);
                return absPctChange >= min && absPctChange <= max;
              }

              return false;
            });
          });
        }
      }

      // Create an object structure similar to what getRecipies returns
      recipesData = {
        rows: allRows,
        rowsCount: allRows.length,
      };

      if (!recipesData || !recipesData.rows || recipesData.rows.length === 0) {
        throw new Error("No data available for download");
      }

      const fileType = req.body.fileType || "xlsx";

      if (fileType === "xlsx") {
        return await generateExcel(recipesData.rows);
      } else if (fileType === "csv") {
        return generateCSV(recipesData.rows);
      } else {
        throw new Error("Unsupported file type. Please choose 'xlsx' or 'csv'");
      }
    } catch (error) {
      console.error("Error generating download:", error);
      throw error;
    }
  },
};

// Helper function to generate Excel file
async function generateExcel(data) {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet("Rate of Operations");

  // Add headers
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map((header) => ({
      header: header,
      key: header,
      width: 15,
    }));
  }

  // Add rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Format headers
  worksheet.getRow(1).font = { bold: true };

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// Helper function to generate CSV file
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
