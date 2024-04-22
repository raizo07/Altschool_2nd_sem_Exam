const mongoose = require("mongoose");

mongoose.set("toJSON", {
	virtuals: true,
	transform: (doc, converted) => {
		delete converted._id;
	},
});

const connectDB = async (url) => {
	if (!url) {
		console.log("Database URI missing.");
		return;
	}
	try {
		await mongoose.connect(url, {});
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
	const dbConnection = mongoose.connection;
	dbConnection.once("open", (_) => {
		console.log(`Database connected: ${url}`);
	});

	dbConnection.on("error", (err) => {
		console.error(`connection error: ${err}`);
	});

	return dbConnection;
};

module.exports = connectDB;
