const { executeQuery } = require("../../../common/sqlConnectionManager");
const { getFilters, getRecipies, getReviewedStatus } = require("../responses");
const { buildWhereClause } = require("../helpers/sqlHelpers");

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
    let rows = getRecipies();
    let rowsCount = rows?.length;
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
    const query = `
      SELECT *
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE 
        SNAPSHOT_DATE BETWEEN @startDate AND @endDate AND
        (${searchCondition})
      ORDER BY SNAPSHOT_DATE DESC
      OFFSET @offset ROWS
      FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    // Query to get the total count of matching rows
    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE 
        SNAPSHOT_DATE BETWEEN @startDate AND @endDate AND
        (${searchCondition})
    `;

    const params = {
      offset: offset,
      rowsPerPage: rowsPerPage,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      searchPattern: `%${searchText}%`,
    };

    try {
      console.log("Search Query:", query);
      // Execute the queries

      console.warn("Falling back to mock data for testing");
      const mockResults = getRecipies().rows.filter((row) =>
        Object.entries(row).some(
          ([key, value]) =>
            value &&
            typeof value === "string" &&
            value.toLowerCase().includes(searchText.toLowerCase())
        )
      );
      const paginatedMockResults = mockResults.slice(offset, offset + rowsPerPage);
      return {
        rows: paginatedMockResults,
        rowsCount: mockResults.length,
      };
    } catch (error) {
      console.error("Error executing search query:", error);
      throw error;
    }
  },
};

module.exports = appService;
