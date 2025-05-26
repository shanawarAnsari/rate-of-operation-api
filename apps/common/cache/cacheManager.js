const resposneCache = require('./index');

const cacheManager = {
  setCache: (cacheKey, cacheValue) => {
    resposneCache.set(cacheKey, cacheValue);
  },

  getCache: (cacheKey) => {
    return resposneCache.get(cacheKey);
  },

  checkAndReturnCache: (req, res, cacheKey) => {
    let cachedResponse = {};
    if (resposneCache.has(cacheKey)) {
      if (cacheKey === "key_vault_secrets") {
        cachedResponse = resposneCache.get(cacheKey);
        return cachedResponse;
      }
      else {
        cachedResponse = resposneCache.get(cacheKey);
      }

      if (checkForSameParams({ ...req.query }, cachedResponse)) {
        return ({ data: cachedResponse.response });
      } else {
        return false;
      }
    }
    else {
      return false;
    }
  }
}

// custom caching based on request parameters
function checkForSameParams(query, response) {
  if (response.fromDate === query.fromDate && response.toDate === query.toDate)
    return true;
  else
    return false;
}

module.exports = cacheManager