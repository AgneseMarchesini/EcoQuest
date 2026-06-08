const mongoose = require("mongoose")
const baseOptions = { discriminatorKey: "type" };
const Persona = require("./persona")

const Utente = Persona.discriminator("Utente", new mongoose.Schema({
    preferences: [Boolean],
    totalPoints: {
        type: Number,
        min: 0,
        default: 0
    },
    currentPoints: {
        type: Number,
        min: 0,
        default: 0
    },
    badges: [Boolean]
}))

module.exports = Utente