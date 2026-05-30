const express = require("express");
const router = express.Router();
const path = require('path');
const Coupon = require("../models/coupon");
const Attivita = require("../models/attivita");

const crypto = require('crypto');

const { authMiddleware, authEsercenteMiddleware, authAdminMiddleware } = require("../utils.js")

// pagina per creare un nuovo coupon associato all'attività
router.get("/attivita/:id/nuovo_coupon", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/add_coupon.html"));
});

// dashboard dell'esercente
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/esercente_dashboard.html"));
});

// mostra la pagina di una attività nel dettaglio
router.get("/attivita/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dettaglio_attivita.html"));
});

// pagina per creare una nuova attivita
router.get("/nuova_attivita", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/add_attivita.html"));
});


// api: restituisce le attività dell'esercente loggato
router.get("/api/mie_attivita", authEsercenteMiddleware, async (req, res) => {
    try {
        const attivita = await Attivita.find({ esercenteId: req.user.userId });
        res.status(200).json(attivita);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero delle attività" });
    }
});

// api: restituisce i dettagli dell'attivita e i coupon attivi
router.get("/api/attivita/:id", authEsercenteMiddleware, async (req, res) => {
    try {
        const idAttivita = req.params.id;
        const attivita = await Attivita.findOne({ _id: idAttivita, esercenteId: req.user.userId });
        if (!attivita) {
            return res.status(404).json({ message: "Attività non trovata o non autorizzata." });
        }

        const coupon = await Coupon.find({ attivitaId: idAttivita });
        res.status(200).json({ attivita, coupon });

    } catch (error) {
        res.status(500).json({ message: "Errore nel caricamento dei dati", error: error.message });
    }
});

// crea un nuovo coupon associato all'attività
router.post("/attivita/:id/nuovo_coupon", authEsercenteMiddleware, async (req, res) => {
    try {
        const idAttivita = req.params.id;

        const attivita = await Attivita.findOne({ _id: idAttivita, esercenteId: req.user.userId });
        if (!attivita) {
            return res.status(403).json({ message: "Azione non consentita su questa attività." });
        }

        const couponData = {
            attivitaId: idAttivita,
            titolo: req.body.titolo,
            descrizione: req.body.descrizione,
            costoInPunti: req.body.costoInPunti,
            scadenza: req.body.scadenza,
            categoria: req.body.categoria
        };

        const code = crypto.randomBytes(6).toString('hex').toUpperCase();

        couponData.codice = `COUPON-${code}`;
        
        const nuovoCoupon = await Coupon.create(couponData);

        return res.status(201).json(nuovoCoupon);
    } catch(error) {
        let message = "Errore durante il salvataggio di un coupon";

        if (error.code === 11000) {
            if(error.keyPattern.titolo) {
                return res.status(409).json({
                    message: "Titolo già associato a un altro coupon"
                });
            }

            if(error.keyPattern.codice) {
                return res.status(409).json({
                    message: "Errore Interno: riprovare!"
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

router.post("/nuova_attivita", authEsercenteMiddleware, async (req, res) => {
    try {
        const idEsercente = req.user.userId;

        const nuovaAttivitaData = {
            esercenteId: idEsercente, 
            nomeAttivita: req.body.nomeAttivita,
            descrizione: req.body.descrizione,
            posizione: req.body.posizione,
            orari: req.body.orari,
            categoria: req.body.categoria 
        };
        const nuovaAttivita = await Attivita.create(nuovaAttivitaData);
        await nuovaAttivita.save();
        return res.status(201).json(nuovaAttivita);

    } catch (error) {
        let message = "Errore durante il salvataggio dell'attività";

        if (error.code === 11000 && error.keyPattern.nomeAttivita) {
            return res.status(409).json({
                message: "Esiste già un'attività registrata con questo nome."
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

module.exports = router;
