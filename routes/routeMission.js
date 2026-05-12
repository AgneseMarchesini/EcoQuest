const express = require("express")
const router = express.Router()
const poi = require('../models/POI');
const mission = require('../models/missione');
const path = require('path');

router.get("/getMissions", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/get_missions.html"));
});

async function generaMissioniDinamiche(lat, lng) {
    // ehi ehi ehi tocca a voi qui

    const mission = {
        titolo: "Sfida del quartiere",
        descrizione: "Raggiungi i punti suggeriti per guadagnare bonus CO2!",
        arrayPOI: [ { lat: lat + 0.001, lng: lng + 0.001 } ],
        punti: 100,
        risparmioCO2: 5.0,
        stato: 'DaIniziare',
        predefinita: false
    };

    return [mission];
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