const mongoose = require("mongoose");

const patientPharmacyMessageSchema = new mongoose.Schema(
  {
    pharmacyId: { type: String, required: true },
    patientId: { type: String, required: true },
    type: { type: String, required: true },
    sender: { type: String, required: true }, // "patient" or "pharmacy"
    data: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const PatientPharmacyMessage = mongoose.model(
  "PatientPharmacyMessage",
  patientPharmacyMessageSchema,
  "patientPharmacyMessages"
);

module.exports = PatientPharmacyMessage;
