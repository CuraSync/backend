const mongoose = require("mongoose");

const doctorPatientMessageSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    sender: { type: String, required: true },
    message: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const DoctorPatientMessage = mongoose.model(
  "DoctorPatientMessage",
  doctorPatientMessageSchema,
  "doctorPatientMessages"
);

module.exports = DoctorPatientMessage;
