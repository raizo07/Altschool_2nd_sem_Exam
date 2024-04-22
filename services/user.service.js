const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const ErrorWithStatus = require("../middlewears/ErrorWithStatus");
const argon2 = require("argon2");
const {
	checkFields,
	generateAccessToken,
	generateRefreshToken,
} = require("../utils.js");

const registerUserService = async (body) => {
	const { email, password, first_name, last_name } = body;

	checkFields([
		{ field: first_name, name: "first_name" },
		{ field: last_name, name: "last_name" },
		{ field: email, name: "email" },
		{ field: password, name: "password" },
	]);

	const userExists = await User.findOne({ email: email });

	if (userExists)
		throw new ErrorWithStatus(
			"User with email already exists",
			StatusCodes.BAD_REQUEST
		);

	if (password.length <= 8)
		throw new ErrorWithStatus(
			"Password too short",
			StatusCodes.BAD_REQUEST
		);

	const hashedPassword = await argon2.hash(password);

	return await User.create({
		email,
		password: hashedPassword,
		first_name,
		last_name,
	});
};

const loginUserService = async ({ email, password }) => {
	checkFields([
		{
			field: email,
			name: "email",
		},
		{
			field: password,
			name: "password",
		},
	]);

	const user = await User.findOne({ email: email });

	if (!user)
		throw new ErrorWithStatus("User not found", StatusCodes.NOT_FOUND);

	if (!(await argon2.verify(user.password, password)))
		throw new ErrorWithStatus(
			"Incorrect password",
			StatusCodes.UNAUTHORIZED
		);

	return {
		accessToken: generateAccessToken({ id: user._id, email: user.email }),
		refreshToken: generateRefreshToken({ id: user._id, email: user.email }),
		user: {
			id: user._id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
		},
	};
};

module.exports = {
	registerUserService,
	loginUserService,
};
