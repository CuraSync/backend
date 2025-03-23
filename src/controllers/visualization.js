const mongoose = require("mongoose");
const axios = require("axios");
const LabReport = require("../models/labReport");
const Patient = require("../models/patient");

const getVisualization = async (req, res) => {
  const { reportId } = req.body;

  if (!reportId)
    return res.status(400).json({ message: "Request ID is required" });

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ message: "Invalid request ID format" });
  }

  try {
    const report = await LabReport.findOne({
      _id: reportId,
    }).select("visualization");

    if (!report) {
      return res.status(400).json({ message: "Report is not found" });
    }

    return res.status(200).json({
      message: "Visualization sent successfully",
      visualization: report.visualization,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const generateVisualization = async (req, res) => {
  const { reportId } = req.body;

  if (!reportId)
    return res.status(400).json({ message: "Request ID is required" });

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ message: "Invalid request ID format" });
  }

  const report = await LabReport.findOne({
    _id: reportId,
  }).select("patientId url");

  if (!report) {
    return res.status(400).json({ message: "Report is not found" });
  }

  const patientId = report.patientId;

  const patient = await Patient.findOne({
    patientId,
  }).select("gender dateOfBirth");

  if (!patient) {
    return res.status(400).json({ message: "Patient is not found" });
  }

  try {
    const now = new Date();
    const birth = new Date(patient.dateOfBirth);

    let ageInYears = now.getFullYear() - birth.getFullYear();

    if (
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
    ) {
      ageInYears--;
    }

    const gender = patient.gender;

    const response = await axios.post(
      `${process.env.VISUALIZATION_URL}/visualization`,
      {
        image_url: report.url,
        age: ageInYears,
        gender: gender,
      }
    );

    await LabReport.findByIdAndUpdate(reportId, {
      visualization: response.data.explanation,
    });

    return res.status(200).json({
      message: "Visualization sent successfully",
      visualization: response.data.explanation,
    });
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data;

      if (
        error.response.status === 422 ||
        (errorData &&
          errorData.error === "Type does not found. Or type does not support.")
      ) {
        return res.status(422).json({
          message: "Report type does not support.",
          error: errorData.error || "Type not supported",
        });
      } else {
        return res.status(error.response.status || 500).json({
          message: "Error in the visualization",
          error: errorData.error || error.message || "Unknown error",
        });
      }
    }
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

module.exports = {
  getVisualization,
  generateVisualization,
};
