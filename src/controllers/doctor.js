const bcrypt = require("bcryptjs");

const Doctor = require("../models/doctor");

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
    res.status(201).json({ message: "Doctor registered successfully" });
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

module.exports = { doctorRegister };
