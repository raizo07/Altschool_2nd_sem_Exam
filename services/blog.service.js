const { StatusCodes } = require("http-status-codes");
const ErrorWithStatus = require("../middlewears/ErrorWithStatus");
const Blog = require("../models/blog.model");
const { checkFields, AVERAGE_WORDS_PER_MINUTE } = require("../utils");
const winston = require("winston");

orderByList = ["read_count", "reading_time", "updatedat", "createdat"];

const getUserBlogService = async (user_id, query) => {
	const { limit = 20, page = 1, state } = query;
	if (
		state &&
		!(
			state.toUpperCase() === "PUBLISHED" ||
			state.toUpperCase() === "DRAFT"
		)
	)
		throw new ErrorWithStatus(
			"State must be either PUBLISHED or DRAFT.",
			StatusCodes.BAD_REQUEST
		);
	const baseQuery = { author: user_id };
	if (state) baseQuery["state"] = state.toUpperCase();

	const blogs = await Blog.find(baseQuery)
		.limit(limit)
		.skip((page - 1) * limit)
		.populate("author", "id first_name last_name email");

	return blogs;
};

const getBlogService = async ({ id, user }) => {
	const blog = await Blog.findById(id);

	if (!blog)
		throw new ErrorWithStatus("Blog not found", StatusCodes.NOT_FOUND);

	if (blog.state === "DRAFT") {
		if (!user)
			throw new ErrorWithStatus(
				"You do not have permission to view this blog.",
				StatusCodes.UNAUTHORIZED
			);
		if (blog.author.toString() !== user.id)
			throw new ErrorWithStatus(
				"You do not have permission to view this blog.",
				StatusCodes.UNAUTHORIZED
			);
	}

	return await Blog.findByIdAndUpdate(id, {
		read_count: blog.read_count + 1,
	}).populate("author", "id first_name last_name email");
};

const getBlogsService = async ({ limit = 20, page = 1, query }) => {
	const { author, title, tags, orderBy, orderDirection } = query;
	let baseQuery = {};
	let sortCriteria = {};

	if (author) baseQuery.author = author;
	if (title) baseQuery.title = { $regex: title, $options: "i" };
	if (tags) baseQuery.tags = { $in: tags };

	if (orderBy && !orderByList.includes(orderBy.toLowerCase()))
		throw new ErrorWithStatus(
			"orderBy field is invalid",
			StatusCodes.BAD_REQUEST
		);

	if (orderBy) {
		sortCriteria[orderBy] = orderDirection === "asc" ? 1 : -1;
	}

	try {
		const blog = await Blog.find({ ...baseQuery, state: "PUBLISHED" })
			.sort(sortCriteria)
			.limit(limit)
			.skip((page - 1) * limit)
			.populate("author", "id first_name last_name email");
		return blog;
	} catch (error) {
		throw new ErrorWithStatus(
			error.message,
			StatusCodes.INTERNAL_SERVER_ERROR
		);
	}
};

const createBlogService = async ({ user, data }) => {
	const { title, description, body, tags } = data;

	checkFields([
		{ field: title, name: "title" },
		{ field: body, name: "body" },
		{ field: description, name: "description" },
	]);

	const read_time = Math.ceil(body.length / AVERAGE_WORDS_PER_MINUTE);

	if (tags && !(tags instanceof Array))
		throw new ErrorWithStatus(
			"Tags should be an array of strings",
			StatusCodes.BAD_REQUEST
		);

	if (tags) {
		tags.forEach((tag) => {
			if (typeof tag !== "string") {
				throw new ErrorWithStatus(
					"Tags must be an array of strings.",
					StatusCodes.BAD_REQUEST
				);
			}
		});
	}

	try {
		const blog = await Blog.create({
			title,
			description,
			body,
			tags,
			author: user.id,
			reading_time: read_time,
			read_count: 0,
			state: "DRAFT",
		});

		return await Blog.findOne({ _id: blog._id }).populate(
			"User",
			"id first_name last_name email"
		);
	} catch (error) {
		if (error.message.includes("E11000"))
			throw new ErrorWithStatus(
				"Post with that title already exists.",
				StatusCodes.BAD_REQUEST
			);
		throw new ErrorWithStatus(
			error.message,
			StatusCodes.INTERNAL_SERVER_ERROR
		);
	}
};

const updateBlogService = async ({ id, data, user_id }) => {
	const blog = await Blog.findById(id);
	const { title, description, body, tags, state } = data;

	if (!blog)
		throw new ErrorWithStatus("Blog not found", StatusCodes.NOT_FOUND);

	if (blog.author.toString() !== user_id)
		throw new ErrorWithStatus(
			"You do not have permission to modify this blog.",
			StatusCodes.UNAUTHORIZED
		);

	if (
		state &&
		!(
			state.toLowerCase() === "published" ||
			state.toLowerCase() === "draft"
		)
	)
		throw new ErrorWithStatus(
			"Invalid state provided",
			StatusCodes.BAD_REQUEST
		);

	if (tags && !(tags instanceof Array))
		throw new ErrorWithStatus(
			"Tags should be an array of strings",
			StatusCodes.BAD_REQUEST
		);

	if (tags) {
		tags.forEach((tag) => {
			if (typeof tag !== "string") {
				throw new ErrorWithStatus(
					"Tags must be an array of strings.",
					StatusCodes.BAD_REQUEST
				);
			}
		});
	}

	const updatedBlog = await Blog.findByIdAndUpdate(
		id,
		{
			title: title && title,
			description: description && description,
			body: body && body,
			tags: tags && tags,
			reading_time:
				body && Math.ceil(body.length / AVERAGE_WORDS_PER_MINUTE),
			state: state && state.toUpperCase(),
		},
		{ new: true }
	);

	return updatedBlog;
};

const deleteBlogService = async ({ id, user_id }) => {
	const blog = await Blog.findOne({ _id: id });

	if (!blog)
		throw new ErrorWithStatus("Blog not found", StatusCodes.NOT_FOUND);

	if (blog.author._id.toString() !== user_id)
		throw new ErrorWithStatus(
			"You do not have permission to delete this blog.",
			StatusCodes.UNAUTHORIZED
		);

	try {
		return await Blog.findByIdAndDelete(id);
	} catch (error) {
		throw new ErrorWithStatus(
			error.message,
			StatusCodes.INTERNAL_SERVER_ERROR
		);
	}
};

module.exports = {
	getBlogService,
	getBlogsService,
	createBlogService,
	updateBlogService,
	deleteBlogService,
	getUserBlogService,
};
