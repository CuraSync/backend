const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const http = require("http");

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

const server = http.createServer(app);
// app.use(cors({ origin: "https://curasync.org", credentials: true })); // Only allow frontend to access it

// Connect to the database
connectDB();

// **WebSockets Initialization**
const { initializeWebSocket } = require("./config/webSocket");
initializeWebSocket(server);

// Authentication routes
app.post("/login", authController.login);
app.post("/refresh", authController.refresh);
app.post("/logout", authController.logout);
app.post("/logout/all", authenticateToken, authController.logoutAll);

// Protected route
app.get("/protected", authenticateToken, protectedController.protectedRoute);

server.listen(5000, () => console.log("Server running on port 5000"));

// Doctor routes
app.post("/doctor/register", doctorController.doctorRegister);

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

app.get(
  "/doctor/home",
  authenticateToken,
  doctorController.getDoctorHomepageData
);

app.post("/patient", authenticateToken, doctorController.addPatient);

app.get("/doctor/patient", authenticateToken, doctorController.getPatientList);

app.post(
  "/patient/enableMessage",
  authenticateToken,
  doctorController.enablePatientMessage
);

app.post(
  "/doctor",
  authenticateToken,
  doctorController.addDoctor
);  

app.get(
  "/doctor/doctors",
  authenticateToken, 
  doctorController.getDoctorList);

// message section
app.post(
  "/doctor/patient/sendMessage",
  authenticateToken,
  doctorController.doctorSendMessageToPatient
);
app.post(
  "/doctor/patient/messages",
  authenticateToken,
  doctorController.getdoctorPatientMessages
);

app.post(
  "/doctor/doctor/sendMessage",
  authenticateToken,
  doctorController.doctorSendMessageToDoctor
);

app.post(
  "/doctor/doctor/messages",
  authenticateToken,
  doctorController.getDoctorDoctorMessages
);

//Patient routes
app.post("/patient/register", patientController.patientRegister);

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

app.get(
  "/patient/home",
  authenticateToken,
  patientController.getPatientHomepageData
);

app.get(
  "/patient/doctors",
  authenticateToken,
  patientController.getDoctorList
);

app.post(
  "/laboratory",
  authenticateToken,
  patientController.addLabortory
);

app.get(
  "/patient/laboratories",
  authenticateToken,
  patientController.getLaboratoryList
);

app.post(
  "/pharmacy",
  authenticateToken,
  patientController.addPharmacy
);

app.get(
  "/patient/pharmacies",
  authenticateToken,
  patientController.getPharmacyList
);

// Message part
app.post(
  "/patient/doctor/sendMessage",
  authenticateToken,
  patientController.patientSendMessageToDoctor
);

app.post(
  "/patient/doctor/messages",
  authenticateToken,
  patientController.getPatientDoctorMessages
);

// Patient-Lab message routes
app.post(
  "/patient/lab/sendMessage",
  authenticateToken,
  patientController.patientSendMessageToLab
);

app.post(
  "/patient/lab/messages",
  authenticateToken,
  patientController.getPatientLabMessages
);

// Patient-Pharmacy message routes
app.post(
  "/patient/pharmacy/sendMessage",
  authenticateToken,
  patientController.patientSendMessageToPharmacy
);

app.post(
  "/patient/pharmacy/messages",
  authenticateToken,
  patientController.getPatientPharmacyMessages
);

// Pharmacy routes
app.post("/pharmacy/register", pharmacyController.pharmacyRegister);

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

app.get(
  "/pharmacy/home",
  authenticateToken,
  pharmacyController.getPharmacyHomepageData
);

app.get(
  "/pharmacy/patients",
  authenticateToken,
  pharmacyController.getPatientList
);

// Pharmacy-Patient message routes
app.post(
  "/pharmacy/patient/sendMessage",
  authenticateToken,
  pharmacyController.pharmacySendMessageToPatient
);

app.post(
  "/pharmacy/patient/messages",
  authenticateToken,
  pharmacyController.getPharmacyPatientMessages
);

// Laboratory routes
app.post("/laboratory/register", laboratoryController.laboratoryRegister);

app.post(
  "/laboratory/profile",
  authenticateToken,
  laboratoryController.laboratoryProfileUpdate
);

app.get(
  "/laboratory/profile",
  authenticateToken,
  laboratoryController.getLaboratoryProfile
);

app.get(
  "/laboratory/home",
  authenticateToken,
  laboratoryController.getLaboratoryHomepageData
);

app.get(
  "/laboratory/patients",
  authenticateToken,
  laboratoryController.getPatientList
);

// Laboratory-Patient message routes
app.post(
  "/laboratory/patient/sendMessage",
  authenticateToken,
  laboratoryController.labSendMessageToPatient
);

app.post(
  "/laboratory/patient/messages",
  authenticateToken,
  laboratoryController.getLabPatientMessages
);

// Tests Area
const jwtTets = require("./test/jwtTests");
app.get("/test/refresh-tokens", jwtTets.jwtRTokens);
