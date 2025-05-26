const jwt = require('jsonwebtoken');
const cacheManager = require('../cache/cacheManager');
const generateApiTokenReqValidation = require('./validations/request-validations')
const validateSchema = require('./validations/validateSchema');
const getKeyVaultSecrets = require('../keyVaultManager');

const tokenController = {
  tokenGenerator: async (req, res) => {
    try {
      if (!cacheManager.getCache('key_vault_cache')) {
        const keyVaultSecrets = await getKeyVaultSecrets();
        cacheManager.setCache("key_vault_cache", keyVaultSecrets);
      }
      const { accessToken, myGroup, myRegion, myRole } = req.body;
      const { secretKey } = cacheManager.getCache('key_vault_cache');
      validateSchema(generateApiTokenReqValidation,
        'Generate Api Token Request Validation',
        { accessToken, myGroup, myRegion, myRole });

      const apiToken = jwt.sign(
        {
          accessToken: accessToken,
          roles: myRole,
          regions: myRegion,
          groups: myGroup,
          iat: Math.floor(Date.now() / 1000), //current time in seconds         
          exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from iat 
        },
        secretKey
      );
      res.status(200).json({
        jwtApiToken: apiToken
      });
    } catch (err) {
      res.status(401).send({ error: `Unauthorized : ${err.message}` });
    }
  },
};
module.exports = tokenController;
