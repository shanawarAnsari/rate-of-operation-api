const validateSchema = (schemaName, validationSource, objectToBeValidated) => {
  let { error } = schemaName.validate(objectToBeValidated)
  if (error) {
    error.validationSource = validationSource;
    throw error;
  }
  else {
    return true;
  }
}
module.exports = validateSchema;