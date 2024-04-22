const ErrorWithStatus = require("../middlewears/ErrorWithStatus");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model.js");
const argon2 = require("argon2");
const {
	registerUserService,
	loginUserService,
} = require("../services/user.service.js");

const registerUser = async (req, res) => {
	const newUser = await registerUserService(req.body);

	return res.status(StatusCodes.CREATED).json({
		message: "success",
		data: {
			id: newUser._id,
			first_name: newUser.first_name,
			last_name: newUser.last_name,
			email: newUser.email,
		},
	});
};

const loginUser = async (req, res) => {
	const { email, password } = req.body;
	console.log(req.body);
	const user = await loginUserService({ email, password });
	return res.status(StatusCodes.OK).json({ message: "success", data: user });
};

module.exports = {
	loginUser,
	registerUser,
};
