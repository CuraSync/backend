const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true, immutable: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    nic: { type: String, required: true, unique: true, immutable: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    height: { type: Number },
    weight: { type: Number },
    bmi: { type: Number },
    bloodType: { type: String },
    medicationAllergies: { type: [String], default: [] },
    guardianName: { type: String },
    guardianContactNumber: { type: String },
    guardianEmail: { type: String },
    profilePic: { type: String },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Patient", patientSchema, "patient");

module.exports = Doctor;
