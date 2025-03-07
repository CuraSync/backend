const mongoose = require("mongoose");

const cloudinary = require("../config/cloudinary");
const LabReport = require("../models/labReport");
const axios = require("axios");

// Upload File Controller
const uploadLabReport = async (req, res) => {
  try {
    const file = req.file;
    const { patientId, file_name } = req.body;
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!patientId || !file_name)
      return res.status(400).json({ message: "Required fields are missing" });

    cloudinary.uploader
      .upload_stream({ resource_type: "auto" }, async (error, result) => {
        if (error)
          return res.status(500).json({ message: "Cloudinary upload error" });

        // Store URL in MongoDB
        const newReport = new LabReport({
          patientId,
          file_name: file_name,
          file_size: result.bytes,
          file_type: result.format,
          cloudinaryId: result.public_id,
          url: result.secure_url,
        });
        await newReport.save();

        res
          .status(201)
          .json({ message: "File uploaded successfully", id: newReport._id });
      })
      .end(file.buffer);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

// Stream File by ID Controller
const getLabReportFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId)
      return res.status(400).json({ message: "File ID is required" });

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID format" });
    }

    const file = await LabReport.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    // Get the file from Cloudinary
    const response = await axios({
      method: "get",
      url: file.url,
      responseType: "stream",
    });

    // Set headers for streaming
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Length", response.headers["content-length"]);

    // Stream the file to the frontend
    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

// Get File info by ID Controller
const getLabReportFileInfoById = async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId)
      return res.status(400).json({ message: "File ID is required" });

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID format" });
    }

    const file = await LabReport.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    res.status(200).json({
      message: "File info retrieved successfully",
      data: {
        file_name: file.file_name,
        file_size: file.file_size,
        file_type: file.file_type,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

// Update the exports to include the new function
module.exports = {
  uploadLabReport,
  getLabReportFileById,
  getLabReportFileInfoById,
};
