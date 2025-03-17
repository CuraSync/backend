const mongoose = require("mongoose");

const ddRequestSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    secondDoctorId: { type: String, required: true },
    status: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const DdRequest = mongoose.model("DdRequest", ddRequestSchema, "ddRequest");

module.exports = DdRequest;