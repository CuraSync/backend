const mongoose = require("mongoose");

const patientLabSchema = new mongoose.Schema(
    {
        labId: { type: String, required: true },
        patientId: { type: String, required: true },
        messageStatus: { type: Boolean, default: false },
    },
    { timestamps: true }
    );

const PatientLab = mongoose.model(
    "PatientLab",
    patientLabSchema,
    "patientLab"
    );

module.exports = PatientLab;