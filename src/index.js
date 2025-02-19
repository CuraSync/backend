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
const patientController = require("./controllers/patient");
const pharmacyController = require("./controllers/pharmacy");
const laboratoryController = require("./controllers/laboratory");

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
app.post("/doctor/register",
  doctorController.doctorRegister);

app.post(
  "/doctor/profile",
  authenticateToken,
  doctorController.doctorProfileUpdate
);
app.get(
  "/doctor/profile",
  authenticateToken,
  doctorController.getDoctorProfile
);

//Patient routes
app.post(
  "/patient/register",
  patientController.patientRegister);
  
app.post(
  "/patient/profile",
  authenticateToken,
  patientController.patientProfileUpdate
);

app.get(
  "/patient/profile",
  authenticateToken,
  patientController.getPatientProfile
);

// Pharmacy routes
app.post("/pharmacy/register",
  pharmacyController.pharmacyRegister
);

app.post(
  "/pharmacy/profile",
  authenticateToken,
  pharmacyController.pharmacyProfileUpdate
);  

app.get(
  "/pharmacy/profile",
  authenticateToken,
  pharmacyController.getPharmacyProfile
); 


// Laboratory routes
app.post("/laboratory/register",
  laboratoryController.laboratoryRegister
);

app.post(
  "/laboratory/profile",
  authenticateToken,
  laboratoryController.laboratoryProfileUpdate
);

// Tests Area
const jwtTets = require("./test/jwtTests");
app.get("/test/refresh-tokens", jwtTets.jwtRTokens);
