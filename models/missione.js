const mongoose = require("mongoose")

const STATO_MISSIONE = ['DaIniziare', 'InCorso', 'Completata', 'Annullata', 'InPausa'];

const missionSchema = new mongoose.Schema({
    percorso: {
        type: String,
        required: true,
        unique: true
    },
    punti: {
        type: Number,
        min: 0,
        required: true
    },
    bonusGamification: {
        type: Number,
        min: 0
    },
    risparmioCO2: {
        type: mongoose.Decimal128,
        min: 0
    },
    stato: {
        type: String,
        enum: STATO_MISSIONE
    }
})

module.exports = mongoose.model("Missione", missionSchema)