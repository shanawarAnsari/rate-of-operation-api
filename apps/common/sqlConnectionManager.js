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
};

// Custom error types for better error handling
class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "TokenError";
  }
}

class ConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConnectionError";
  }
}

// Token management class
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshingPromise = null;
    this.credential = new DefaultAzureCredential();
  }

  async fetchToken() {
    try {
      console.log("🔑 Fetching new access token...");
      const tokenResponse = await this.credential.getToken(CONFIG.AZURE_DB_SCOPE);

      this.accessToken = tokenResponse.token;
      this.tokenExpiry = new Date(tokenResponse.expiresOnTimestamp);

      console.log("✅ Access token fetched. Expires at:", this.tokenExpiry);
      return this.accessToken;
    } catch (error) {
      console.error("❌ Failed to fetch access token:", error);
      throw new TokenError(`Failed to fetch access token: ${error.message}`);
    }
  }

  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }

    const now = new Date();
    const expiryWithBuffer = new Date(
      this.tokenExpiry.getTime() - CONFIG.TOKEN_REFRESH_BUFFER_MS
    );
    return now < expiryWithBuffer;
  }

  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  async refreshIfNeeded() {
    if (this.isTokenValid()) {
      return this.accessToken;
    }

    if (!this.refreshingPromise) {
      this.refreshingPromise = this.fetchToken().finally(() => {
        this.refreshingPromise = null;
      });
    }

    return await this.refreshingPromise;
  }

  getTimeUntilExpiry() {
    if (!this.tokenExpiry) return -1;
    return Math.round((this.tokenExpiry.getTime() - new Date().getTime()) / 60000);
  }

  reset() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshingPromise = null;
  }
}

// Connection pool management class
class ConnectionPoolManager {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
    this.connectionPool = null;
  }

  async createPool() {
    try {
      const { sqlServer, sqlDb } = cacheManager.getCache("key_vault_cache");
      const token = await this.tokenManager.refreshIfNeeded();

      if (!token || typeof token !== "string") {
        throw new TokenError("Invalid or missing access token");
      }

      const poolConfig = {
        server: sqlServer,
        port: CONFIG.SQL_PORT,
        database: sqlDb,
        options: {
          encrypt: true,
          enableArithAbort: true,
          connectTimeout: CONFIG.CONNECTION_TIMEOUT_MS,
        },
        authentication: {
          type: "azure-active-directory-access-token",
          options: { token },
        },
      };

      console.log("🔌 Creating new SQL connection pool...");
      const newPool = await sql.connect(poolConfig);
      console.log("✅ SQL connection pool created successfully");
      return newPool;
    } catch (error) {
      console.error("❌ Failed to create connection pool:", error);
      throw new ConnectionError(
        `Failed to create connection pool: ${error.message}`
      );
    }
  }

  async closePool() {
    if (this.connectionPool) {
      try {
        await this.connectionPool.close();
        console.log("🧹 Connection pool closed");
      } catch (error) {
        console.warn("⚠️ Warning: Failed to close connection pool:", error);
      } finally {
        this.connectionPool = null;
      }
    }
  }

  async getPool() {
    // Check token validity first
    if (this.tokenManager.isTokenExpired()) {
      console.warn("⚠️ Token expired, refreshing and recreating pool...");
      await this.closePool();
      this.tokenManager.reset();
    }

    // Ensure we have a valid token
    await this.tokenManager.refreshIfNeeded();

    // Create or recreate pool if needed
    if (!this.connectionPool || !this.connectionPool.connected) {
      console.warn("⚠️ Connection pool not available, creating new one...");
      await this.closePool();
      this.connectionPool = await this.createPool();
    }

    return this.connectionPool;
  }
}

// Query execution class
class QueryExecutor {
  constructor(poolManager) {
    this.poolManager = poolManager;
  }

  isRecoverableError(error) {
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
  }

  async executeWithRetry(sqlText, bindParams = {}, retryCount = CONFIG.RETRY_COUNT) {
    let delayMs = CONFIG.INITIAL_DELAY_MS;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const pool = await this.poolManager.getPool();
        const request = pool.request();

        // Bind parameters
        Object.entries(bindParams).forEach(([key, value]) => {
          request.input(key, value);
        });

        console.log(
          `[SQL] Executing query (Attempt ${attempt + 1}/${retryCount + 1})`
        );
        const result = await request.query(sqlText);
        return result?.recordset;
      } catch (error) {
        const isLastAttempt = attempt === retryCount;
        const isRecoverable = this.isRecoverableError(error);

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
          this.poolManager.tokenManager.reset();
          await this.poolManager.closePool();
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }
}

// Main SQL Manager class
class SqlConnectionManager {
  constructor() {
    this.tokenManager = new TokenManager();
    this.poolManager = new ConnectionPoolManager(this.tokenManager);
    this.queryExecutor = new QueryExecutor(this.poolManager);
    this.backgroundRefreshInterval = null;
  }

  async initialize() {
    try {
      console.log("🚀 Initializing SQL connection manager...");
      await this.tokenManager.refreshIfNeeded();
      this.startBackgroundRefresh();
      console.log("✅ SQL connection manager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize SQL connection manager:", error);
      throw error;
    }
  }

  startBackgroundRefresh() {
    this.backgroundRefreshInterval = setInterval(async () => {
      try {
        console.log("🕐 Background token refresh check...");
        const timeUntilExpiry = this.tokenManager.getTimeUntilExpiry();

        if (timeUntilExpiry > 0) {
          console.log(`⏰ Token expires in ${timeUntilExpiry} minutes`);
        }

        await this.tokenManager.refreshIfNeeded();
      } catch (error) {
        console.error("❌ Background token refresh failed:", error);
        this.tokenManager.reset();
        await this.poolManager.closePool();
      }
    }, CONFIG.TOKEN_REFRESH_INTERVAL_MS);
  }

  async executeQuery(sqlText, bindParams = {}, retryCount = CONFIG.RETRY_COUNT) {
    return await this.queryExecutor.executeWithRetry(
      sqlText,
      bindParams,
      retryCount
    );
  }

  getSqlPool() {
    return this.poolManager.connectionPool;
  }

  async shutdown() {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
    }
    await this.poolManager.closePool();
    this.tokenManager.reset();
    console.log("🛑 SQL connection manager shut down");
  }
}

// Create singleton instance
const sqlManager = new SqlConnectionManager();

// Initialize on startup
sqlManager.initialize().catch((error) => {
  console.error("Failed to initialize SQL manager:", error);
});

// Global error listener for mssql
sql.on("error", (error) => {
  console.error("[SQL] Global connection error:", error);
});

module.exports = {
  executeQuery: (sqlText, bindParams, retryCount) =>
    sqlManager.executeQuery(sqlText, bindParams, retryCount),
  getSqlPool: () => sqlManager.getSqlPool(),
};
