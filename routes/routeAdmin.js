const express = require("express")
const router = express.Router()
const Persona = require("../models/persona")
require("../models/amministratore"); 
const POI = require("../models/POI");
const jwt = require("jsonwebtoken")
require("dotenv").config();
const path = require("path")

router.get("/add_POI", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/add_POI.html"));
});

router.post("/add_POI", async (req, res) => {
    try {
        console.log(req.body);
        
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