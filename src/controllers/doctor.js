const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Doctor = require("../models/doctor");
const DoctorPatient = require("../models/doctorPatient");
const Patient = require("../models/patient");

const DoctorPatientMessage = require("../models/doctorPatientMessage");
const DoctorDoctorMessage = require("../models/doctorDoctorMessage");
const Timeline = require("../models/timeline");
const {
  connectedUsers,
  getChatNamespace,
  connectedUsersTl,
  getTimelineNamespace,
} = require("../config/webSocket");

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const NONCE_LENGTH = parseInt(process.env.NONCE_LENGTH);

const doctorRegister = async (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.fullName ||
    !req.body.email ||
    !req.body.slmcRegisterNumber ||
    !req.body.nic ||
    !req.body.password ||
    !req.body.phoneNumber
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingUserByNic = await Doctor.findOne({ nic: req.body.nic });
  if (existingUserByNic)
    return res.status(409).json({ message: "Nic already in use" });

  const existingUserBySlmc = await Doctor.findOne({
    slmcRegisterNumber: req.body.slmcRegisterNumber,
  });
  if (existingUserBySlmc)
    return res
      .status(409)
      .json({ message: "SLMC register number already in use" });

  const existingUserByEmail = await Doctor.findOne({
    email: req.body.email,
  });
  if (existingUserByEmail)
    return res.status(409).json({ message: "Email already in use" });

  let doctorId = generateDoctorId(req.body.nic);

  // Check if the doctor ID Already exists in the database
  while (true) {
    let existingDoctor = await Doctor.findOne({ doctorId });
    if (!existingDoctor) {
      break;
    }
    doctorId = generateDoctorId(req.body.nic);
  }

  const hashPassword = await bcrypt.hash(req.body.password, 10);

  try {
    await Doctor.create({
      doctorId: doctorId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: req.body.fullName,
      email: req.body.email,
      slmcRegisterNumber: req.body.slmcRegisterNumber,
      nic: req.body.nic,
      password: hashPassword,
      phoneNumber: req.body.phoneNumber,
    });
    res
      .status(201)
      .json({ message: "Doctor registered successfully", doctorId: doctorId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const generateDoctorId = (nic) => {
  const uniquePartNic = nic.slice(-4);

  const randomNum = Math.floor(Math.random() * 9) + 1;

  return `D${randomNum}${uniquePartNic}`;
};

const doctorProfileUpdate = async (req, res) => {
  const doctorId = req.user.id;
  const updateData = req.body;

  // List of fields to remove if they exist
  const fieldsToRemove = ["password", "email", "nic", "id"];

  // Remove fields from updateData if they exist
  fieldsToRemove.forEach((field) => {
    if (updateData.hasOwnProperty(field)) {
      delete updateData[field];
    }
  });

  try {
    await Doctor.updateOne({ doctorId }, { $set: updateData });
    res.status(200).json({ message: "Doctor update profile successfull" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getDoctorProfile = async (req, res) => {
  const doctorId = req.user.id;

  const user = await Doctor.findOne({ doctorId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

const getDoctorHomepageData = async (req, res) => {
  const doctorId = req.user.id;

  const user = await Doctor.findOne({ doctorId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

const addPatient = async (req, res) => {
  const doctorId = req.user.id;
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const existingDoctorPatient = await DoctorPatient.findOne({
    doctorId,
    patientId,
  });
  if (existingDoctorPatient)
    return res.status(409).json({ message: "Patient is already in the list" });

  try {
    await DoctorPatient.create({ doctorId, patientId });
    res.status(200).json({ message: "Patient successfully added to the list" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getPatientList = async (req, res) => {
  const doctorId = req.user.id;

  try {
    const doctorPatients = await DoctorPatient.find({ doctorId }).select(
      "-_id -doctorId -createdAt -updatedAt -__v"
    );

    if (!doctorPatients.length) {
      return res.status(404).json({ message: "No patients found" });
    }

    const patients = [];
    for (const doctorPatient of doctorPatients) {
      const patientDetails = await Patient.findOne({
        patientId: doctorPatient.patientId,
      }).select("firstName lastName profilePic -_id");
      if (patientDetails) {
        const patient = {
          ...doctorPatient.toObject(),
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

const enablePatientMessage = async (req, res) => {
  const doctorId = req.user.id;
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const existingDoctorPatient = await DoctorPatient.findOne({
    doctorId,
    patientId,
  });
  if (!existingDoctorPatient)
    return res.status(409).json({ message: "Patient not found in the list" });

  try {
    await DoctorPatient.updateOne(
      { doctorId, patientId },
      { messageStatus: true }
    );
    res.status(200).json({ message: "Messaging has enables for that patient" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const addDoctor = async (req, res) => {
  const doctorId = req.user.id;
  const { reciveDoctorId } = req.body;

  if (!reciveDoctorId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const recipient = await Doctor.findOne({ doctorId: reciveDoctorId });
  if (!recipient) {
    return res.status(404).json({ message: "Invalid doctor recipient" });
  }

  const existingDoctorDoctor = await DoctorDoctor.findOne({
    doctorId,
    reciveDoctorId,
  });
  if (existingDoctorDoctor)
    return res.status(409).json({ message: "Doctor is already in the list" });

  try {
    await DoctorDoctor.create({ doctorId, reciveDoctorId });
    res.status(200).json({ message: "Doctor successfully added to the list" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getDoctorList = async (req, res) => {
  const doctorId = req.user.id;

  try {
    const doctorDoctors = await DoctorDoctor.find({ doctorId }).select(
      "-_id -doctorId -createdAt -updatedAt -__v"
    );

    if (!doctorDoctors.length) {
      return res.status(404).json({ message: "No doctors found" });
    }

    const doctors = [];
    for (const doctorDoctor of doctorDoctors) {
      const doctorDetails = await Doctor.findOne({
        doctorId: doctorDoctor.reciveDoctorId,
      }).select("firstName lastName profilePic -_id");
      if (doctorDetails) {
        const doctor = {
          ...doctorDoctor.toObject(),
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

// Messaging Section

const doctorSendMessageToPatient = async (req, res) => {
  const doctorId = req.user.id;

  const { patientId, message, addedDate, addedTime } = req.body;

  if (!patientId || !message || !addedDate || !addedTime) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const encryptedMessage = encryptMessage(message);

  const sender = "doctor";

  try {
    // Save message to DB and retrieve the saved document
    const savedMessage = await DoctorPatientMessage.create({
      doctorId,
      patientId,
      sender,
      message: encryptedMessage, // Store encrypted message
      addedDate,
      addedTime,
    });

    // Convert to an object that can be sent over WebSockets
    const socketMessage = {
      doctorId: savedMessage.doctorId,
      patientId: savedMessage.patientId,
      sender: savedMessage.sender,
      message: message, // Send plaintext message over WebSocket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const chatNamespace = getChatNamespace();

    // **Find and send to all active sockets of sender & recipient**
    if (
      connectedUsers.has(doctorId) &&
      connectedUsers.get(doctorId).has(patientId)
    ) {
      const senderSockets = connectedUsers.get(doctorId).get(patientId).sockets;
      senderSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for doctor ${doctorId} and patient ${patientId}`
      );
    }

    if (
      connectedUsers.has(patientId) &&
      connectedUsers.get(patientId).has(doctorId)
    ) {
      const recipientSockets = connectedUsers
        .get(patientId)
        .get(doctorId).sockets;
      recipientSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for patient ${patientId} and doctor ${doctorId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getdoctorPatientMessages = async (req, res) => {
  const doctorId = req.user.id;

  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  try {
    const patients = await DoctorPatientMessage.find({
      doctorId,
      patientId,
    }).select("-doctorId -createdAt -updatedAt -__v -patientId");
    if (!patients.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    patients.forEach((patient) => {
      patient.message = decryptMessage(patient.message);
    });

    res.status(200).json(patients);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

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

// Add these functions before the module.exports

const doctorSendMessageToDoctor = async (req, res) => {
  const doctorId = req.user.id;

  const { reciveDoctorId, message, addedDate, addedTime } = req.body;

  if (!reciveDoctorId || !message || !addedDate || !addedTime) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const recipient = await Doctor.findOne({ doctorId: reciveDoctorId });
  if (!recipient) {
    return res.status(404).json({ message: "Invalid doctor recipient" });
  }

  const encryptedMessage = encryptMessage(message);

  const sender = doctorId;

  try {
    // Save message to DB and retrieve the saved document
    const savedMessage = await DoctorDoctorMessage.create({
      doctorId,
      reciveDoctorId,
      sender,
      message: encryptedMessage, // Store encrypted message
      addedDate,
      addedTime,
    });

    // Convert to an object that can be sent over WebSockets
    const socketMessage = {
      doctorId: savedMessage.doctorId,
      reciveDoctorId: savedMessage.reciveDoctorId,
      sender: savedMessage.sender,
      message: message, // Send plaintext message over WebSocket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const chatNamespace = getChatNamespace();

    // Find and send to all active sockets of sender
    if (
      connectedUsers.has(doctorId) &&
      connectedUsers.get(doctorId).has(reciveDoctorId)
    ) {
      const senderSockets = connectedUsers
        .get(doctorId)
        .get(reciveDoctorId).sockets;
      senderSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for sender doctor ${doctorId} and recipient doctor ${reciveDoctorId}`
      );
    }

    // Find and send to all active sockets of recipient
    if (
      connectedUsers.has(reciveDoctorId) &&
      connectedUsers.get(reciveDoctorId).has(doctorId)
    ) {
      const recipientSockets = connectedUsers
        .get(reciveDoctorId)
        .get(doctorId).sockets;
      recipientSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for recipient doctor ${reciveDoctorId} and sender doctor ${doctorId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getDoctorDoctorMessages = async (req, res) => {
  const doctorId = req.user.id;

  const { reciveDoctorId } = req.body;

  if (!reciveDoctorId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const recipient = await Doctor.findOne({ doctorId: reciveDoctorId });
  if (!recipient) {
    return res.status(404).json({ message: "Invalid doctor recipient" });
  }

  try {
    // Find messages where the current doctor is either sender or receiver
    const messages = await DoctorDoctorMessage.find({
      $or: [
        { doctorId: doctorId, reciveDoctorId: reciveDoctorId },
        { doctorId: reciveDoctorId, reciveDoctorId: doctorId },
      ],
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

// Timeline section
const doctorSendNoteToTimeline = async (req, res) => {
  const doctorId = req.user.id;

  const { patientId, note, addedDate, addedTime, type } = req.body;

  if (!patientId || !note || !addedDate || !addedTime || !type) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  let data;
  if (type == "note" || type == "donlynote" || type == "prescription") {
    data = { note: note };
  } else {
    return res.status(400).json({ message: "Invalid option in type field." });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const encryptedata = encryptMessage(JSON.stringify(data));

  const sender = "doctor";

  try {
    // Save message to DB and retrieve the saved document
    const savedMessage = await Timeline.create({
      doctorId,
      patientId,
      type,
      sender,
      data: encryptedata, // Store encrypted message
      addedDate,
      addedTime,
    });

    // Convert to an object that can be sent over WebSockets
    const socketMessage = {
      doctorId: savedMessage.doctorId,
      patientId: savedMessage.patientId,
      type: savedMessage.type,
      sender: savedMessage.sender,
      data: data, // Send plaintext message over WebSocket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const timelineNamespace = getTimelineNamespace();

    // Find and send to all active sockets of sender
    if (
      connectedUsersTl.has(doctorId) &&
      connectedUsersTl.get(doctorId).has(patientId)
    ) {
      const senderSockets = connectedUsersTl
        .get(doctorId)
        .get(patientId).sockets;
      senderSockets.forEach((socketId) => {
        timelineNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for sender doctor ${doctorId} and patient doctor ${patientId}`
      );
    }

    // Find and send to all active sockets of recipient
    if (
      connectedUsersTl.has(patientId) &&
      connectedUsersTl.get(patientId).has(doctorId)
    ) {
      const recipientSockets = connectedUsersTl
        .get(patientId)
        .get(doctorId).sockets;
      recipientSockets.forEach((socketId) => {
        timelineNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for patient ${patientId} and sender doctor ${doctorId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getDoctorTimelineData = async (req, res) => {
  const doctorId = req.user.id;

  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  try {
    const patients = await Timeline.find({
      doctorId,
      patientId,
    }).select("-doctorId -createdAt -updatedAt -__v -patientId");
    if (!patients.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    patients.forEach((patient) => {
      patient.data = decryptMessage(patient.data);
    });

    res.status(200).json(patients);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

module.exports = {
  doctorRegister,
  doctorProfileUpdate,
  getDoctorProfile,
  getDoctorHomepageData,
  addPatient,
  getPatientList,
  enablePatientMessage,
  addDoctor,
  getDoctorList,
  getdoctorPatientMessages,
  doctorSendMessageToPatient,
  doctorSendMessageToDoctor,
  getDoctorDoctorMessages,
  doctorSendNoteToTimeline,
  getDoctorTimelineData,
};
