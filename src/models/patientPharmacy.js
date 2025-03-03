const mongoose = require("mongoose");

const patientPharmacySchema = new mongoose.Schema(
    {
        pharmacyId: { type: String, required: true },
        patientId: { type: String, required: true },
        messageStatus: { type: Boolean, default: false },
    },
    { timestamps: true }
    );

const PatientPharmacy = mongoose.model(
    "PatientPharmacy",
    patientPharmacySchema,
    "patientPharmacy"
    );  

module.exports = PatientPharmacy;