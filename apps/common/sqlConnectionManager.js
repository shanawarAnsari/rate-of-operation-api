const sql = require("mssql");
const { DefaultAzureCredential } = require("@azure/identity");
const cacheManager = require("../common/cache/cacheManager");

// Configuration constants
const CONFIG = {
  TOKEN_REFRESH_BUFFER_MS: 10 * 60 * 1000, // 10 minutes
  TOKEN_REFRESH_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  CONNECTION_TIMEOUT_MS: 30000,
  SQL_PORT: 1433,
  RETRY_COUNT: 2,
  INITIAL_DELAY_MS: 500,
  AZURE_DB_SCOPE: "https://database.windows.net/",
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 0,
  IDLE_TIMEOUT_MS: 30000,
  MAX_RETRIES_BEFORE_ALERT: 3,
  QUERY_TIMEOUT_MS: 30000,
  // Add monitoring thresholds
  SLOW_QUERY_THRESHOLD_MS: 1000,
  CONNECTION_ALERT_THRESHOLD: 5,
};

// Custom error factories
const createTokenError = (message) => {
  const error = new Error(message);
  error.name = "TokenError";
  return error;
};

const createConnectionError = (message) => {
  const error = new Error(message);
  error.name = "ConnectionError";
  return error;
};

// Token management - functional approach
const createTokenManager = () => {
  // Private state in closure
  let accessToken = null;
  let tokenExpiry = null;
  let refreshingPromise = null;
  const credential = new DefaultAzureCredential();

  // Return object with methods
  return {
    async fetchToken() {
      try {
        console.log("🔑 Fetching new access token...");
        const tokenResponse = await credential.getToken(CONFIG.AZURE_DB_SCOPE);

        accessToken = tokenResponse.token;
        tokenExpiry = new Date(tokenResponse.expiresOnTimestamp);

        console.log("✅ Access token fetched. Expires at:", tokenExpiry);
        return accessToken;
      } catch (error) {
        console.error("❌ Failed to fetch access token:", error);
        throw createTokenError(`Failed to fetch access token: ${error.message}`);
      }
    },

    isTokenValid() {
      if (!accessToken || !tokenExpiry) {
        return false;
      }

      const now = new Date();
      const expiryWithBuffer = new Date(
        tokenExpiry.getTime() - CONFIG.TOKEN_REFRESH_BUFFER_MS
      );
      return now < expiryWithBuffer;
    },

    isTokenExpired() {
      if (!tokenExpiry) return true;
      return new Date() >= tokenExpiry;
    },

    async refreshIfNeeded() {
      if (this.isTokenValid()) {
        return accessToken;
      }

      if (!refreshingPromise) {
        refreshingPromise = this.fetchToken().finally(() => {
          refreshingPromise = null;
        });
      }

      return await refreshingPromise;
    },

    getTimeUntilExpiry() {
      if (!tokenExpiry) return -1;
      return Math.round((tokenExpiry.getTime() - new Date().getTime()) / 60000);
    },

    reset() {
      accessToken = null;
      tokenExpiry = null;
      refreshingPromise = null;
    },

    async forceRefresh() {
      this.reset();
      return await this.fetchToken();
    },

    // For testing/debugging
    getState() {
      return {
        hasToken: !!accessToken,
        expiresAt: tokenExpiry,
        isRefreshing: !!refreshingPromise,
      };
    },
  };
};

// Connection pool management - functional approach
const createConnectionPoolManager = (tokenManager) => {
  // Private state in closure
  let connectionPool = null;
  let failedConnectionAttempts = 0;
  let lastReconnectTime = null;

  // Return object with methods
  return {
    async createPool() {
      try {
        const { sqlServer, sqlDb } = cacheManager.getCache("key_vault_cache");
        const token = await tokenManager.refreshIfNeeded();

        if (!token || typeof token !== "string") {
          throw createTokenError("Invalid or missing access token");
        }

        const poolConfig = {
          server: sqlServer,
          port: CONFIG.SQL_PORT,
          database: sqlDb,
          options: {
            encrypt: true,
            enableArithAbort: true,
            connectTimeout: CONFIG.CONNECTION_TIMEOUT_MS,
            requestTimeout: CONFIG.QUERY_TIMEOUT_MS,
            maxRetriesOnTransientErrors: 3,
            trustServerCertificate: false,
          },
          pool: {
            max: CONFIG.MAX_POOL_SIZE,
            min: CONFIG.MIN_POOL_SIZE,
            idleTimeoutMillis: CONFIG.IDLE_TIMEOUT_MS,
            acquireTimeoutMillis: CONFIG.CONNECTION_TIMEOUT_MS,
          },
          authentication: {
            type: "azure-active-directory-access-token",
            options: { token },
          },
        };

        console.log("🔌 Creating new SQL connection pool...");
        const newPool = await sql.connect(poolConfig);
        console.log("✅ SQL connection pool created successfully");
        connectionPool = newPool;
        return newPool;
      } catch (error) {
        failedConnectionAttempts++;
        if (failedConnectionAttempts >= CONFIG.CONNECTION_ALERT_THRESHOLD) {
          console.error(
            `⚠️ Critical: Multiple connection failures detected (${failedConnectionAttempts} attempts)`
          );
          // Here you could add alerting mechanism
        }
        console.error("❌ Failed to create connection pool:", error);
        throw createConnectionError(
          `Failed to create connection pool: ${error.message}`
        );
      }
    },

    async closePool() {
      if (connectionPool) {
        try {
          await connectionPool.close();
          console.log("🧹 Connection pool closed");
        } catch (error) {
          console.warn("⚠️ Warning: Failed to close connection pool:", error);
        } finally {
          connectionPool = null;
        }
      }
    },

    async validateConnection() {
      try {
        if (!connectionPool || !connectionPool.connected) {
          return false;
        }

        // Test the connection with a simple query
        const request = connectionPool.request();
        await request.query("SELECT 1 AS TestConnection");
        return true;
      } catch (error) {
        console.warn("⚠️ Connection validation failed:", error.message);
        return false;
      }
    },

    async getPool() {
      // Always validate the existing connection first
      if (connectionPool && !(await this.validateConnection())) {
        console.warn("⚠️ Connection validation failed, closing pool...");
        await this.closePool();
      }

      // Check token validity
      if (tokenManager.isTokenExpired()) {
        console.warn("⚠️ Token expired, refreshing and recreating pool...");
        await this.closePool();
        tokenManager.reset();
      }

      // Ensure we have a valid token
      await tokenManager.refreshIfNeeded();

      // Create or recreate pool if needed
      if (!connectionPool || !connectionPool.connected) {
        console.warn("⚠️ Connection pool not available, creating new one...");
        await this.closePool();
        await this.createPool();
      }

      return connectionPool;
    },

    getCurrentPool() {
      return connectionPool;
    },
  };
};

// Query execution - functional approach
const createQueryExecutor = (poolManager) => {
  const queryMetrics = new Map(); // Track query performance

  const recordQueryMetrics = (sqlText, startTime, success) => {
    const duration = Date.now() - startTime;
    if (duration > CONFIG.SLOW_QUERY_THRESHOLD_MS) {
      console.warn(
        `⚠️ Slow query detected (${duration}ms): ${sqlText.substring(0, 100)}...`
      );
    }

    const metrics = queryMetrics.get(sqlText) || {
      count: 0,
      failures: 0,
      totalTime: 0,
    };
    metrics.count++;
    metrics.totalTime += duration;
    if (!success) metrics.failures++;
    queryMetrics.set(sqlText, metrics);
  };

  const isRecoverableError = (error) => {
    const recoverableCodes = ["ELOGIN", "ECONNCLOSED", "ETIMEOUT", "EREQUEST"];
    const recoverableMessages = [
      "Token is expired",
      "token has expired",
      "Authentication failed",
      "Login failed",
    ];

    return (
      recoverableCodes.includes(error.code) ||
      recoverableMessages.some((msg) => error.message.includes(msg))
    );
  };

  return {
    async executeWithRetry(
      sqlText,
      bindParams = {},
      retryCount = CONFIG.RETRY_COUNT
    ) {
      const startTime = Date.now();
      let success = false;

      let delayMs = CONFIG.INITIAL_DELAY_MS;

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const pool = await poolManager.getPool();
          const request = pool.request();

          // Bind parameters
          Object.entries(bindParams).forEach(([key, value]) => {
            request.input(key, value);
          });

          console.log(
            `[SQL] Executing query (Attempt ${attempt + 1}/${retryCount + 1})`
          );
          const result = await request.query(sqlText);
          success = true;
          return result?.recordset;
        } catch (error) {
          const isLastAttempt = attempt === retryCount;
          const isRecoverable = isRecoverableError(error);

          if (isLastAttempt || !isRecoverable) {
            console.error(
              `[SQL] Query execution failed after ${attempt + 1} attempts:`,
              error
            );
            throw error;
          }

          console.warn(
            `[SQL] Recoverable error (${error.code || "Unknown"}): ${error.message}`
          );
          console.log(
            `[SQL] Retrying in ${delayMs}ms... (${
              retryCount - attempt
            } attempts remaining)`
          );

          // Handle authentication errors
          if (
            error.message.includes("Token is expired") ||
            error.message.includes("Authentication failed")
          ) {
            console.log("🔄 Forcing token refresh due to authentication error...");
            tokenManager.reset();
            await poolManager.closePool();
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
        }
      }
    },

    getQueryMetrics() {
      return Array.from(queryMetrics.entries()).map(([query, metrics]) => ({
        query,
        averageTime: metrics.totalTime / metrics.count,
        failureRate: metrics.failures / metrics.count,
        totalExecutions: metrics.count,
      }));
    },
  };
};

