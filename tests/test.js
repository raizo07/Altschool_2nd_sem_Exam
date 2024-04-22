const request = require("supertest");
const app = require("..");
const { StatusCodes } = require("http-status-codes");
const connectDB = require("../connectDb");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const basicUserData = {
	first_name: "john",
	last_name: "doe",
	email: "randomemail@gmail.com",
	password: "testUser1234",
	post: {},
};

const basicUserData2 = {
	first_name: "mark",
	last_name: "doe",
	email: "randomemailmark@gmail.com",
	password: "testUser1000",
	post: {},
};

const fake_id = "6620c936502134b2bce0bbb1";
describe("Auth Tests", () => {
	let mongoServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	let blog1_id;
	let blog2_id;

	describe("Register tests", () => {
		it("should return error - missing fields", async () => {
			return request(app)
				.post("/auth/register")
				.send({})
				.expect(StatusCodes.BAD_REQUEST)
				.then((res) => {
					expect(res.body).toHaveProperty("status");
					expect(res.body.status).toBe(StatusCodes.BAD_REQUEST);
					expect(res.body.message).toBe(
						"Required fields, first_name, last_name, email, password"
					);
				});
		});

		it("should return error - invalid password", () => {
			return request(app)
				.post("/auth/register")
				.send({
					...basicUserData,
					password: "test",
				})
				.expect(StatusCodes.BAD_REQUEST)
				.then((res) => {
					expect(res.body).toHaveProperty("status");
					expect(res.body.status).toBe(StatusCodes.BAD_REQUEST);
					expect(res.body.message).toBe("Password too short");
				});
		});

		it("should successfully register user", () => {
			return request(app)
				.post("/auth/register")
				.send(basicUserData)
				.expect(StatusCodes.CREATED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("data");
					expect(res.body.message).toBe("success");
					expect(res.body.data).toHaveProperty("id");
				});
		});

		it("should successfully register user", () => {
			return request(app)
				.post("/auth/register")
				.send(basicUserData2)
				.expect(StatusCodes.CREATED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("data");
					expect(res.body.message).toBe("success");
					expect(res.body.data).toHaveProperty("id");
				});
		});
	});

	describe("Login tests", () => {
		it("should return error - missing login fields", () => {
			return request(app)
				.post("/auth/login")
				.send({})
				.expect(StatusCodes.BAD_REQUEST)
				.then((res) => {
					expect(res.body).toHaveProperty("status");
					expect(res.body.status).toBe(StatusCodes.BAD_REQUEST);
					expect(res.body.message).toBe(
						"Required fields, email, password"
					);
				});
		});

		it("should return error - invalid password", () => {
			return request(app)
				.post("/auth/login")
				.send({ email: basicUserData.email, password: "ooo" })
				.expect(StatusCodes.UNAUTHORIZED)
				.then((res) => {
					expect(res.body).toHaveProperty("status");
					expect(res.body.status).toBe(StatusCodes.UNAUTHORIZED);
					expect(res.body.message).toBe("Incorrect password");
				});
		});

		it("should login user", () => {
			return request(app)
				.post("/auth/login")
				.send({
					email: basicUserData.email,
					password: basicUserData.password,
				})
				.expect(StatusCodes.OK)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body.data).toHaveProperty("accessToken");
					expect(res.body.data).toHaveProperty("refreshToken");
					expect(res.body.data).toHaveProperty("user");
					expect(res.body.data.user).toHaveProperty("id");
					expect(res.body.data.user.email).toBe(basicUserData.email);
					expect(res.body.data.user.password).toBe(undefined);
					basicUserData["TOKEN"] = res.body.data.accessToken;
				});
		});

		it("should login user", () => {
			return request(app)
				.post("/auth/login")
				.send({
					email: basicUserData2.email,
					password: basicUserData2.password,
				})
				.expect(StatusCodes.OK)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body.data).toHaveProperty("accessToken");
					expect(res.body.data).toHaveProperty("refreshToken");
					expect(res.body.data).toHaveProperty("user");
					expect(res.body.data.user).toHaveProperty("id");
					expect(res.body.data.user.email).toBe(basicUserData2.email);
					expect(res.body.data.user.password).toBe(undefined);
					basicUserData2["TOKEN"] = res.body.data.accessToken;
				});
		});
	});

	describe("POST blogs", () => {
		it("should throw error - unauthenticated", () => {
			return request(app)
				.post("/blog")
				.send({})
				.expect(StatusCodes.UNAUTHORIZED);
		});

		it("should throw error - missing fields", () => {
			return request(app)
				.post("/blog")
				.set("Authorization", `Bearer ${basicUserData.TOKEN}`)
				.send({})
				.expect(StatusCodes.BAD_REQUEST);
		});

		it("should successfully create blog", () => {
			return request(app)
				.post("/blog")
				.set("Authorization", `Bearer ${basicUserData.TOKEN}`)
				.send({
					title: "test",
					description: "test",
					body: "test",
				})
				.expect(StatusCodes.CREATED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("data");
					expect(res.body.message).toBe("success");
					expect(res.body.data).toHaveProperty("id");
					expect(res.body.data).toHaveProperty("state");
					expect(res.body.data.state).toBe("DRAFT");
					blog1_id = res.body.data.id;
				});
		});

		it("should throw error - title is already being used", () => {
			return request(app)
				.post("/blog")
				.set("Authorization", `Bearer ${basicUserData.TOKEN}`)
				.send({
					title: "test",
					description: "test",
					body: "test",
				})
				.expect(StatusCodes.BAD_REQUEST)
				.then((res) => {
					expect(res.body.message).toBe(
						"Post with that title already exists."
					);
				});
		});

		it("should successfully create blog", () => {
			return request(app)
				.post("/blog")
				.set("Authorization", `Bearer ${basicUserData2.TOKEN}`)
				.send({
					title: "test123",
					description: "test",
					body: "test",
				})
				.expect(StatusCodes.CREATED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("data");
					expect(res.body.message).toBe("success");
					expect(res.body.data).toHaveProperty("id");
					expect(res.body.data).toHaveProperty("state");
					expect(res.body.data.state).toBe("DRAFT");
					blog2_id = res.body.data.id;
				});
		});
	});

	describe("UPDATE blog", () => {
		it("should throw an error - unauthenticated", async () => {
			return await request(app)
				.patch(`/blog/${blog1_id}`)
				.set("Content-Type", "application/json")
				.send({})
				.expect(StatusCodes.UNAUTHORIZED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("status");
					expect(res.body.message).toBe("Unauthorized");
					expect(res.body.status).toBe(StatusCodes.UNAUTHORIZED);
				});
		});

		it("should throw an error - user updating another user's blog", async () => {
			return await request(app)
				.patch(`/blog/${blog1_id}`)
				.set("Content-Type", "application/json")
				.set("Authorization", "Bearer " + basicUserData2.TOKEN)
				.send({})
				.expect(StatusCodes.UNAUTHORIZED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("status");
					expect(res.body.message).toBe(
						"You do not have permission to modify this blog."
					);
					expect(res.body.status).toBe(StatusCodes.UNAUTHORIZED);
				});
		});

		it("should successfully update blog", async () => {
			return await request(app)
				.patch(`/blog/${blog2_id}`)
				.set("Content-Type", "application/json")
				.set("Authorization", "Bearer " + basicUserData2.TOKEN)
				.send({ state: "PUBLISHED" })
				.expect(StatusCodes.OK)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body.message).toBe("success");
					expect(res.body.data).toHaveProperty("state");
					expect(res.body.data.state).toBe("PUBLISHED");
				});
		});
	});
	describe("GET blogs", () => {
		it("should return all blogs", async () => {
			return await request(app)
				.get(`/blog`)
				.set("Accept", "application/json")
				.expect("Content-Type", /json/)
				.expect(StatusCodes.OK)
				.then((res) => {
					expect(res.body.message).toBe("success");
					expect(res.body.data[0]).toHaveProperty("state");
					expect(res.body.data[0].state).toBe("PUBLISHED");
				});
		});
	});

	describe("GET blog", () => {
		it("should return an error - invalid id", async () => {
			return await request(app)
				.get(`/blog/${fake_id}`)
				.set("Accept", "application/json")
				.expect("Content-Type", /json/)
				.expect(StatusCodes.NOT_FOUND)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("status");
					expect(res.body.message).toBe("Blog not found");
					expect(res.body.status).toBe(StatusCodes.NOT_FOUND);
				});
		});

		it("should return a blog - with draft state", async () => {
			return await request(app)
				.get(`/blog/${blog1_id}`)
				.set("Accept", "application/json")
				.set("Authorization", "Bearer " + basicUserData.TOKEN)
				.expect("Content-Type", /json/)
				.expect(StatusCodes.OK)
				.then((res) => {
					expect(res.body.message).toBe("success");
					expect(res.body.data).toHaveProperty("id");
					expect(res.body.data).toHaveProperty("state");
					expect(res.body.data.state).toBe("DRAFT");
				});
		});

		it("should return an error - since blog is in draft state", async () => {
			return await request(app)
				.get(`/blog/${blog1_id}`)
				.set("Accept", "application/json")
				.set("Authorization", "Bearer " + basicUserData2.TOKEN)
				.expect("Content-Type", /json/)
				.expect(StatusCodes.UNAUTHORIZED)
				.then((res) => {
					expect(res.body).toHaveProperty("message");
					expect(res.body).toHaveProperty("status");
					expect(res.body.status).toBe(StatusCodes.UNAUTHORIZED);
					expect(res.body.message).toBe(
						"You do not have permission to view this blog."
					);
				});
		});
	});

	describe("/me", () => {
		it("should return user blogs with default limit and page", async () => {
			const response = await request(app)
				.get("/blog/me")
				.set("Authorization", `Bearer ${basicUserData.TOKEN}`);

			expect(response.status).toBe(StatusCodes.OK);
			expect(response.body.message).toBe("success");
			expect(response.body.data).toBeDefined();
		});
	});
});

module.exports = {
	basicUserData,
};
