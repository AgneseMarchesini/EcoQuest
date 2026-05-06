const express = require("express")
const router = express.Router()
const Persona = require("../models/persona")
require("../models/utente"); 
require("../models/esercente");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken")
require("dotenv").config();

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token non valido" });
    }
}

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
    catch (error) {
        let message = "Errore durante la registrazione";

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Mail già associata ad un utente"
            });
        }

        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: errors
            });
        }

        return res.status(500).json({
            message,
            error: error.message
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body

        if (!email || !password) {
            return res.status(400).json({message: "Email e password sono obbligatorie"})
        }
        
        const persona = await Persona.findOne({email: email})

        if (!persona) {
            return res.status(401).json({message: "Credenziali non valide"})
        }

        const match = await argon2.verify(persona.password, password)
        
        if (!match) {
            return res.status(401).json({message: "Credenziali non valide"})
        }

        const token = jwt.sign(
            {userId: persona._id, role: persona.type},
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        if (!token) {
            return res.status(401).json({message: "Token non creato"})
        }

        return res.json({token})
    } catch (error) {
        return res.json({messaggio: "Errore"})
    }
})

module.exports = router