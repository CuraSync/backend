const mongoose = require("mongoose");

const doctorPatientSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    lastVisit: { type: String, default: null },
    messageStatus: { type: Boolean, default: false },
    priority: { type: Number, min: 1, max: 3, default: 3 },
  },
  { timestamps: true }
);

const DoctorPatient = mongoose.model(
  "DoctorPatient",
  doctorPatientSchema,
  "doctorPatient"
);

module.exports = DoctorPatient;
