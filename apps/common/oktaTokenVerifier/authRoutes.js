const express = require("express");
const router = express.Router();
const tokenController = require('./tokenController.js');

router.post('/generateApiToken', tokenController.tokenGenerator);

module.exports = router;
