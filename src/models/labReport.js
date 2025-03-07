const mongoose = require("mongoose");

const labReportSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    cloudinaryId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    url: { type: String, required: true },
    file_name: { type: String, required: true },
    file_size: { type: String, required: true },
    file_type: { type: String, required: true },
    extracted_data: { type: String, default: null },
    visualization: { type: String, default: null },
  },
  { timestamps: true }
);

const LabReport = mongoose.model("LabReport", labReportSchema, "labReport");

module.exports = LabReport;
