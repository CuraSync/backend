const mongoose = require("mongoose");

const timelineSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    type: { type: String, required: true },
    sender: { type: String, required: true }, // "patient" or "laboratory"
    data: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const Timeline = mongoose.model("Timeline", timelineSchema, "timeline");

module.exports = Timeline;
