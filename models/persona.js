const mongoose = require("mongoose")
const baseOptions = { discriminatorKey: "type" };

const personaSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }, 
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, baseOptions)

const Persona = mongoose.model("Persona", personaSchema)
module.exports = Persona