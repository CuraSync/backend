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
    specialization: { type: String },
    education: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    yearsOfExperience: { type: Number },
    rating: { type: Number, min: 0, max: 5 },
    currentWorkingHospitals: { type: [String], default: [] },
    contactInfo: { type: String },
    availability: { type: String },
    description: { type: String },
    profilePic: { type: String },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema, "doctors");

module.exports = Doctor;
