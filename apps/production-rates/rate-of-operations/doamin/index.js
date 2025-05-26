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
};

module.exports = appService;
