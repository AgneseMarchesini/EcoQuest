const express = require("express")
const router = express.Router()
const Persona = require("../models/persona")
require("../models/utente"); 
require("../models/esercente");
const argon2 = require("argon2");

router.post("/signUp", async (req, res) => {
    try{
        const { type, email, password, username } = req.body;
        if (!(type && email && password && username)) {
            return res.status(400).json({ message: "Email, password e username sono obbligatori" })
        }
        if (!['Utente', 'Esercente'].includes(type)) {
            return res.status(400).json({ message: "Tipo di account non valido" });
        }

        const hashedPassword = await argon2.hash(password)
        const datiRegistrazione = {
            ...req.body,
            password: hashedPassword
        };
        const persona = await Persona.create(datiRegistrazione);
        persona.password = undefined;
        return res.status(201).json(persona);
    } 
    catch (error){
        let message = "Errore durante la registrazione";
        if (error.code === 11000) {
            message = "Mail già associata ad un utente"
        }
        return res.status(500).json({
            message: message,
            error: error.message
        });
    }
});

module.exports = router