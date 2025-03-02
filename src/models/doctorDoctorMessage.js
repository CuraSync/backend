const mongoose = require("mongoose");

const doctorDoctorMessageSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    reciveDoctorId: { type: String, required: true },
    sender: { type: String, required: true },
    message: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const DoctorDoctorMessage = mongoose.model(
  "DoctorDoctorMessage",
  doctorDoctorMessageSchema,
  "doctorDoctorMessages"
);

module.exports = DoctorDoctorMessage;
