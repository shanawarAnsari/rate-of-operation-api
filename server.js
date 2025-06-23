const express = require("express");

const app = express();
const wrench_time_app = require("./apps/production-rates/wrench-time/wrench-time-app");
async function startApp() {
  // if (!cacheManager.getCache('key_vault_cache')) {
  //     const keyVaultSecrets = await getKeyVaultSecrets();
  //     cacheManager.setCache('key_vault_cache', keyVaultSecrets);
  // }
  //const { port } = cacheManager.getCache('key_vault_cache');
  const port = 8080;
  app.use(wrench_time_app);
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}
startApp();
