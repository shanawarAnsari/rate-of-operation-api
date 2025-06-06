const buildWhereClause = (filters) => {
    let whereClause = "";
    Object.entries(filters).forEach(([filterName, filterValues]) => {
        if (filterName === "tro_change") {
            return; // Skip tro_change here, we'll handle it separately
        }

        if (filterValues && filterValues.length > 0) {
            const conditions = filterValues
                .map((value) => `${filterName}='${value}'`)
                .join(" OR ");
            if (conditions) {
                whereClause += ` AND (${conditions})`;
            }
        }
    });
    return whereClause;
};

const processTroChangeFilter = (troChangeFilters) => {
    if (!troChangeFilters || !troChangeFilters.length) {
        return null;
    }

    const conditions = [];

    for (const range of troChangeFilters) {
        if (range === "above 15%") {
            conditions.push("(ABS(RO_PCT_CHANGE) > 15)");
        } else {
            // Parse ranges like "0% to 5%", "5% to 10%", etc.
            const matches = range.match(/(\d+)% to (\d+)%/);
            if (matches && matches.length === 3) {
                const min = parseInt(matches[1]);
                const max = parseInt(matches[2]);
                conditions.push(
                    `(ABS(RO_PCT_CHANGE) >= ${min} AND ABS(RO_PCT_CHANGE) <= ${max})`
                );
            }
        }
    }

    return conditions.length ? conditions.join(" OR ") : null;
};

module.exports = {
    buildWhereClause,
    processTroChangeFilter,
};