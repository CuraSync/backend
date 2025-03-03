const Pharmacy = require("../models/pharmacy");
const bcrypt = require("bcryptjs");

const crypto = require("crypto");
const Patient = require("../models/patient");
const PatientPharmacyMessage = require("../models/patientPharmacyMessage");
const { connectedUsers, getChatNamespace } = require("../config/webSocket");
const PatientPharmacy = require("../models/patientPharmacy");

// Add these constants for encryption/decryption
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const NONCE_LENGTH = parseInt(process.env.NONCE_LENGTH);

const pharmacyRegister = async (req, res) => {
  if (
    !req.body.pharmacyName ||
    !req.body.email ||
    !req.body.licenceNumber ||
    !req.body.password ||
    !req.body.phoneNumber ||
    !req.body.location
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingUserByLicenceNumber = await Pharmacy.findOne({
    licenceNumber: req.body.licenceNumber,
  });
  if (existingUserByLicenceNumber) {
    return res
      .status(409)
      .json({ message: "User with this Licence Number already exists" });
  }

  const existingUserByEmail = await Pharmacy.findOne({ email: req.body.email });
  if (existingUserByEmail) {
    return res
      .status(409)
      .json({ message: "User with this Email already exists" });
  }

  let pharmacyId = generatePharmacyId(req.body.licenceNumber);

  // Checking for the pharmacy ID uniqueness
  while (true) {
    let existingPharmacy = await Pharmacy.findOne({ pharmacyId });
    if (!existingPharmacy) {
      break;
    }
    pharmacyId = generatePharmacyId(req.body.licenceNumber);
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  try {
    await Pharmacy.create({
      pharmacyId: pharmacyId,
      pharmacyName: req.body.pharmacyName,
      email: req.body.email,
      licenceNumber: req.body.licenceNumber,
      password: hashedPassword,
      phoneNumber: req.body.phoneNumber,
      location: req.body.location,
    });
    res.status(201).json({
      message: "Pharmacy created successfully",
      pharmacyId: pharmacyId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: err.message });
  }
};

const generatePharmacyId = (licenceNumber) => {
  const uniqueLicenceNumber = licenceNumber.slice(-4);
  const randomNum = Math.floor(Math.random() * 9) + 1;
  return `PH${randomNum}${uniqueLicenceNumber}`;
};

const pharmacyProfileUpdate = async (req, res) => {
  const pharmacyId = req.user.id;
  const updateData = req.body;

  //List of fields to be deleted
  const fieldsToRemove = ["pharmacyId", "email", "licenceNumber", "password"];

  //remove the fields from the data
  fieldsToRemove.forEach((field) => {
    if (updateData.hasOwnProperty(field)) {
      delete updateData[field];
    }
  });
  try {
    await Pharmacy.updateOne({ pharmacyId }, { $set: updateData });
    res.status(200).json({ message: "Pharmacy updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPharmacyProfile = async (req, res) => {
  const pharmacyId = req.user.id;
  const pharmacy = await Pharmacy.findOne({ pharmacyId }).select(
    "-password -_id"
  );
  if (!pharmacy) {
    return res.status(404).json({ message: "Pharmacy not found" });
  }
  res.status(200).json(pharmacy);
};

const getPharmacyHomepageData = async (req, res) => {
  const pharmacyId = req.user.id;

  const user = await Pharmacy.findOne({ pharmacyId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "Pharmacy not found" });
  }

  res.status(200).json(user);
};

const getPatientList = async (req, res) => {
  const pharmacyId = req.user.id;

  try {
    const patientPharmacies = await PatientPharmacy.find({ pharmacyId }).select(
      "patientId -_id"
    );

    if (!patientPharmacies.length) {
      return res.status(404).json({ message: "No patients found" });
    }

    const patients = [];
    for (const patientPharmacy of patientPharmacies) {
      const patientDetails = await Patient.findOne({
        patientId: patientPharmacy.patientId,
      }).select("firstName lastName profilePic -_id");
      if (patientDetails) {
        const patient = {
          ...patientPharmacy.toObject(),
          ...patientDetails.toObject(),
        };
        patients.push(patient);
      }
    }

    res.status(200).json(patients);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

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

// Add pharmacy messaging functions
const pharmacySendMessageToPatient = async (req, res) => {
  const pharmacyId = req.user.id;
  const { patientId, message, addedDate, addedTime, type } = req.body;

  if (!patientId || !message || !addedDate || !addedTime || !type) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  if (type != "message") {
    return res.status(400).json({ message: "Invalid option in type field." });
  }

  // Verify that the patient exists
  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const data = { message: message };
  const encryptedData = encryptMessage(JSON.stringify(data));
  const sender = "pharmacy";

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

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPharmacyPatientMessages = async (req, res) => {
  const pharmacyId = req.user.id;
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Verify that the patient exists
  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
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

module.exports = {
  pharmacyRegister,
  pharmacyProfileUpdate,
  getPharmacyProfile,
  getPharmacyHomepageData,
  getPatientList,
  pharmacySendMessageToPatient,
  getPharmacyPatientMessages,
};
