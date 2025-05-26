// Define all JOI validation Schemas for requests comming to /auth/generateApiToken endpoint
const Joi = require('joi');

const generateApiTokenReqValidation = Joi.object({
    accessToken: Joi.string().required().label('accessToken'),
    myGroup: Joi.array().items(Joi.string()).required().label('myGroup'),
    myRole: Joi.array().items(Joi.string()).required().label('myRole'),
    myRegion: Joi.array().items(Joi.string()).required().label('myRegion')
})
module.exports = generateApiTokenReqValidation;
