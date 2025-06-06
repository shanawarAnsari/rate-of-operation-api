
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');
const cacheManager = require('../common/cache/cacheManager');

let connectionPool;
let accessToken;
let tokenExpiry;

async function getConnectionPool() {
  if (connectionPool && new Date() < tokenExpiry) {
    return connectionPool
  };

  let { sqlServer, sqlDb } = cacheManager.getCache('key_vault_cache');
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken('https://database.windows.net/');
  accessToken = tokenResponse.token;
  tokenExpiry = new Date(tokenResponse.expiresOnTimestamp);

  const poolConfig = {
    server: sqlServer,
    port: 1433,
    database: sqlDb,
    options: {
      encrypt: true,
      enableArithAbort: true,
      connectTimeout: 30000 // 30 seconds
    },
    authentication: {
      type: 'azure-active-directory-access-token'
    },
    token: accessToken
  };

  return sql
    .connect(poolConfig)
    .then(pool => {
      connectionPool = pool;
      return connectionPool;
    }).catch(err => {
      console.error('Database connection failed:', err);
      throw err;
    });
}

module.exports = {
  executeQuery: async (sqlText, bindParams, next) => {
    return new Promise(async (resolve, reject) => {
      let bindings = bindParams;
      if (bindParams === undefined || bindParams?.length === 0) {
        bindings = {};
      }
      await getConnectionPool();
      try {
        const request = connectionPool.request();
        for (const [key, value] of Object.entries(bindings)) {
          request.input(key, value);
        }
        const result = await request.query(sqlText);
        resolve(result?.recordset);
      } catch (err) {
        reject(err);
      }
    });
  },
  getSqlPool: () => {
    return connectionPool;
  }
};
