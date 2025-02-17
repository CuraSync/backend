const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, unique: true, immutable: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    slmcRegisterNumber: { type: String, required: true, unique: true },
    nic: { type: String, required: true, unique: true, immutable: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    specialization: { type: String, default: null },
    education: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    yearsOfExperience: { type: Number, default: null },
    rating: { type: Number, min: 0, max: 5, default: null },
    currentWorkingHospitals: { type: [String], default: [] },
    contactInfo: { type: String, default: null },
    availability: { type: String, default: null },
    description: { type: String, default: null },
    profilePic: { type: String, default: null },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema, "doctors");

module.exports = Doctor;
