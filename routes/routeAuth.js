const express = require("express")
const router = express.Router()
const Persona = require("../models/persona")
require("../models/utente"); 
require("../models/esercente");
const argon2 = require("argon2");

router.post("/signUp", async (req, res) => {
    try{
        const { type, email, password, username } = req.body;
        console.log(req.body)
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
        return res.status(500).json({
            message: "Errore durante la registrazione",
            error: error.message
        });
    }
});

module.exports = router