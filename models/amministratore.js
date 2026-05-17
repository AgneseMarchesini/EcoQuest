const mongoose = require("mongoose");
const Persona = require("./persona");

const Amministratore = Persona.discriminator("Amministratore", new mongoose.Schema({

}));

module.exports = Amministratore;