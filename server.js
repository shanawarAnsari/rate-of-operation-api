const express = require("express");
const rate_of_operations_app = require("./apps/production-rates/rate-of-operations/rate-of-operations-app");
const getKeyVaultSecrets = require("./apps/common/keyVaultManager");
const cacheManager = require("./apps/common/cache/cacheManager");
const app = express();
const user_management_app = require("./apps/production-rates/user-management/index");
async function startApp() {
  // if (!cacheManager.getCache('key_vault_cache')) {
  //     const keyVaultSecrets = await getKeyVaultSecrets();
  //     cacheManager.setCache('key_vault_cache', keyVaultSecrets);
  // }
  //const { port } = cacheManager.getCache('key_vault_cache');
  const port = 8080;
  app.use(rate_of_operations_app);
  app.use(user_management_app);
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}
startApp();