// Module-level state
let backgroundRefreshInterval = null;
const tokenManager = createTokenManager();
const poolManager = createConnectionPoolManager(tokenManager);
const queryExecutor = createQueryExecutor(poolManager);

// Main functionality - exposed as standalone functions
const initialize = async () => {
  try {
    console.log("🚀 Initializing SQL connection manager...");

    // Force a fresh token on startup instead of just refreshing if needed
    await tokenManager.forceRefresh();

    // Create a fresh connection pool for the new session
    await poolManager.closePool();
    await poolManager.getPool();

    startBackgroundRefresh();
    console.log("✅ SQL connection manager initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize SQL connection manager:", error);
    throw error;
  }
};

const startBackgroundRefresh = () => {
  // Clear any existing interval
  if (backgroundRefreshInterval) {
    clearInterval(backgroundRefreshInterval);
  }

  backgroundRefreshInterval = setInterval(async () => {
    try {
      console.log("🕐 Background token refresh check...");
      const timeUntilExpiry = tokenManager.getTimeUntilExpiry();

      if (timeUntilExpiry > 0) {
        console.log(`⏰ Token expires in ${timeUntilExpiry} minutes`);
      }

      await tokenManager.refreshIfNeeded();
    } catch (error) {
      console.error("❌ Background token refresh failed:", error);
      tokenManager.reset();
      await poolManager.closePool();
    }
  }, CONFIG.TOKEN_REFRESH_INTERVAL_MS);
};

const executeQuery = async (
  sqlText,
  bindParams = {},
  retryCount = CONFIG.RETRY_COUNT
) => {
  return await queryExecutor.executeWithRetry(sqlText, bindParams, retryCount);
};

const getSqlPool = () => {
  return poolManager.getCurrentPool();
};

const checkHealth = async () => {
  try {
    const pool = await poolManager.getPool();
    const request = pool.request();
    await request.query("SELECT 1 AS HealthCheck");
    return {
      status: "healthy",
      tokenExpiresIn: tokenManager.getTimeUntilExpiry() + " minutes",
      poolConnected: pool.connected,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      tokenState: tokenManager.isTokenExpired() ? "expired" : "valid",
    };
  }
};

const shutdown = async () => {
  console.log("🛑 Beginning SQL connection manager shutdown...");

  // Clear background refresh interval
  if (backgroundRefreshInterval) {
    clearInterval(backgroundRefreshInterval);
    backgroundRefreshInterval = null;
    console.log("🕐 Background refresh stopped");
  }

  // Close and clear connection pool
  await poolManager.closePool();

  // Reset token state
  tokenManager.reset();

  console.log("🛑 SQL connection manager shut down completely");
  return { status: "shutdown_complete" };
};

const reinitialize = async () => {
  console.log("🔄 Reinitializing SQL connection manager after shutdown...");

  // Force token refresh
  await tokenManager.forceRefresh();

  // Ensure pool is closed before creating a new one
  await poolManager.closePool();

  // Get a fresh pool
  await poolManager.getPool();

  // Restart background refresh
  startBackgroundRefresh();

  console.log("✅ SQL connection manager reinitialized with fresh token and pool");
  return { status: "reinitialized" };
};

// Initialize on module import
initialize().catch((error) => {
  console.error("Failed to initialize SQL manager:", error);
});

// Global error listener for mssql
sql.on("error", (error) => {
  console.error("[SQL] Global connection error:", error);
});

// Export the public API
module.exports = {
  executeQuery,
  getSqlPool,
  checkHealth,
  shutdown,
  reinitialize,
  getConnectionMetrics,
  CONFIG, // Expose configuration for monitoring
};
