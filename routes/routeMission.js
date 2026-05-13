const express = require("express")
const router = express.Router()
const poi = require('../models/POI');
const mission = require('../models/missione');
const path = require('path');
const generateUserMissions = require('../mission_system/missionService');

router.get("/getMissions", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/get_missions.html"));
});

async function generaMissioniDinamiche(lat, lng) {
    // ehi ehi ehi tocca a voi qui
    const allPois = await poi.find({});
    if (!allPois || allPois.length === 0) return [];

    const generatedMissions = await generateUserMissions(allPois, lat, lng, 2);

    const missions = generatedMissions.map(m => {
        return {
            titolo: m.template.id.replace(/_/g, " "), // Es: da ESPLORA_STORICO a ESPLORA STORICO
            descrizione: m.text,
            arrayPOI: [{ 
                lat: m.poi.posizione.coordinates[1], // indice 1 = latitudine
                lng: m.poi.posizione.coordinates[0]  // indice 0 = longitudine
            }],
            punti: Math.round(m.score * 100), 
            risparmioCO2: 5.0,
            stato: 'DaIniziare',
            predefinita: false
        };
    });

    return missions;
}

router.get('/listaMissioni', async (req, res) => {
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

module.exports = router;