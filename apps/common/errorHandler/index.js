function errorHandler(err, req, res, next) {
  if (err.isJoi) {
    let errorDefinition = {
      type: "ValidationError",
      status: 400,
      details: err?.details.map((detail) => detail.message),
      source: err?.validationSource,
      instance: req?.originalUrl,
    };

    res.status(400).json({ error: errorDefinition });
  } else {
    let statusCode = err.code > 999 ? 500 : err.code;
    let errorDefinition = {
      type: err?.data?.type,
      title: err?.name,
      status: err?.code ? err.code : 500,
      detail: err?.message,
      instance: req?.originalUrl,
    };

    res
      .status(parseInt(statusCode < 999 ? statusCode : 500))
      .json({ error: errorDefinition });
  }
}
module.exports = errorHandler;
