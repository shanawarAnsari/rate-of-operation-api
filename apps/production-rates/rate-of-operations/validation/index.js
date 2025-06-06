const requestSchemas = require("./requestSchemas.js");
const responseSchemas = require("./responseSchemas");

module.exports = {
  ...requestSchemas,
  responseSchemas,
};