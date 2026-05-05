const mongoose = require("mongoose");
const baseOptions = { discriminatorKey: "type" };
const Persona = require("./persona");

const Esercente = Persona.discriminator("Esercente", new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    cognome: {
        type: String,
        required: true,
    },
    codiceFiscale: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        match: [/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/, 'Codice Fiscale non valido']
    },
    partitaIVA: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{11}$/, 'Partita IVA deve essere di 11 cifre']
    }
    //listaAttivita: [Attivita]
}));

module.exports = Esercente