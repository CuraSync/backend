const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./config/database");

const authController = require("./controllers/auth");
const protectedController = require("./controllers/protected");
const authenticateToken = require("./middleware/authenticateToken");

const doctorController = require("./controllers/doctor");

const app = express();
app.use(express.json());
app.use(cookieParser());
// app.use(cors({ origin: "https://curasync.org", credentials: true })); // Only allow frontend to access it

// Connect to the database
connectDB();

// Authentication routes
app.post("/login", authController.login);
app.post("/refresh", authController.refresh);
app.post("/logout", authController.logout);
app.post("/logout/all", authenticateToken, authController.logoutAll);

// Protected route
app.get("/protected", authenticateToken, protectedController.protectedRoute);

app.listen(5000, () => console.log("Server running on port 5000"));

// Doctor routes
app.post("/doctor/register", doctorController.doctorRegister);

// Tests Area
const jwtTets = require("./test/jwtTests");
app.get("/test/refresh-tokens", jwtTets.jwtRTokens);
