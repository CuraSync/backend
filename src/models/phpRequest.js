const mongoose = require('mongoose');

const phpRequestSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    pharmacyId: { type: String, required: true },
    status: { type: String, required: true },
    addedDate: { type: String, required: true },
    addedTime: { type: String, required: true },
  },
  { timestamps: true }
);

const PhpRequest = mongoose.model('PhpRequest', phpRequestSchema, 'phpRequest');

module.exports = PhpRequest;