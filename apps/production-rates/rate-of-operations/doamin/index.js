const excel = require("exceljs");
const { Parser } = require("json2csv");
const {
  buildWhereClause,
  processTroChangeFilter,
} = require("../helpers/sqlHelpers");
const {
  getRecipies: getRecipiesData,
  getFilters: getFiltersData,
  getReviewedStatus: getReviewedStatusData,
} = require("../responses");

const appService = {
  getRecipies: async (req) => {
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);

    // Get data from responses.js
    const recipesData = getRecipiesData();
    let filteredRows = [...recipesData.rows];

    // Apply reviewedStatus filter
    if (req.body.reviewedStatus && req.body.reviewedStatus !== "All") {
      filteredRows = filteredRows.filter(
        (row) => row.REVIEWED === req.body.reviewedStatus
      );
    }

    // Apply other filters
    if (req.body.filters) {
      Object.entries(req.body.filters).forEach(([filterName, filterValues]) => {
        if (filterName === "tro_change") {
          // Handle tro_change filter
          if (filterValues && filterValues.length > 0) {
            filteredRows = filteredRows.filter((row) => {
              const absChange = Math.abs(row.RO_PCT_CHANGE || 0);
              return filterValues.some((range) => {
                if (range === "above 15%") {
                  return absChange > 15;
                } else {
                  const matches = range.match(/(\d+)% to (\d+)%/);
                  if (matches && matches.length === 3) {
                    const min = parseInt(matches[1]);
                    const max = parseInt(matches[2]);
                    return absChange >= min && absChange <= max;
                  }
                }
                return false;
              });
            });
          }
        } else {
          // Handle other filters
          if (filterValues && filterValues.length > 0) {
            filteredRows = filteredRows.filter((row) =>
              filterValues.includes(row[filterName])
            );
          }
        }
      });
    }

    // Apply pagination
    const totalCount = filteredRows.length;
    const offset = (pageNumber - 1) * rowsPerPage;
    const paginatedRows = filteredRows.slice(offset, offset + rowsPerPage);

    return { rows: paginatedRows, rowsCount: totalCount };
  },

  getCategories: async () => {
    try {
      // Currently only returning Personal Care as that's the only category
      // In future, this could be fetched from database if multiple categories exist
      const response = ["Personal Care"];
      return response;
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  },
  getFilters: async (req) => {
    // Get data from responses.js
    const filtersData = getFiltersData();
    return filtersData;
  },
  getReviewedStatus: async (req) => {
    // Get data from responses.js
    const reviewedStatusData = getReviewedStatusData();
    return reviewedStatusData;
  },
  searchRecipies: async (req) => {
    if (!req.body.searchText || req.body.searchText.trim() === "") {
      return { rows: [], rowsCount: 0 };
    }

    const searchText = req.body.searchText.trim().toLowerCase();
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);

    // Get data from responses.js
    const recipesData = getRecipiesData();
    let filteredRows = [...recipesData.rows];

    // Apply reviewedStatus filter
    if (req.body.reviewedStatus && req.body.reviewedStatus !== "All") {
      filteredRows = filteredRows.filter(
        (row) => row.REVIEWED === req.body.reviewedStatus
      );
    }

    // Apply other filters
    if (req.body.filters) {
      Object.entries(req.body.filters).forEach(([filterName, filterValues]) => {
        if (filterName === "tro_change") {
          // Handle tro_change filter
          if (filterValues && filterValues.length > 0) {
            filteredRows = filteredRows.filter((row) => {
              const absChange = Math.abs(row.RO_PCT_CHANGE || 0);
              return filterValues.some((range) => {
                if (range === "above 15%") {
                  return absChange > 15;
                } else {
                  const matches = range.match(/(\d+)% to (\d+)%/);
                  if (matches && matches.length === 3) {
                    const min = parseInt(matches[1]);
                    const max = parseInt(matches[2]);
                    return absChange >= min && absChange <= max;
                  }
                }
                return false;
              });
            });
          }
        } else {
          // Handle other filters
          if (filterValues && filterValues.length > 0) {
            filteredRows = filteredRows.filter((row) =>
              filterValues.includes(row[filterName])
            );
          }
        }
      });
    }

    // Apply search filter - search across all relevant string columns
    filteredRows = filteredRows.filter((row) => {
      const searchableFields = [
        "RATE_OF_OPERATION_KEY",
        "RECIPE_NUMBER",
        "MAKER_RESOURCE",
        "PACKER_RESOURCE",
        "BUSINESS_UNIT",
        "INTERFACE",
        "RECIPE_TYPE",
        "SAP_PRODUCT",
        "PROD_DESC",
        "PRODUCT_CODE",
        "TRADE_CODE",
        "PRODUCT_VARIANT",
        "PRODUCT_SIZE",
        "BASE_QTY_UOM",
        "PLANNING_UOM",
        "SETUP_GROUP",
        "RECOMMENDED_RO_SOURCE",
        "RULEBASED_RO_SOURCE",
        "REVIEWED",
        "ERROR_REPORT",
        "COMMENT",
        "CONSTRAINING_RESOURCE",
        "CONSTRAINING_RESOURCE_2",
        "CONSTRAINING_RESOURCE_3",
        "UPDATED_BY",
      ];

      return searchableFields.some((field) => {
        const value = row[field];
        return value && value.toString().toLowerCase().includes(searchText);
      });
    });

    // Apply pagination
    const totalCount = filteredRows.length;
    const offset = (pageNumber - 1) * rowsPerPage;
    const paginatedRows = filteredRows.slice(offset, offset + rowsPerPage);

    return { rows: paginatedRows, rowsCount: totalCount };
  },
  updateRecipies: async (req) => {
    // Validate request body
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
        // Since we're not using a real database, simulate the update
        // In a real scenario, this would update the database and return success/failure
        const mockSuccess = true; // Simulate successful update

        if (mockSuccess) {
          updateResults.push({
            success: true,
            key: recipe.RATE_OF_OPERATION_KEY,
            rowsAffected: 1,
          });
        } else {
          updateResults.push({
            success: false,
            key: recipe.RATE_OF_OPERATION_KEY,
            error:
              "Update skipped! Possibly updated by another user while you were working on it.",
          });
        }
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

    const totalUpdated = updateResults.filter((r) => r.success).length;
    const totalSkipped = updateResults.filter(
      (r) => !r.success && r.error.includes("REVIEWED")
    ).length;
    const totalFailed = updateResults.filter(
      (r) => !r.success && !r.error.includes("REVIEWED")
    ).length;

    return {
      success: totalFailed === 0,
      results: updateResults,
      totalUpdated,
      totalSkipped,
      totalFailed,
      message:
        totalUpdated > 0
          ? `${totalUpdated} recipe(s) updated successfully.`
          : " " + totalSkipped > 0
          ? `${totalSkipped} skipped due to REVIEWED not being 'N'. `
          : " " + totalFailed > 0
          ? `${totalFailed} failed due to errors.`
          : " ",
    };
  },
  downloadRecipies: async (req) => {
    try {
      // Get data from responses.js
      const recipesData = getRecipiesData();
      let filteredRows = [...recipesData.rows];

      // Apply reviewedStatus filter
      if (req.body.reviewedStatus && req.body.reviewedStatus !== "All") {
        filteredRows = filteredRows.filter(
          (row) => row.REVIEWED === req.body.reviewedStatus
        );
      }

      // Apply other filters
      if (req.body.filters) {
        Object.entries(req.body.filters).forEach(([filterName, filterValues]) => {
          if (filterName === "tro_change") {
            // Handle tro_change filter
            if (filterValues && filterValues.length > 0) {
              filteredRows = filteredRows.filter((row) => {
                const absChange = Math.abs(row.RO_PCT_CHANGE || 0);
                return filterValues.some((range) => {
                  if (range === "above 15%") {
                    return absChange > 15;
                  } else {
                    const matches = range.match(/(\d+)% to (\d+)%/);
                    if (matches && matches.length === 3) {
                      const min = parseInt(matches[1]);
                      const max = parseInt(matches[2]);
                      return absChange >= min && absChange <= max;
                    }
                  }
                  return false;
                });
              });
            }
          } else {
            // Handle other filters
            if (filterValues && filterValues.length > 0) {
              filteredRows = filteredRows.filter((row) =>
                filterValues.includes(row[filterName])
              );
            }
          }
        });
      }

      if (!filteredRows || filteredRows.length === 0) {
        throw new Error("No data available for download");
      }

      const fileType = req.body.fileType || "xlsx";

      if (fileType === "xlsx") {
        return await generateExcel(filteredRows);
      } else if (fileType === "csv") {
        return generateCSV(filteredRows);
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
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" }, // Yellow background
  };

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
