const { StatusCodes } = require("http-status-codes");
const {
	createBlogService,
	getBlogsService,
	getBlogService,
	deleteBlogService,
	getUserBlogService,
	updateBlogService,
} = require("../services/blog.service");

const createBlog = async (req, res) => {
	const newBlog = await createBlogService({ user: req.user, data: req.body });
	return res.status(StatusCodes.CREATED).json({
		message: "success",
		data: newBlog,
	});
};

const getUserBlog = async (req, res) => {
	const { limit = 20, page = 1, state } = req.query;

	const blogs = await getUserBlogService(req.user.id, { limit, page, state });
	return res.status(StatusCodes.OK).json({
		message: "success",
		data: blogs,
	});
};
const getBlog = async (req, res) => {
	const { id } = req.params;
	const blog = await getBlogService({ id, user: req.user });

	return res.status(StatusCodes.OK).json({
		message: "success",
		data: blog,
	});
};

const getBlogs = async (req, res) => {
	const { limit, page, author, title, tags, orderBy, orderDirection } =
		req.query;
	const blogs = await getBlogsService({
		limit,
		page,
		query: { author, title, tags, orderBy, orderDirection },
	});
	return res.status(StatusCodes.OK).json({
		message: "success",
		data: blogs,
	});
};

const updateBlog = async (req, res) => {
	const { id } = req.params;
	const blog = await updateBlogService({
		id,
		data: req.body,
		user_id: req.user.id,
	});

	return res.status(StatusCodes.OK).json({
		message: "success",
		data: blog,
	});
};

const deleteBlog = async (req, res) => {
	const { id } = req.params;
	await deleteBlogService({ id, user_id: req.user.id });
	return res.status(StatusCodes.NO_CONTENT).json({
		message: "success",
	});
};

module.exports = {
	getBlog,
	getBlogs,
	updateBlog,
	deleteBlog,
	createBlog,
	getUserBlog,
};
