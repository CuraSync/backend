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
    dateOfBirth: { type: Date, required: true, immutable: true },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    bmi: { type: Number, default: null },
    bloodType: { type: String, default: null },
    medicationAllergies: { type: [String], default: [] },
    guardianName: { type: String, default: null },
    guardianContactNumber: { type: String, default: null },
    guardianEmail: { type: String, default: null },
    profilePic: { type: String, default: null },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema, "patients");

module.exports = Patient;
