const jwt = require('jsonwebtoken');
const cacheManager = require('../cache/cacheManager');
const getKeyVaultSecrets = require('../keyVaultManager')

async function verifyJwtToken(req, res, next) {
  if (!cacheManager.getCache("key_vault_cache")) {
    const keyVaultSecrets = await getKeyVaultSecrets();
    cacheManager.setCache("key_vault_cache", keyVaultSecrets);
  }
  const { secretKey } = cacheManager.getCache('key_vault_cache');
  const apiToken = req.headers?.authorization?.split('Bearer ')[1];
  if (!apiToken) {
    return res.status(401).json({ error: 'jwt token missing' })
  }
  jwt.verify(apiToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: `Unauthorized -${err.message}` })
    }
    req.apiTokenClaims = decoded;
    next();
  })
}
module.exports = verifyJwtToken;