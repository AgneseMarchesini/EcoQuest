const mongoose = require("mongoose")

const CATEGORIES = ['ScontoPercentuale', 'ScontoInDenaro', 'Omaggio'];

const couponSchema = new mongoose.Schema({
    attivitaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attivita',
        required: true
    },
    titolo: {
        type: String,
        unique: true,
        required: true,
    },
    descrizione: {
        type: String
    },
    codice: {
        type: String,
        unique: true,
        uppercase: true,
        required: true
    },
    costoInPunti: {
        type: Number,
        required: true
    },
    scadenza: {
        type: Date,
        required: true
    },
    categoria: {
        type: String,
        enum: CATEGORIES,
        required: true
    },
    quantita: {
        type: Number,
        required: true,
        min: [1, "La quantità minima deve essere almeno 1"]
    }
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema)