const buildWhereClause = (filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return "";
  }

  const conditions = [];

  Object.entries(filters).forEach(([key, values]) => {
    if (key === "tro_change" || !Array.isArray(values) || values.length === 0) {
      return;
    }

    if (values.length === 1) {
      conditions.push(`${key}='${values[0]}'`);
    } else {
      const valuesList = values.map((val) => `'${val}'`).join(",");
      conditions.push(`${key} IN (${valuesList})`);
    }
  });

  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
};

module.exports = {
  buildWhereClause,
};
