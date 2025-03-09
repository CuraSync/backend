const mongoose = require("mongoose");

const dpRequestSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    status: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const DpRequest = mongoose.model("DpRequest", dpRequestSchema, "dpRequest");

module.exports = DpRequest;
