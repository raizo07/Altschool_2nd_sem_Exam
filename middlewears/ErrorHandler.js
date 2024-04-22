const ErrorWithStatus = require("./ErrorWithStatus");
const logger = require("./Logger");

const ErrorHandler = (err, req, res, next) => {
	if (err instanceof ErrorWithStatus) {
		logger.warn(err.message, { error: err });
		return res.status(err.code).json({
			message: err.message,
			status: err.code,
		});
	} else {
		logger.error(err.message, { error: err });
		return res.status(500).json({
			message: err.message,
			status: 500,
		});
	}
};

module.exports = ErrorHandler;
