const mongoose = require("mongoose");

const STATO_MISSIONE = ['DaIniziare', 'InCorso', 'Completata', 'Annullata', 'InPausa'];

const missioneUtenteSchema = new mongoose.Schema({

    // Rinominato in userId
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utente", 
        required: true
    },

    missionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Missione",
        required: true
    },

    stato: {
        type: String,
        enum: STATO_MISSIONE,
        default: "InCorso"
    },

    startTime: {
        type: Date,
        default: Date.now
    },

    endTime: {
        type: Date,
        default: null
    },

    currentStep: {
        type: Number,
        default: 0
    },

    progress: {
        visitedPOI: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "POI"
        }]
    },

    rewardGiven: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model("missioneUtente", missioneUtenteSchema);