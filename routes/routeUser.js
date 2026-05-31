const express = require('express');
const router = express.Router();
const Utente = require('../models/utente.js'); 
const path = require('path');

const { authMiddleware } = require("../utils.js")

// restituisce i punti dell'utente loggato
router.get('/api/punti', authMiddleware, async (req, res) => {
    try {
        const utenteLoggato = await Utente.findById(req.user.userId).select('currentPoints totalPoints');
        
        if (!utenteLoggato) {
            return res.status(404).json({ message: "Utente non trovato nel database." });
        }
        
        return res.json({ 
            currentPoints: utenteLoggato.currentPoints,
            totalPoints: utenteLoggato.totalPoints
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Errore del server" });
    }
});

module.exports = router;