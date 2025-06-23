const buildWhereClause = (filters) => {
  const conditions = Object.entries(filters)
    .map(([key, values]) => {
      if (!values || values.length === 0) return null;

      if (key === "SETUPTIME_PCT_CHANGE") {
        const pctConditions = values
          .map((range) => {
            range = range.trim().toLowerCase();

            if (range.includes("to")) {
              const [minStr, maxStr] = range.replace(/%/g, "").split(" to ");
              const min = Number(minStr);
              const max = Number(maxStr);
              if (!isNaN(min) && !isNaN(max)) {
                return `(ABS(SETUPTIME_PCT_CHANGE) >= ${min} AND ABS(SETUPTIME_PCT_CHANGE) < ${max})`;
              }
            } else if (range.includes("above")) {
              const min = parseInt(range.replace(/[^\d]/g, ""), 10);
              if (!isNaN(min)) {
                return `(ABS(SETUPTIME_PCT_CHANGE) >= ${min})`;
              }
            }
            return null;
          })
          .filter(Boolean);

        return pctConditions.length > 0 ? `(${pctConditions.join(" OR ")})` : null;
      } else {
        const valueConditions = values.map((v) => `${key}='${v}'`);
        return valueConditions.length > 0
          ? `(${valueConditions.join(" OR ")})`
          : null;
      }
    })
    .filter(Boolean);

  return conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";
};

module.exports = {
  buildWhereClause,
};
