const mongoose = require("mongoose")

const CATEGORIA_ATTIVITA = ['Bar', 'Pizzeria', 'Ristorante', 'Panetteria', 'Vestiario', 'Negozio', 'Alimentari']
const orarioGiornalieroSchema = new mongoose.Schema({
    aperto: { type: Boolean, default: true },
    apertura: { type: String, default: "09:00" }, // hh:mm
    chiusura: { type: String, default: "19:00" }
}, { _id: false });

const attivitaSchema = new mongoose.Schema({
    esercenteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Esercente',
        required: true
    },
    nomeAttivita: {
        type: String,
        unique: true,
        required: true
    },
    descrizione: {
        type: String,
        required: true
    },
    posizione: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], 
            required: true,
            validate: {
                validator: function(v) {
                    return v.length === 2;
                }, 
                message: "Le coordinate devono contenere esattamente due valori: [Longitudine, Latitudine]"
            }
        }
    },
    orari: {
        lunedi: orarioGiornalieroSchema,
        martedi: orarioGiornalieroSchema,
        mercoledi: orarioGiornalieroSchema,
        giovedi: orarioGiornalieroSchema,
        venerdi: orarioGiornalieroSchema,
        sabato: orarioGiornalieroSchema,
        domenica: orarioGiornalieroSchema
    },
    categoria: {
        type: [String],
        enum: CATEGORIA_ATTIVITA,
        required: true
    },
    statoApprovazione: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Attivita", attivitaSchema);