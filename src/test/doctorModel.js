const Doctor = require("../models/doctor");

const createDoctor = async () => {
  try {
    const savedUser = await Doctor.create({
      doctorId: "DOC123456",
      firstName: "John",
      lastName: "Doe",
      fullName: "Dr. John Doe",
      email: "johndoe@example.com",
      slmcRegisterNumber: "SLMC789456",
      nic: "200012345678",
      password: "$2b$10$encryptedpasswordhash",
      phoneNumber: "+1234567890",
    });

    console.log("Doctor Successfully create", savedUser);
  } catch (err) {
    if (err.name === "ValidationError") {
      console.error("Validation error: ", err.message);
    } else if (err.code === 11000) {
      console.error("Duplicate Error: ", err.message);
    } else {
      console.error("Unexpected Error ", err);
    }
  }
};

module.exports = { createDoctor };
