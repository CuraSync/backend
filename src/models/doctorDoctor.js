const mongoose = require('mongoose');

const doctorDoctorSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    reciveDoctorId: { type: String, required: true },
    messageStatus: { type: Boolean, default: false },
    
  },
  { timestamps: true }
);

const DoctorDoctor = mongoose.model(
    'DoctorDoctor',
    doctorDoctorSchema,
    'doctorDoctor'
    );  

module.exports = DoctorDoctor;