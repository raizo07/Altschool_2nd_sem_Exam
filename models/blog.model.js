const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			unique: true,
		},
		description: {
			type: String,
			required: false,
		},
		state: {
			type: String,
			enum: ["PUBLISHED", "DRAFT"],
			default: "DRAFT",
		},
		read_count: {
			type: Number,
			default: 0,
		},
		reading_time: {
			type: Number,
			default: 0,
		},
		body: {
			type: String,
			required: true,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		tags: [
			{
				type: String,
			},
		],
	},
	{ timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
