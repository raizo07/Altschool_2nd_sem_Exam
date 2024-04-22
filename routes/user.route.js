const express = require("express");
const { loginUser, registerUser } = require("../controllers/user.controller");
const Wrapper = require("../middlewears/Wrapper");
const IsAuthenticated = require("../middlewears/IsAuthenticated");
const User = require("../models/user.model");
const Router = express.Router();

Router.route("/login").post(Wrapper(loginUser));
Router.route("/register").post(Wrapper(registerUser));

module.exports = Router;
