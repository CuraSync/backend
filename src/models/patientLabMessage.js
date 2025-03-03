const mongoose = require("mongoose");

const patientLabMessageSchema = new mongoose.Schema(
  {
    labId: { type: String, required: true },
    patientId: { type: String, required: true },
    type: { type: String, required: true },
    sender: { type: String, required: true }, // "patient" or "laboratory"
    data: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const PatientLabMessage = mongoose.model(
  "PatientLabMessage",
  patientLabMessageSchema,
  "patientLabMessages"
);

module.exports = PatientLabMessage;
