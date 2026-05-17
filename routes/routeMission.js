const express = require("express")
const router = express.Router()
const poi = require('../models/POI');
const POI = require("../models/POI");
const path = require('path');
const generateUserMissions = require('../mission_system/missionService');
const { authMiddleware } = require("../utils");
const Missione = require('../models/missione');
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

router.get("/get_missions", (req, res) => {
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
    try {
        const userId = getUserId(req);
        const { missionId, missionData } = req.body;
        let missionIdToStart = missionId;

        // 1. Controllo se l'utente ha già una missione attiva
        const activeMission = await getActiveMission(userId);
        if (activeMission) {
            return res.status(409).json({
                message: "Hai già una missione in corso",
                active: activeMission
            });
        }

        // 2. Se è una missione dinamica/generata (senza missionId ma con missionData)
        if (!missionIdToStart && missionData) {
            let rawPOIArray = missionData.arrayPOI;
            let finalPoiIds = [];

            // Parsing di sicurezza se i dati arrivano formattati come stringa
            if (typeof rawPOIArray === 'string') {
                rawPOIArray = JSON.parse(rawPOIArray);
            }
            if (Array.isArray(rawPOIArray) && typeof rawPOIArray[0] === 'string' && rawPOIArray[0].startsWith('[')) {
                rawPOIArray = JSON.parse(rawPOIArray[0]);
            }

            // Trasforma le coordinate {lat, lng} del frontend in veri POI nel database
            for (let item of rawPOIArray) {
                if (item && (item.lat || (item.posizione && item.posizione.coordinates))) {
                    const lat = item.lat || item.posizione.coordinates[1];
                    const lng = item.lng || item.posizione.coordinates[0];

                    const temporaryPOI = await POI.create({
                        nome: `Punto Generato - ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        descrizione: "Punto di interesse generato dinamicamente",
                        posizione: {
                            type: 'Point',
                            coordinates: [lng, lat] // Formato GeoJSON: [Longitudine, Latitudine]
                        },
                        categoria: ['Outdoor'] // Categoria di fallback obbligatoria del tuo schema
                    });

                    finalPoiIds.push(temporaryPOI._id);
                } else {
                    // Se è già un ID stringa valido, lo aggiunge direttamente
                    finalPoiIds.push(item);
                }
            }

            // Nota: se il tuo modello si chiama 'mission' invece di 'Missione', adatta la riga sotto
            const nuovaMissione = await Missione.create({
                arrayPOI: finalPoiIds, // Array pulito di soli ObjectIds!
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

        // 3. Verifica finale sulla presenza del codice missione
        if (!missionIdToStart) {
            return res.status(400).json({
                message: "missionId o missionData mancanti"
            });
        }

        // 4. Controlla se la specifica missione è già stata avviata/completata in precedenza
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

        // 5. Crea la sessione di tracciamento attiva per l'utente (Risolve il problema di visibilità)
        const userMission = await MissioneUtente.create({
            userId,
            missionId: missionIdToStart,
            stato: "InCorso",
            startTime: new Date(),
            currentStep: 0,
            progress: { visitedPOI: [] },
            rewardGiven: false
        });

        // Restituisce l'oggetto di tracciamento atteso dal frontend
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
        const missioneCompletata = await Missione.findById(missionId);

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
