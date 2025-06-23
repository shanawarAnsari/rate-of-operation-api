const buildWhereClause = (filters) => {
    const conditions = Object.entries(filters).map(([key, values]) => {
        if (!values || values.length === 0) return null;

        if (key === "TRO_CHANGE") {
            const troConditions = values.map((range) => {
                range = range.trim().toLowerCase();

                if (range.includes("to")) {
                    const [minStr, maxStr] = range.replace(/%/g, '').split(' to ');
                    const min = Number(minStr);
                    const max = Number(maxStr);
                    if (!isNaN(min) && !isNaN(max)) {
                        return `(ABS(RO_PCT_CHANGE) >= ${min} AND ABS(RO_PCT_CHANGE) < ${max})`;
                    }
                } else if (range.includes("above")) {
                    const min = parseInt(range.replace(/[^\d]/g, ''), 10);
                    if (!isNaN(min)) {
                        return `(ABS(RO_PCT_CHANGE) >= ${min})`;
                    }
                }
                return null;
            }).filter(Boolean);

            return troConditions.length > 0 ? `(${troConditions.join(" OR ")})` : null;
        } else {
            const valueConditions = values.map(v => `${key}='${v}'`);
            return valueConditions.length > 0 ? `(${valueConditions.join(" OR ")})` : null;
        }
    }).filter(Boolean);

    return conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : '';
};



module.exports = {
    buildWhereClause
};