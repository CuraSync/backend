const mongoose = require("mongoose");

const labSchema = new mongoose.Schema(
  {
    labId: { type: String, required: true, unique: true, immutable: true },
    labName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    licenceNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: null },
    operatingHours: { type: String, default: null },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    profilePic: { type: String, default: null },
    contactInformation: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Laboratory = mongoose.model("Laboratory", labSchema, "laboratories");

module.exports = Laboratory;
