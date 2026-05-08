const express = require("express")
const router = express.Router()
const Persona = require("../models/persona")
require("../models/utente"); 
require("../models/esercente");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken")
require("dotenv").config();
const path = require("path")

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

router.get("/signUp", (req, res)=>{
    res.sendFile(path.join(__dirname, "../frontend/sign_up.html"))
})

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

router.get("/admin/add_POI", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/add_POI.html"));
});

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

            if (error.keyPattern.email) {
                return res.status(409).json({
                    message: "Mail già associata ad un utente"
                });
            }

            if (error.keyPattern.username) {
                return res.status(409).json({
                    message: "Username già in uso"
                });
            }

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
        return res.status(500).json({message: "Errore"})
    }
})

router.post("/admin/add_POI", async (req, res) => {
    try {
        const nuovoPOI = await POI.create(req.body);

        return res.status(201).json(nuovoPOI);
    } catch (error) {
        let message = "Errore durante il salvataggio del POI";

        if (error.code === 11000) {
            if(error.keyPattern.nome) {
                return res.status(409).json({
                    message: "Nome già associato a un altro POI"
                });
            }

            if(error.keyPattern.coordinate) {
                return res.status(409).json({
                    message: "Coordinate già associate a un altro POI"
                });
            }
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
})

module.exports = router