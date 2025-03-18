const mongoose = require('mongoose');

const plRequestSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    labId: { type: String, required: true },
    status: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);  

const PlRequest = mongoose.model('PlRequest', plRequestSchema, 'plRequest');

module.exports = PlRequest; 