const bcrypt = require("bcryptjs");

const Doctor = require("../models/doctor");
const DoctorPatient = require("../models/doctorPatient");
const Patient = require("../models/patient");

const doctorRegister = async (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.fullName ||
    !req.body.email ||
    !req.body.slmcRegisterNumber ||
    !req.body.nic ||
    !req.body.password ||
    !req.body.phoneNumber
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingUserByNic = await Doctor.findOne({ nic: req.body.nic });
  if (existingUserByNic)
    return res.status(409).json({ message: "Nic already in use" });

  const existingUserBySlmc = await Doctor.findOne({
    slmcRegisterNumber: req.body.slmcRegisterNumber,
  });
  if (existingUserBySlmc)
    return res
      .status(409)
      .json({ message: "SLMC register number already in use" });

  const existingUserByEmail = await Doctor.findOne({
    email: req.body.email,
  });
  if (existingUserByEmail)
    return res.status(409).json({ message: "Email already in use" });

  let doctorId = generateDoctorId(req.body.nic);

  // Check if the doctor ID Already exists in the database
  while (true) {
    let existingDoctor = await Doctor.findOne({ doctorId });
    if (!existingDoctor) {
      break;
    }
    doctorId = generateDoctorId(req.body.nic);
  }

  const hashPassword = await bcrypt.hash(req.body.password, 10);

  try {
    await Doctor.create({
      doctorId: doctorId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: req.body.fullName,
      email: req.body.email,
      slmcRegisterNumber: req.body.slmcRegisterNumber,
      nic: req.body.nic,
      password: hashPassword,
      phoneNumber: req.body.phoneNumber,
    });
    res
      .status(201)
      .json({ message: "Doctor registered successfully", doctorId: doctorId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const generateDoctorId = (nic) => {
  const uniquePartNic = nic.slice(-4);

  const randomNum = Math.floor(Math.random() * 9) + 1;

  return `D${randomNum}${uniquePartNic}`;
};

const doctorProfileUpdate = async (req, res) => {
  const doctorId = req.user.id;
  const updateData = req.body;

  // List of fields to remove if they exist
  const fieldsToRemove = ["password", "email", "nic", "id"];

  // Remove fields from updateData if they exist
  fieldsToRemove.forEach((field) => {
    if (updateData.hasOwnProperty(field)) {
      delete updateData[field];
    }
  });

  try {
    await Doctor.updateOne({ doctorId }, { $set: updateData });
    res.status(200).json({ message: "Doctor update profile successfull" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getDoctorProfile = async (req, res) => {
  const doctorId = req.user.id;

  const user = await Doctor.findOne({ doctorId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

const getDoctorHomepageData = async (req, res) => {
  const doctorId = req.user.id;

  const user = await Doctor.findOne({ doctorId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

const addPatient = async (req, res) => {
  const doctorId = req.user.id;
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const existingDoctorPatient = await DoctorPatient.findOne({
    doctorId,
    patientId,
  });
  if (existingDoctorPatient)
    return res.status(409).json({ message: "Patient is already in the list" });

  try {
    await DoctorPatient.create({ doctorId, patientId });
    res.status(200).json({ message: "Patient successfully added to the list" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

module.exports = {
  doctorRegister,
  doctorProfileUpdate,
  getDoctorProfile,
  getDoctorHomepageData,
  addPatient,
};
