const NodeCache = require("node-cache");
const responseCache = new NodeCache({
    stdTTL: 60 * 60 * 24 // cache expires in 24 hrs from the time of creation or on server restart
})

module.exports = responseCache