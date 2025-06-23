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
        FROM [dbo].[T_NA_PRODRATE_SETUPTIME]
        ${baseWhere}
        ORDER BY SNAPSHOT_DATE DESC
        OFFSET @offset ROWS
        FETCH NEXT @rowsPerPage ROWS ONLY;
    `;

    const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM [dbo].[T_NA_PRODRATE_SETUPTIME]
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

}