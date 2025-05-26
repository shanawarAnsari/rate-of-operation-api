const { executeQuery } = require("../../../common/sqlConnectionManager");

const appService = {
  getRecipies: async (req) => {
    const pageNumber = parseInt(req.query.pageNumber || 1); // Default to page 1 if not provided
    const rowsPerPage = parseInt(req.query.rowsPerPage || 10); // Default to 10 rows per page if not provided

    const offset = (pageNumber - 1) * rowsPerPage;

    // Get the start and end dates of the current month
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const reviewedStatus = req.query.reviewedStatus === "All" ? '' : ` AND REVIEWED='${req.query.reviewedStatus}' `
    let query = `SELECT * 
      FROM [dbo].[T_NA_PRODRATE_PLANNINGRATE_PERSONALCARE]
      WHERE  SNAPSHOT_DATE BETWEEN @startDate AND @endDate
      ?reviewedStatus?
      ORDER BY SNAPSHOT_DATE desc
      OFFSET @offset ROWS
      FETCH NEXT @rowsPerPage ROWS ONLY;`;

    const params = {
      offset: offset,
      rowsPerPage: rowsPerPage,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    query = query.replace('?reviewedStatus?', reviewedStatus)
    let rows = await executeQuery(query, params);
    let rowsCount = rows?.length;
    response = { rows, rowsCount }
    return response;
  },
  getCategories: async () => {
    response = ["Personal Care"]
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
    let response = await executeQuery(query, params);
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
    let response = await executeQuery(query, params);
    return response;
  },
};




module.exports = appService;