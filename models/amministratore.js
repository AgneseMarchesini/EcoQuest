const Persona = require("./persona");

const Amministratore = Persona.discriminator("Amministratore");

module.exports = Amministratore