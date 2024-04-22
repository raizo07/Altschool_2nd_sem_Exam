const { StatusCodes } = require("http-status-codes");
const ErrorWithStatus = require("./ErrorWithStatus");
const jwt = require("jsonwebtoken");

const IsAuthenticated = async (req, res, next) => {
	const { authorization: accessToken } = req.headers;

	if (!accessToken || !accessToken.startsWith("Bearer ")) {
		return next(
			new ErrorWithStatus("Unauthorized", StatusCodes.UNAUTHORIZED)
		);
	}

	const token = accessToken.split(" ")[1];

	if (!token)
		return next(
			new ErrorWithStatus("Unauthorized", StatusCodes.UNAUTHORIZED)
		);

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: decoded.id, email: decoded.email };
		return next();
	} catch (error) {
		next(
			new ErrorWithStatus(
				"Invalid token provided.",
				StatusCodes.UNAUTHORIZED
			)
		);
	}
};

module.exports = IsAuthenticated;
