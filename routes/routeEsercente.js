const express = require("express");
const router = express.Router();
const path = require('path');
const Coupon = require("../models/coupon");
const Attivita = require("../models/attivita");

const crypto = require('crypto');

const { authMiddleware, authEsercenteMiddleware, authAdminMiddleware } = require("../utils.js")

router.get("/add_coupon", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/add_coupon.html"));
});

router.post("/add_coupon", authEsercenteMiddleware, async (req, res) => {
    try {
        const couponData = {
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


module.exports = router;
