const { executeQuery } = require("../../../common/sqlConnectionManager");
const excel = require("exceljs");
const { Parser } = require("json2csv");
const { buildWhereClause } = require("../helpers/sqlHelpers");

const TABLE_NAME = "[dbo].[T_NA_PRODRATE_SETUPTIME]";

/**
 * Service to handle operations related to wrench time data.
 */
const appService = {
  /**
   * Retrieves wrench time records with pagination and filtering.
   * @param {Object} req - The request object containing query parameters.
   * @returns {Object} - An object containing the rows and total count.
   */
  getWrenchtime: async (req) => {
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);
    const offset = (pageNumber - 1) * rowsPerPage;

    const reviewedStatus =
      req.body.reviewedStatus === "All"
        ? ""
        : `AND REVIEWED='${req.body.reviewedStatus}'`;

    const filterConditions = req.body.filters
      ? buildWhereClause(req.body.filters)
      : "";

    const baseWhere = `WHERE SETUP_TIME_KEY IS NOT NULL ${reviewedStatus} ${filterConditions}`;

    const query = `
        SELECT * 
        FROM ${TABLE_NAME}
        ${baseWhere}
        ORDER BY SNAPSHOT_DATE DESC
        OFFSET @offset ROWS
        FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM ${TABLE_NAME}
        ${baseWhere};
    `;

    const params = {
      offset,
      rowsPerPage,
    };

    const rows = await executeQuery(query, params);
    const countResult = await executeQuery(countQuery, params);
    const rowsCount = countResult && countResult[0] ? countResult[0].totalCount : 0;

    return { rows, rowsCount };
  },

  /**
   * Searches for wrench time records based on the provided search text and filters.
   * @param {Object} req - The request object containing search parameters.
   * @returns {Object} - An object containing the matching rows and total count.
   */
  searchWrenchtime: async (req) => {
    const {
      searchText,
      pageNumber = 1,
      rowsPerPage = 10,
      reviewedStatus,
      filters,
    } = req.body;
    const offset = (pageNumber - 1) * rowsPerPage;
    const reviewedClause =
      reviewedStatus === "All" ? "" : `AND REVIEWED='${reviewedStatus}'`;
    const filterConditions = filters ? buildWhereClause(filters) : "";

    // Search across relevant columns
    const searchClause = searchText
      ? `AND (
        SETUP_TIME_KEY LIKE '%${searchText}%'
        OR BUSINESS_UNIT LIKE '%${searchText}%'
        OR INTERFACE LIKE '%${searchText}%'
        OR SETUP_MATRIX LIKE '%${searchText}%'
        OR LOCATION LIKE '%${searchText}%'
        OR FROM_SETUP_GROUP LIKE '%${searchText}%'
        OR TO_SETUP_GROUP LIKE '%${searchText}%'
        OR FROM_MACHINE LIKE '%${searchText}%'
        OR TO_MACHINE LIKE '%${searchText}%'
        OR FROM_PRODUCT_SIZE LIKE '%${searchText}%'
        OR TO_PRODUCT_SIZE LIKE '%${searchText}%'
        OR FROM_PRODUCT_VARIANT LIKE '%${searchText}%'
        OR TO_PRODUCT_VARIANT LIKE '%${searchText}%'
      )`
      : "";

    const baseWhere = `WHERE SETUP_TIME_KEY IS NOT NULL ${reviewedClause} ${filterConditions} ${searchClause}`;

    const query = `
      SELECT *
      FROM ${TABLE_NAME}
      ${baseWhere}
      ORDER BY SNAPSHOT_DATE DESC
      OFFSET @offset ROWS
      FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM ${TABLE_NAME}
      ${baseWhere};
    `;

    const params = { offset, rowsPerPage };
    const rows = await executeQuery(query, params);
    const countResult = await executeQuery(countQuery, params);
    const rowsCount = countResult && countResult[0] ? countResult[0].totalCount : 0;

    return { rows, rowsCount };
  },

  /**
   * Updates wrench time records in batch.
   * @param {Object} req - The request object containing update data.
   * @returns {Object} - An object containing the update results and counts.
   */
  updateWrenchtime: async (req) => {
    // Batch update logic for wrenchtime records
    const updates = req.body;
    const results = [];
    let totalUpdated = 0;
    let totalFailed = 0;

    for (const item of updates) {
      try {
        const {
          SETUP_TIME_KEY,
          NEW_SETUPTIME_MINUTES,
          SETUPTIME_PCT_CHANGE,
          NEW_SETUPTIME_SECONDS,
          REVIEWED,
          UPDATED_BY,
          UPDATED_ON,
        } = item;
        const updateQuery = `
          UPDATE ${TABLE_NAME}
          SET
            NEW_SETUPTIME_MINUTES = @NEW_SETUPTIME_MINUTES,
            SETUPTIME_PCT_CHANGE = @SETUPTIME_PCT_CHANGE,
            NEW_SETUPTIME_SECONDS = @NEW_SETUPTIME_SECONDS,
            REVIEWED = @REVIEWED,
            UPDATED_BY = @UPDATED_BY,
            UPDATED_ON = @UPDATED_ON
          WHERE SETUP_TIME_KEY = @SETUP_TIME_KEY
        `;
        const params = {
          NEW_SETUPTIME_MINUTES,
          SETUPTIME_PCT_CHANGE,
          NEW_SETUPTIME_SECONDS,
          REVIEWED,
          UPDATED_BY,
          UPDATED_ON,
          SETUP_TIME_KEY,
        };
        const result = await executeQuery(updateQuery, params);
        results.push({
          success: true,
          key: SETUP_TIME_KEY,
          rowsAffected: result.rowsAffected,
        });
        totalUpdated += result.rowsAffected || 0;
      } catch (error) {
        results.push({
          success: false,
          key: item.SETUP_TIME_KEY,
          error: error.message,
        });
        totalFailed += 1;
      }
    }

    return {
      success: totalFailed === 0,
      results,
      totalUpdated,
      totalFailed,
    };
  },

  /**
   * Downloads wrench time records as a file (CSV or Excel).
   * @param {Object} req - The request object containing download parameters.
   * @returns {Buffer|String} - The file buffer or string data.
   */
  downloadWrenchtime: async (req) => {
    const { reviewedStatus, filters, fileType = "xlsx" } = req.body;
    const reviewedClause =
      reviewedStatus === "All" ? "" : `AND REVIEWED='${reviewedStatus}'`;
    const filterConditions = filters ? buildWhereClause(filters) : "";
    const baseWhere = `WHERE SETUP_TIME_KEY IS NOT NULL ${reviewedClause} ${filterConditions}`;

    const query = `
      SELECT *
      FROM ${TABLE_NAME}
      ${baseWhere}
      ORDER BY SNAPSHOT_DATE DESC
    `;
    const rows = await executeQuery(query);

    if (fileType === "csv") {
      const parser = new Parser();
      return parser.parse(rows);
    } else {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Wrenchtime");
      if (rows.length > 0) {
        worksheet.columns = Object.keys(rows[0]).map((key) => ({
          header: key,
          key,
        }));
        worksheet.addRows(rows);
      }
      return workbook.xlsx.writeBuffer();
    }
  },

  /**
   * Retrieves unique values for filterable columns.
   * @returns {Object} - An object containing arrays of unique values for each filterable column.
   */
  getFilters: async () => {
    // Return unique values for each filterable column
    const filterColumns = [
      "INTERFACE",
      "SETUP_MATRIX",
      "LOCATION",
      "FROM_SETUP_GROUP",
      "TO_SETUP_GROUP",
      "FROM_MACHINE",
      "TO_MACHINE",
      "FROM_PRODUCT_SIZE",
      "TO_PRODUCT_SIZE",
      "FROM_PRODUCT_VARIANT",
      "TO_PRODUCT_VARIANT",
      "BUSINESS_UNIT",
    ];
    const filters = {};
    for (const col of filterColumns) {
      const query = `SELECT DISTINCT ${col} FROM ${TABLE_NAME} WHERE ${col} IS NOT NULL`;
      const result = await executeQuery(query);
      filters[col] = result.map((row) => row[col]);
    }
    return filters;
  },

  /**
   * Retrieves unique categories for wrench time records.
   * @returns {Array} - An array of unique category values.
   */
  getCategories: async () => {
    // Example: return all unique SETUP_MATRIX values as categories
    const query = `SELECT DISTINCT SETUP_MATRIX FROM ${TABLE_NAME} WHERE SETUP_MATRIX IS NOT NULL`;
    const result = await executeQuery(query);
    return result.map((row) => row.SETUP_MATRIX);
  },

  /**
   * Retrieves unique reviewed status values.
   * @returns {Array} - An array of unique reviewed status values.
   */
  getReviewedStatus: async () => {
    // Return all unique REVIEWED values
    const query = `SELECT DISTINCT REVIEWED FROM ${TABLE_NAME} WHERE REVIEWED IS NOT NULL`;
    const result = await executeQuery(query);
    return result.map((row) => row.REVIEWED);
  },
};

module.exports = appService;
