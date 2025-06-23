// const { executeQuery } = require("../../../common/sqlConnectionManager");
const { mockWrenchtimeData } = require("./domain_db");
const excel = require("exceljs");
const { Parser } = require("json2csv");
// const { buildWhereClause } = require("../helpers/sqlHelpers");

// const TABLE_NAME = "[dbo].[T_NA_PRODRATE_SETUPTIME]";

// Helper function to apply filters
const applyFilters = (data, filters) => {
  if (!filters) return data;

  return data.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value && item[key]) {
        const itemValue =
          typeof item[key] === "string"
            ? item[key].toLowerCase()
            : String(item[key]).toLowerCase();

        const filterValue =
          typeof value === "string"
            ? value.toLowerCase()
            : String(value).toLowerCase();

        if (!itemValue.includes(filterValue)) {
          return false;
        }
      }
    }
    return true;
  });
};

// Helper function to apply search
const applySearch = (data, searchText) => {
  if (!searchText) return data;

  const searchLower = searchText.toLowerCase();
  return data.filter((item) =>
    Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchLower)
    )
  );
};

const appService = {
  getWrenchtime: async (req) => {
    const pageNumber = parseInt(req.body.pageNumber || 1);
    const rowsPerPage = parseInt(req.body.rowsPerPage || 10);
    const offset = (pageNumber - 1) * rowsPerPage;

    let filteredData = [...mockWrenchtimeData];

    // Apply reviewed status filter
    if (req.body.reviewedStatus && req.body.reviewedStatus !== "All") {
      filteredData = filteredData.filter(
        (item) => item.REVIEWED === req.body.reviewedStatus
      );
    }

    // Apply filters
    if (req.body.filters) {
      filteredData = applyFilters(filteredData, req.body.filters);
    }

    // Sort by SNAPSHOT_DATE DESC
    filteredData.sort(
      (a, b) => new Date(b.SNAPSHOT_DATE) - new Date(a.SNAPSHOT_DATE)
    );

    // Apply pagination
    const rows = filteredData.slice(offset, offset + rowsPerPage);
    const rowsCount = filteredData.length;

    return { rows, rowsCount };
  },

  searchWrenchtime: async (req) => {
    const {
      searchText,
      pageNumber = 1,
      rowsPerPage = 10,
      reviewedStatus,
      filters,
    } = req.body;
    const offset = (pageNumber - 1) * rowsPerPage;

    let filteredData = [...mockWrenchtimeData];

    // Apply reviewed status filter
    if (reviewedStatus && reviewedStatus !== "All") {
      filteredData = filteredData.filter((item) => item.REVIEWED === reviewedStatus);
    }

    // Apply filters
    if (filters) {
      filteredData = applyFilters(filteredData, filters);
    }

    // Apply search
    if (searchText) {
      filteredData = applySearch(filteredData, searchText);
    }

    // Sort by SNAPSHOT_DATE DESC
    filteredData.sort(
      (a, b) => new Date(b.SNAPSHOT_DATE) - new Date(a.SNAPSHOT_DATE)
    );

    // Apply pagination
    const rows = filteredData.slice(offset, offset + rowsPerPage);
    const rowsCount = filteredData.length;

    return { rows, rowsCount };
  },

  updateWrenchtime: async (req) => {
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

        const index = mockWrenchtimeData.findIndex(
          (data) => data.SETUP_TIME_KEY === SETUP_TIME_KEY
        );

        if (index !== -1) {
          mockWrenchtimeData[index] = {
            ...mockWrenchtimeData[index],
            NEW_SETUPTIME_MINUTES,
            SETUPTIME_PCT_CHANGE,
            NEW_SETUPTIME_SECONDS,
            REVIEWED,
            UPDATED_BY,
            UPDATED_ON,
          };

          results.push({
            success: true,
            key: SETUP_TIME_KEY,
            rowsAffected: 1,
          });
          totalUpdated += 1;
        } else {
          results.push({
            success: false,
            key: SETUP_TIME_KEY,
            error: "Record not found",
          });
          totalFailed += 1;
        }
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

  downloadWrenchtime: async (req) => {
    const { reviewedStatus, filters, fileType = "xlsx" } = req.body;

    let filteredData = [...mockWrenchtimeData];

    // Apply reviewed status filter
    if (reviewedStatus && reviewedStatus !== "All") {
      filteredData = filteredData.filter((item) => item.REVIEWED === reviewedStatus);
    }

    // Apply filters
    if (filters) {
      filteredData = applyFilters(filteredData, filters);
    }

    // Sort by SNAPSHOT_DATE DESC
    filteredData.sort(
      (a, b) => new Date(b.SNAPSHOT_DATE) - new Date(a.SNAPSHOT_DATE)
    );

    if (fileType === "csv") {
      const parser = new Parser();
      return parser.parse(filteredData);
    } else {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Wrenchtime");
      if (filteredData.length > 0) {
        worksheet.columns = Object.keys(filteredData[0]).map((key) => ({
          header: key,
          key,
        }));
        worksheet.addRows(filteredData);
      }
      return workbook.xlsx.writeBuffer();
    }
  },

  getFilters: async (req) => {
    // Extract unique combinations of filter values
    const uniqueFilters = [];
    const seen = new Set();

    mockWrenchtimeData.forEach((item) => {
      // Create a composite key from all filter fields to track uniqueness
      const key = [
        item.INTERFACE,
        item.SETUP_MATRIX,
        item.LOCATION,
        item.FROM_SETUP_GROUP,
        item.TO_SETUP_GROUP,
        item.FROM_MACHINE,
        item.TO_MACHINE,
        item.FROM_PRODUCT_SIZE,
        item.TO_PRODUCT_SIZE,
        item.FROM_PRODUCT_VARIANT,
        item.TO_PRODUCT_VARIANT,
      ].join("|");

      if (!seen.has(key)) {
        seen.add(key);
        uniqueFilters.push({
          INTERFACE: item.INTERFACE || "",
          SETUP_MATRIX: item.SETUP_MATRIX || "",
          LOCATION: item.LOCATION || "",
          FROM_SETUP_GROUP: item.FROM_SETUP_GROUP || "",
          TO_SETUP_GROUP: item.TO_SETUP_GROUP || "",
          FROM_MACHINE: item.FROM_MACHINE || "",
          TO_MACHINE: item.TO_MACHINE || "",
          FROM_PRODUCT_SIZE: item.FROM_PRODUCT_SIZE || "",
          TO_PRODUCT_SIZE: item.TO_PRODUCT_SIZE || "",
          FROM_PRODUCT_VARIANT: item.FROM_PRODUCT_VARIANT || "",
          TO_PRODUCT_VARIANT: item.TO_PRODUCT_VARIANT || "",
        });
      }
    });

    return uniqueFilters;
  },

  getCategories: async () => {
    return ["Personal Care"];
  },

  getReviewedStatus: async () => {
    return [
      ...new Set(mockWrenchtimeData.map((item) => item.REVIEWED).filter(Boolean)),
    ];
  },
};

module.exports = appService;
