/**
 * Gestisce le rotte API e le operazioni riservate agli amministratori della piattaforma. 
 * Include le funzionalità per la moderazione, l'inserimento manuale di nuovi Punti di Interesse (POI), 
 * la creazione di missioni predefinite globali e la supervisione delle metriche generali del sistema.
 */

const mongoose = require("mongoose");
const express = require("express")
const router = express.Router()
const Persona = require("../models/persona")
const Attivita = require("../models/attivita")
require("../models/amministratore"); 
const POI = require("../models/POI");
const Missione = require("../models/missione")
const jwt = require("jsonwebtoken")
require("dotenv").config();
const path = require("path")

const { authMiddleware, authAdminMiddleware } = require("../utils.js")

router.get("/poi/nuovo", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/add_POI.html"));
});

router.get("/missioni/nuova", (req, res)=>{
    res.sendFile(path.join(__dirname, "../frontend/add_default_mission.html"));
});

router.get("/attivita", (req, res)=>{
    res.sendFile(path.join(__dirname, "../frontend/approve_activity.html"));
});

router.get("/approve_activity", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/approve_activity.html"));
});

router.get("/api/approvazioni", authAdminMiddleware, async (req, res) => {
    try {
        const daApprovare = await Attivita.find({ statoApprovazione: false });
        res.status(200).json(daApprovare);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero delle attività da approvare" });
    }
});

router.patch("/api/approvazioni/:id/approva", authAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const approvata = await Attivita.findByIdAndUpdate(id, { statoApprovazione: true }, { new: true });
        
        if (!approvata) {
            return res.status(404).json({ message: "Attività non trovata" });
        }
        
        res.status(200).json({ message: "Attività approvata con successo!", data: approvata });
    } catch (error) {
        res.status(500).json({ message: "Errore durante l'approvazione dell'attività" });
    }
});

router.delete("/api/approvazioni/:id/rifiuta", authAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const eliminata = await Attivita.findByIdAndDelete(id);
        
        if (!eliminata) {
            return res.status(404).json({ message: "Attività non trovata" });
        }
        
        res.status(200).json({ message: "Richiesta eliminata con successo!" });
    } catch (error) {
        res.status(500).json({ message: "Errore durante l'eliminazione della richiesta" });
    }
});

router.post("/poi", authAdminMiddleware, async (req, res) => {
    try {
        const poiData = {
            nome: req.body.nome,
            descrizione: req.body.descrizione,
            urlImmagini: req.body.urlImmagini,
            meteoCondition: req.body.meteoCondition,
            posizione: {
                type: 'Point',
                coordinates: req.body.posizione.coordinates 
            },
            categoria: req.body.categoria
        };

        const nuovoPOI = await POI.create(poiData);

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

router.post("/missioni", authAdminMiddleware, async (req, res) => {
    try {
        const arrayPOI = Array.isArray(req.body.arrayPOI) ? req.body.arrayPOI : JSON.parse(req.body.arrayPOI);

        const nuovaMissione = await Missione.create({
            titolo: req.body.titolo,
            descrizione: req.body.descrizione,
            punti: req.body.punti,
            stato: req.body.stato,
            predefinita: req.body.predefinita,
            bonusGamification: req.body.bonusGamification,
            risparmioCO2: req.body.risparmioCO2,
            arrayPOI: arrayPOI
        });

        return res.status(201).json(nuovaMissione);
        
    } catch (error) {
        let message = "Errore durante il salvataggio della missione";

        // if (error.code === 11000) {
        //     if(error.keyPattern.percorso) {
        //         return res.status(409).json({
        //             message: "Percorso già associato ad un'altra missione"
        //         });
        //     }
        // }

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


router.patch("/attivita/:attivitaId", authAdminMiddleware, async (req, res) => {
    try {
        const attivitaId = req.params.attivitaId;
        const attivita = await Attivita.findByIdAndUpdate(attivitaId, {
            statoApprovazione: true
        }, {returnDocument: 'after'})
        if (!attivita) {
            return res.status(404).json({message: "Attività inesistente"})
        }
        return res.status(200).json(attivita);
        
    } catch (error) {
        let message = "Errore durante l'approvazione dell'attività";

        return res.status(500).json({
            message,
            error: error.message
        });
    }
})

module.exports = router