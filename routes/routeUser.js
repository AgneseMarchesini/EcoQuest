const express = require('express');
const router = express.Router();

const Persona = require('../models/persona.js'); 
const path = require('path');

const { authMiddleware } = require("../utils.js")


router.get('/api/punti', authMiddleware, async (req, res) => {
    try {
        const personaLoggata = await Persona.findById(req.user.userId);
        
        if (!personaLoggata) {
            return res.status(404).json({ message: "Utente/Persona non trovato nel database." });
        }
        
        // Controlliamo se è un Amministratore (dal token o dal campo 'type' del discriminator)
        const isAdmin = req.user.role === 'Amministratore' || personaLoggata.type === 'Amministratore';
        
        // Se è admin diamo 1000 monete di default, altrimenti leggiamo i punti dell'utente
        const puntiAttuali = isAdmin ? 1000 : (personaLoggata.currentPoints || 0);
        const puntiTotali = isAdmin ? 1000 : (personaLoggata.totalPoints || 0);
        
        return res.json({ 
            currentPoints: puntiAttuali,
            totalPoints: puntiTotali
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Errore del server" });
    }
});

module.exports = router;