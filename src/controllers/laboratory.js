const bcrypt = require("bcryptjs");
const Laboratory = require("../models/laboratory");

const laboratoryRegister = async (req, res) => {
    if(
        !req.body.labName ||
        !req.body.email ||
        !req.body.licenceNumber ||
        !req.body.password ||
        !req.body.phoneNumber ||
        !req.body.location
    ){
        return res.status(400).json({message: "Required fields are missing"});
    }

    const existingUserByLicenceNumber = await Laboratory.findOne({licenceNumber: req.body.licenceNumber});
    if(existingUserByLicenceNumber){
        return res
            .status(409)
            .json({message: "User with this Licence Number already exists"});
    }

    const existingUserByEmail = await Laboratory.findOne({email: req.body.email});
    if(existingUserByEmail){
        return res
            .status(409)
            .json({message: "User with this Email already exists"});
    }

    let labId = generateLabId(req.body.licenceNumber);

    // Checking for the Lab ID uniqueness
    while(true){
        let existingLab = await Laboratory.findOne({labId});
        if(!existingLab){
            break;
        }
        labId = generateLabId(req.body.licenceNumber);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try{
        await Laboratory.create({
            labId: labId,
            labName: req.body.labName,
            email: req.body.email,
            licenceNumber: req.body.licenceNumber,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            location: req.body.location,
        });
        res
            .status(201)
            .json({message: "Laboratory created successfully", labId: labId});
    }catch(err){
        res
            .status(500)
            .json({message: "Unexpected Error Occurred", error: err.message});
    }
};

const generateLabId = (licenceNumber) => {
    const uniqueLicenceNumber = licenceNumber.slice(-4);
    const randomNum = Math.floor(Math.random() * 9) + 1;
    return `L${randomNum}${uniqueLicenceNumber}`;
};

const laboratoryProfileUpdate = async (req, res) => {
    const labId = req.user.id;
    const updateData = req.body;

    //List of fields to be deleted
    const fieldsToDelete = [
        "labId",
        "email",
        "licenceNumber",
        "password"];

    //Deleting the fields
    fieldsToDelete.forEach((field) => {
        if(updateData.hasOwnProperty(field)){
            delete updateData[field];
        }
    }); 
    try{
        await Laboratory.updateOne({labId}, {$set: updateData}); 
        res
            .status(200)
            .json({message: "Profile updated successfully"});   
    }catch(err){     
        res
            .status(500)
            .json({message: "Unexpected Error Occurred", error: err.message});
    }        
};
module.exports = {laboratoryRegister, laboratoryProfileUpdate};