const Patient = require("../models/patient");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const DoctorPatientMessage = require("../models/doctorPatientMessage");
const Doctor = require("../models/doctor");
const { connectedUsers, getChatNamespace } = require("../config/webSocket");

// Add this import at the top with your other imports
const PatientLabMessage = require("../models/patientLabMessage");
const Laboratory = require("../models/laboratory"); // Make sure this exists

const PatientPharmacyMessage = require("../models/patientPharmacyMessage");
const Pharmacy = require("../models/pharmacy");
const Timeline = require("../models/timeline");

const DoctorPatient = require("../models/doctorPatient");
const PatientLab = require("../models/patientLab");
const PatientPharmacy = require("../models/patientPharmacy");

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const NONCE_LENGTH = parseInt(process.env.NONCE_LENGTH);

const patientRegister = async (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.nic ||
    !req.body.password ||
    !req.body.phoneNumber ||
    !req.body.address ||
    !req.body.dateOfBirth
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingUserByNic = await Patient.findOne({ nic: req.body.nic });
  if (existingUserByNic) {
    return res
      .status(409)
      .json({ message: "User with this NIC already exists" });
  }

  const existingUserByEmail = await Patient.findOne({ email: req.body.email });
  if (existingUserByEmail) {
    return res
      .status(409)
      .json({ message: "User with this Email already exists" });
  }

  let patientId = generatePatientId(req.body.nic);

  // Checking for the patient ID uniqueness
  while (true) {
    let existingPatient = await Patient.findOne({ patientId });
    if (!existingPatient) {
      break;
    }
    patientId = generatePatientId(req.body.nic);
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  try {
    await Patient.create({
      patientId: patientId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: req.body.fullName,
      email: req.body.email,
      nic: req.body.nic,
      password: hashedPassword,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      dateOfBirth: req.body.dateOfBirth,
    });
    res
      .status(201)
      .json({ message: "Patient created successfully", patientId: patientId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: error.message });
  }
};

const generatePatientId = (nic) => {
  const uniqueNic = nic.slice(-4);
  const randomNum = Math.floor(Math.random() * 9) + 1;
  return `PA${randomNum}${uniqueNic}`;
};

const patientProfileUpdate = async (req, res) => {
  const patientId = req.user.id;
  const updateData = req.body;

  // List of fields to remove if they exist
  const fieldsToRemove = ["email", "nic", "password", "id", "dateOfBirth"];

  // Remove the fields from the update data
  fieldsToRemove.forEach((field) => {
    if (updateData.hasOwnProperty(field)) {
      delete updateData[field];
    }
  });
  try {
    await Patient.updateOne({ patientId }, { $set: updateData });
    res.status(200).json({ message: "Patient profile updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPatientProfile = async (req, res) => {
  const patientId = req.user.id;

  const patient = await Patient.findOne({ patientId }).select("-password -_id");

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.status(200).json(patient);
};

const getPatientHomepageData = async (req, res) => {
  const patientId = req.user.id;

  const user = await Patient.findOne({ patientId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

const getDoctorList = async (req, res) => {
  const patientId = req.user.id;

  try {
    const doctorPatients = await DoctorPatient.find({ patientId }).select(
      "-_id -patientId -createdAt -updatedAt -__v"
    );

    if (!doctorPatients.length) {
      return res.status(404).json({ message: "No doctors found" });
    }

    const doctors = [];
    for (const doctorPatient of doctorPatients) {
      const doctorDetails = await Doctor.findOne({
        doctorId: doctorPatient.doctorId,
      }).select("firstName lastName profilePic -_id");
      if (doctorDetails) {
        const doctor = {
          ...doctorPatient.toObject(),
          ...doctorDetails.toObject(),
        };
        doctors.push(doctor);
      }
    }

    res.status(200).json(doctors);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const addLabortory = async (req, res) => {
  const patientId = req.user.id;
  const { labId } = req.body;

  if (!labId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingLab = await Laboratory.findOne({ labId });
  if (!existingLab) {
    return res.status(404).json({ message: "Invalid laboratory" });
  }

  try {
    const existingPatientLab = await PatientLab.findOne({ patientId, labId });
    if (existingPatientLab) {
      return res.status(409).json({ message: "Lab already added" });
    }

    await PatientLab.create({ patientId, labId });
    res.status(201).json({ message: "Lab added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getLaboratoryList = async (req, res) => {
  const patientId = req.user.id;

  try {
    const patientLabs = await PatientLab.find({ patientId }).select(
      "-_id -patientId -createdAt -updatedAt -__v"
    );

    if (!patientLabs.length) {
      return res.status(404).json({ message: "No labs found" });
    }

    const labs = [];
    for (const patientLab of patientLabs) {
      const labDetails = await Laboratory.findOne({
        labId: patientLab.labId,
      }).select("labName profilePic -_id");
      if (labDetails) {
        const lab = {
          ...patientLab.toObject(),
          ...labDetails.toObject(),
        };
        labs.push(lab);
      }
    }

    res.status(200).json(labs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const addPharmacy = async (req, res) => {
  const patientId = req.user.id;
  const { pharmacyId } = req.body;

  if (!pharmacyId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingPharmacy = await Pharmacy.findOne({ pharmacyId });
  if (!existingPharmacy) {
    return res.status(404).json({ message: "Invalid pharmacy" });
  }

  try {
    const existingPatientPharmacy = await PatientPharmacy.findOne({
      patientId,
      pharmacyId,
    });
    if (existingPatientPharmacy) {
      return res.status(409).json({ message: "Pharmacy already added" });
    }
    await PatientPharmacy.create({ patientId, pharmacyId });
    res.status(201).json({ message: "Pharmacy added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPharmacyList = async (req, res) => {
  const patientId = req.user.id;

  try {
    const patientPharmacies = await PatientPharmacy.find({ patientId }).select(
      "-_id -patientId -createdAt -updatedAt -__v"
    );

    if (!patientPharmacies.length) {
      return res.status(404).json({ message: "No pharmacies found" });
    }

    const pharmacies = [];
    for (const patientPharmacy of patientPharmacies) {
      const pharmacyDetails = await Pharmacy.findOne({
        pharmacyId: patientPharmacy.pharmacyId,
      }).select("pharmacyName profilePic -_id");
      if (pharmacyDetails) {
        const pharmacy = {
          ...patientPharmacy.toObject(),
          ...pharmacyDetails.toObject(),
        };
        pharmacies.push(pharmacy);
      }
    }

    res.status(200).json(pharmacies);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

// Message Section
// Add encryption/decryption utilities
const encryptMessage = (message) => {
  const nonce = crypto.randomBytes(NONCE_LENGTH); // Generate a unique nonce
  const cipher = crypto.createCipheriv("chacha20", KEY, nonce);

  let encrypted = cipher.update(message, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return nonce.toString("hex") + encrypted.toString("hex"); // Store nonce + ciphertext
};

const decryptMessage = (hexCiphertext) => {
  const nonce = Buffer.from(hexCiphertext.slice(0, NONCE_LENGTH * 2), "hex");
  const encryptedText = Buffer.from(
    hexCiphertext.slice(NONCE_LENGTH * 2),
    "hex"
  );

  const decipher = crypto.createDecipheriv("chacha20", KEY, nonce);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
};

// Add patient messaging functions
const patientSendMessageToDoctor = async (req, res) => {
  const patientId = req.user.id;
  const { doctorId, message, addedDate, addedTime } = req.body;

  if (!doctorId || !message || !addedDate || !addedTime) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Verify that the doctor exists
  const doctor = await Doctor.findOne({ doctorId });
  if (!doctor) {
    return res.status(404).json({ message: "Invalid doctor" });
  }

  const encryptedMessage = encryptMessage(message);
  const sender = "patient";

  try {
    // Save message to database
    const savedMessage = await DoctorPatientMessage.create({
      doctorId,
      patientId,
      sender,
      message: encryptedMessage,
      addedDate,
      addedTime,
    });

    // Format message for socket
    const socketMessage = {
      doctorId: savedMessage.doctorId,
      patientId: savedMessage.patientId,
      sender: savedMessage.sender,
      message: message, // Send plaintext over socket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const chatNamespace = getChatNamespace();

    // Notify patient's active connections
    if (
      connectedUsers.has(patientId) &&
      connectedUsers.get(patientId).has(doctorId)
    ) {
      const patientSockets = connectedUsers
        .get(patientId)
        .get(doctorId).sockets;
      patientSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for patient ${patientId} and doctor ${doctorId}`
      );
    }

    // Notify doctor's active connections
    if (
      connectedUsers.has(doctorId) &&
      connectedUsers.get(doctorId).has(patientId)
    ) {
      const doctorSockets = connectedUsers.get(doctorId).get(patientId).sockets;
      doctorSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for doctor ${doctorId} and patient ${patientId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPatientDoctorMessages = async (req, res) => {
  const patientId = req.user.id;
  const { doctorId } = req.body;

  if (!doctorId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Verify that the doctor exists
  const doctor = await Doctor.findOne({ doctorId });
  if (!doctor) {
    return res.status(404).json({ message: "Invalid doctor" });
  }

  try {
    const messages = await DoctorPatientMessage.find({
      doctorId,
      patientId,
    }).select("-createdAt -updatedAt -__v");

    if (!messages.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    // Decrypt all messages
    messages.forEach((message) => {
      message.message = decryptMessage(message.message);
    });

    res.status(200).json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

// Add these functions after your existing messaging functions Lab
const patientSendMessageToLab = async (req, res) => {
  const patientId = req.user.id;
  const { labId, type, message, addedDate, addedTime } = req.body;

  if (!labId || !type || !message || !addedDate || !addedTime) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  if (type != "message") {
    return res.status(400).json({ message: "Invalid option in type field." });
  }

  // Verify that the laboratory exists
  const lab = await Laboratory.findOne({ labId });
  if (!lab) {
    return res.status(404).json({ message: "Invalid laboratory" });
  }

  const data = { message: message };
  const encryptedData = encryptMessage(JSON.stringify(data));
  const sender = "patient";

  try {
    // Save message to database
    const savedMessage = await PatientLabMessage.create({
      labId,
      patientId,
      type,
      sender,
      data: encryptedData,
      addedDate,
      addedTime,
    });

    // Format message for socket
    const socketMessage = {
      labId: savedMessage.labId,
      patientId: savedMessage.patientId,
      type: savedMessage.type,
      sender: savedMessage.sender,
      data: data, // Send plaintext over socket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const chatNamespace = getChatNamespace();

    // Notify patient's active connections
    if (
      connectedUsers.has(patientId) &&
      connectedUsers.get(patientId).has(labId)
    ) {
      const patientSockets = connectedUsers.get(patientId).get(labId).sockets;
      patientSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for patient ${patientId} and lab ${labId}`
      );
    }

    // Notify lab's active connections
    if (connectedUsers.has(labId) && connectedUsers.get(labId).has(patientId)) {
      const labSockets = connectedUsers.get(labId).get(patientId).sockets;
      labSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for lab ${labId} and patient ${patientId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPatientLabMessages = async (req, res) => {
  const patientId = req.user.id;
  const { labId } = req.body;

  if (!labId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Verify that the laboratory exists
  const lab = await Laboratory.findOne({ labId });
  if (!lab) {
    return res.status(404).json({ message: "Invalid laboratory" });
  }

  try {
    const messages = await PatientLabMessage.find({
      labId,
      patientId,
    }).select("-createdAt -updatedAt -__v");

    if (!messages.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    // Decrypt all messages
    messages.forEach((message) => {
      // Parse the decrypted data back to an object
      message.data = decryptMessage(message.data);
    });

    res.status(200).json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

// Add these functions after your existing messaging functions

const patientSendMessageToPharmacy = async (req, res) => {
  const patientId = req.user.id;
  const { pharmacyId, type, addedDate, addedTime, message } = req.body;

  if (!pharmacyId || !message || !addedDate || !addedTime || !type) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  if (type != "message") {
    return res.status(400).json({ message: "Invalid option in type field." });
  }

  // Verify that the pharmacy exists
  const pharmacy = await Pharmacy.findOne({ pharmacyId });
  if (!pharmacy) {
    return res.status(404).json({ message: "Invalid pharmacy" });
  }

  const data = { message: message };
  const encryptedData = encryptMessage(JSON.stringify(data));
  const sender = "patient";

  try {
    // Save message to database
    const savedMessage = await PatientPharmacyMessage.create({
      pharmacyId,
      patientId,
      type,
      sender,
      data: encryptedData,
      addedDate,
      addedTime,
    });

    // Format message for socket
    const socketMessage = {
      pharmacyId: savedMessage.pharmacyId,
      patientId: savedMessage.patientId,
      type: savedMessage.type,
      sender: savedMessage.sender,
      data: data, // Send plaintext over socket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const chatNamespace = getChatNamespace();

    // Notify patient's active connections
    if (
      connectedUsers.has(patientId) &&
      connectedUsers.get(patientId).has(pharmacyId)
    ) {
      const patientSockets = connectedUsers
        .get(patientId)
        .get(pharmacyId).sockets;
      patientSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for patient ${patientId} and pharmacy ${pharmacyId}`
      );
    }

    // Notify pharmacy's active connections
    if (
      connectedUsers.has(pharmacyId) &&
      connectedUsers.get(pharmacyId).has(patientId)
    ) {
      const pharmacySockets = connectedUsers
        .get(pharmacyId)
        .get(patientId).sockets;
      pharmacySockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for pharmacy ${pharmacyId} and patient ${patientId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPatientPharmacyMessages = async (req, res) => {
  const patientId = req.user.id;
  const { pharmacyId } = req.body;

  if (!pharmacyId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Verify that the pharmacy exists
  const pharmacy = await Pharmacy.findOne({ pharmacyId });
  if (!pharmacy) {
    return res.status(404).json({ message: "Invalid pharmacy" });
  }

  try {
    const messages = await PatientPharmacyMessage.find({
      pharmacyId,
      patientId,
    }).select("-createdAt -updatedAt -__v");

    if (!messages.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    // Decrypt all messages
    messages.forEach((message) => {
      message.data = decryptMessage(message.data);
    });

    res.status(200).json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPatientTimelineData = async (req, res) => {
  const patientId = req.user.id;
  const { doctorId } = req.body;

  if (!doctorId) {
    return res.status(400).json({ message: "Doctor ID is required" });
  }

  // Verify that the doctor exists
  const doctor = await Doctor.findOne({ doctorId });
  if (!doctor) {
    return res.status(404).json({ message: "Invalid doctor" });
  }

  try {
    const timelineEntries = await Timeline.find({
      doctorId,
      patientId,
    }).select("-doctorId -createdAt -updatedAt -__v -patientId");

    if (!timelineEntries.length) {
      return res.status(404).json({ message: "No timeline entries found" });
    }

    timelineEntries.forEach((entry) => {
      entry.data = decryptMessage(entry.data);
    });

    res.status(200).json(timelineEntries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

module.exports = {
  patientRegister,
  patientProfileUpdate,
  getPatientProfile,
  getPatientHomepageData,
  getDoctorList,
  addLabortory,
  getLaboratoryList,
  addPharmacy,
  getPharmacyList,
  patientSendMessageToDoctor,
  getPatientDoctorMessages,
  patientSendMessageToLab,
  getPatientLabMessages,
  patientSendMessageToPharmacy,
  getPatientPharmacyMessages,
  getPatientTimelineData,
};
