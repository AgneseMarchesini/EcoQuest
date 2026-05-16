const mongoose = require("mongoose")

const STATO_MISSIONE = ['DaIniziare', 'InCorso', 'Completata', 'Annullata', 'InPausa'];

// TEMPORANEO: finché non uniamo la logica di un altro branch usiamo questo sottoschema:
const pointSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
}, { _id: false });

const missionSchema = new mongoose.Schema({
    // percorso: {
    //     type: String,
    //     unique: true
    // },
    arrayPOI: {
        type: [pointSchema],
        required: true
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
        enum: STATO_MISSIONE,
        default: 'DaIniziare'
    },
    titolo: {
        type: String,
        required: true,
    },
    descrizione: {
        type: String
    },
    predefinita: {
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model("Missione", missionSchema)