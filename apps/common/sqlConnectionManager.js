const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');
const cacheManager = require('../common/cache/cacheManager');

let connectionPool = null;
let accessToken = null;
let tokenExpiry = null;
let refreshingTokenPromise = null;

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes

async function fetchAccessToken() {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken('https://database.windows.net/');
  accessToken = tokenResponse.token;
  tokenExpiry = new Date(tokenResponse.expiresOnTimestamp);
  console.log('✅ Access token fetched. Expires at:', tokenExpiry);
}

async function createConnectionPool() {
  const { sqlServer, sqlDb } = cacheManager.getCache('key_vault_cache');

  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Invalid or missing access token.');
  }

  const poolConfig = {
    server: sqlServer,
    port: 1433,
    database: sqlDb,
    options: {
      encrypt: true,
      enableArithAbort: true,
      connectTimeout: 30000
    },
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token: accessToken
      }
    }
  };

  const newPool = await sql.connect(poolConfig);
  console.log('✅ New SQL connection pool created.');
  return newPool;
}

async function refreshTokenAndPoolIfNeeded() {
  const now = new Date();
  const shouldRefresh = !tokenExpiry || now >= new Date(tokenExpiry.getTime() - TOKEN_REFRESH_BUFFER_MS);

  if (!shouldRefresh) return;

  if (!refreshingTokenPromise) {
    refreshingTokenPromise = (async () => {
      try {
        console.log('🔄 Refreshing token and connection pool...');
        await fetchAccessToken();
        const newPool = await createConnectionPool();

        if (connectionPool) {
          await connectionPool.close();
          console.log('🧹 Old connection pool closed.');
        }

        connectionPool = newPool;
        console.log('✅ Connection pool refreshed.');
      } catch (err) {
        console.error('❌ Failed to refresh token or pool:', err);
        throw err;
      } finally {
        refreshingTokenPromise = null;
      }
    })();
  }

  await refreshingTokenPromise;
}

async function getConnectionPool() {
  await refreshTokenAndPoolIfNeeded();

  if (!connectionPool || !connectionPool.connected) {
    console.warn('⚠️ Connection pool is not connected. Recreating...');
    try {
      connectionPool = await createConnectionPool();
    } catch (err) {
      console.error('❌ Failed to recreate connection pool:', err);
      throw err;
    }
  }

  return connectionPool;
}

async function executeQuery(sqlText, bindParams = {}, retryCount = 2, delayMs = 500) {
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const pool = await getConnectionPool();
      const request = pool.request();

      for (const [key, value] of Object.entries(bindParams)) {
        request.input(key, value);
      }

      console.log(`[SQL] Executing query (Attempt ${attempt + 1})...`);
      const result = await request.query(sqlText);
      return result?.recordset;

    } catch (err) {
      const isRecoverable = ['ELOGIN', 'ECONNCLOSED'].includes(err.code) || err.message.includes('Token is expired');

      if (attempt < retryCount && isRecoverable) {
        console.warn(`[SQL] Recoverable error: ${err.code || err.message}. Retrying in ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
        await refreshTokenAndPoolIfNeeded();
        delayMs *= 2; // exponential backoff
      } else {
        console.error('[SQL] Query execution failed:', err);
        throw err;
      }
    }
  }
}

// Background job to refresh token periodically
setInterval(async () => {
  try {
    await refreshTokenAndPoolIfNeeded();
  } catch (err) {
    console.error('Background token refresh failed:', err);
  }
}, TOKEN_REFRESH_INTERVAL_MS);

// Optional: Global error listener for mssql
sql.on('error', err => {
  console.error('[SQL] Global connection error:', err);
});

module.exports = {
  executeQuery,
  getSqlPool: () => connectionPool
};
