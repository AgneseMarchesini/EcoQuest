const express = require("express")
const router = express.Router()
const poi = require('../models/POI');
const mission = require('../models/missione');
const path = require('path');
const generateUserMissions = require('../mission_system/missionService');
const { authMiddleware } = require("../utils");
const MissioneUtente = require("../models/missioneUtente.js");
const Utente = require("../models/utente.js");

function getUserId(req) {
    return req.user.userId || req.user.id;
}

async function getActiveMission(userId) {
    const userMission = await MissioneUtente.findOne({
        userId,
        stato: "InCorso"
    }).populate("missionId").lean();

    if (!userMission) {
        return null;
    }

    return {
        userMission,
        mission: userMission.missionId
    };
}

router.get("/getMissions", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/get_missions.html"));
});

router.get("/start_mission", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/start_mission.html"));
});

async function generaMissioni(lat, lng) {
    
    const allPois = await poi.find({});
    if (!allPois || allPois.length === 0) return [];

    const generatedMissions = await generateUserMissions(allPois, lat, lng, 5);

    const missions = generatedMissions.filter(Boolean).map(m => {
        // Predefinita
        if (m.predefinita || !m.poi) {
            return {
                titolo: m.titolo,
                descrizione: m.descrizione,
                arrayPOI: m.arrayPOI,
                punti: m.punti,
                risparmioCO2: m.risparmioCO2 ?? 5.0,
                stato: 'DaIniziare',
                predefinita: true
            };
        }

        // Dinamica
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

        const missions = await generaMissioni(latitudine, longitudine);

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

router.get("/active", authMiddleware, async (req, res) => {
    try {
        const activeMission = await getActiveMission(getUserId(req));

        res.status(200).json({
            active: Boolean(activeMission),
            data: activeMission
        });
    } catch (error) {
        console.error("Errore in /active:", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
});

router.post("/start", authMiddleware, async (req, res) => {
    try{
        const userId = getUserId(req);
        const { missionId, missionData } = req.body;
        let missionIdToStart = missionId;

        const activeMission = await getActiveMission(userId);
        if (activeMission) {
            return res.status(409).json({
                message: "Hai già una missione in corso",
                active: activeMission
            });
        }

        if (!missionIdToStart && missionData) {
            const nuovaMissione = await mission.create({
                arrayPOI: missionData.arrayPOI,
                punti: missionData.punti,
                bonusGamification: missionData.bonusGamification,
                risparmioCO2: missionData.risparmioCO2,
                stato: missionData.stato || "DaIniziare",
                titolo: missionData.titolo,
                descrizione: missionData.descrizione,
                predefinita: false
            });

            missionIdToStart = nuovaMissione._id;
        }

        if (!missionIdToStart) {
            return res.status(400).json({
                message: "missionId o missionData mancanti"
            });
        }

        // controlla se già avviata
        const existing = await MissioneUtente.findOne({
            userId,
            missionId: missionIdToStart,
            stato: { $in: ["InCorso", "Completata"] }
        });

        if (existing) {
            return res.status(400).json({
                message: "Missione già avviata"
            });
        }

        const userMission = await MissioneUtente.create({
            userId,
            missionId: missionIdToStart,
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
        const userId = getUserId(req);
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
        const userId = getUserId(req);
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
        const missioneCompletata = await mission.findById(missionId);

        const reward = missioneCompletata ? missioneCompletata.punti : 0;

        userMission.rewardGiven = true;
        await userMission.save();

        await Utente.findByIdAndUpdate(userId, {
            $inc: {
                currentPoints: reward,
                totalPoints: reward
            }
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
