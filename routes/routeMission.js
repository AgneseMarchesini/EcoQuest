const express = require("express")
const router = express.Router()
const poi = require('../models/POI');
const mission = require('../models/missione');
const path = require('path');
const generateUserMissions = require('../mission_system/missionService');
const { authMiddleware } = require("../utils");
const MissioneUtente = require("../models/missioneUtente.js");

router.get("/getMissions", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/get_missions.html"));
});

async function generaMissioniDinamiche(lat, lng) {
    
    const allPois = await poi.find({});
    if (!allPois || allPois.length === 0) return [];

    const generatedMissions = await generateUserMissions(allPois, lat, lng, 5);

    const missions = generatedMissions.filter(Boolean).map(m => {
        const coordinate = m.poi.coordinate || m.poi.posizione?.coordinates;

        if (!coordinate || coordinate.length !== 2) {
            return null;
        }

        return {
            titolo: m.template.id.replace(/_/g, " "), // Es: da ESPLORA_STORICO a ESPLORA STORICO
            descrizione: m.text,
            arrayPOI: [{ 
                lat: coordinate[1], // indice 1 = latitudine
                lng: coordinate[0]  // indice 0 = longitudine
            }],
            punti: Math.round(m.score * 100), 
            risparmioCO2: 5.0,
            stato: 'DaIniziare',
            predefinita: false
        };
    }).filter(Boolean);

    return missions;
}

router.get('/listaMissioni', authMiddleware, async (req, res) => {
    try {
        const latitudine = parseFloat(req.query.latitudine) || 46.066423;
        const longitudine = parseFloat(req.query.longitudine) || 11.125760;

        const predefinedMissions = await mission.find({ predefinita: true });
        const dynamicMissions = await generaMissioniDinamiche(latitudine, longitudine);

        const missions = [...predefinedMissions, ...dynamicMissions];

        res.status(200).json({
            quantita: missions.length,
            dati: missions
        });
    } catch (error) {
        console.error("Errore nel recupero delle missioni:", error);
        res.status(500).json({
            message: "Errore durante il recupero delle missioni"
        });
    }
});

router.post("/start", authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;
        const { missionId } = req.body;

        // controlla se già avviata
        const existing = await MissioneUtente.findOne({
            userId,
            missionId,
            stato: { $in: ["InCorso", "Completata"] }
        });

        if (existing) {
            return res.status(400).json({
                message: "Missione già avviata"
            });
        }

        const userMission = await MissioneUtente.create({
            userId,
            missionId,
            stato: "InCorso",
            startTime: new Date(),
            currentStep: 0,
            progress: { visitedPOI: [] },
            rewardGiven: false
        });

        res.json(userMission);
    } catch (error) {
        console.error("Errore in /start:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

router.post("/progress", authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;
        const { missionId, poiId } = req.body;

        const userMission = await MissioneUtente.findOne({
            userId,
            missionId,
            stato: "InCorso"
        });

        if (!userMission) {
            return res.status(404).json({ message: "Missione non attiva" });
        }

        // evita duplicati
        if (userMission.progress.visitedPOI.includes(poiId)) {
            return res.json(userMission);
        }

        userMission.progress.visitedPOI.push(poiId);
        userMission.currentStep += 1;

        await userMission.save();

        res.json(userMission);
    } catch (error) {
        console.error("Errore in /progress:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});


router.post("/complete", authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;
        const { missionId } = req.body;

        const userMission = await MissioneUtente.findOne({
            userId,
            missionId,
            stato: "InCorso"
        });

        if (!userMission) {
            return res.status(404).json({ message: "Missione non trovata" });
        }

        userMission.stato = "Completata";
        userMission.endTime = new Date();

        await userMission.save();

        // reward logic
        const mission = await Mission.findById(missionId);

        const reward = mission.punti;

        await User.findByIdAndUpdate(userId, {
            $inc: { punti: reward }
        });

        res.json({
            message: "Missione completata!",
            reward
        });
    } catch (error) {
        console.error("Errore in /complete:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

module.exports = router;
