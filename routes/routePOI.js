const express = require("express");
const router = express.Router();
const poi = require('../models/POI');

router.get('/puntiVicini', async (req, res)=> {
    try{
        // se il frontend non passa le coordinate usiamo quelle del centro di Trento
        const latitudine = parseFloat(req.query.latitudine) || 46.066423;
        const longitudine = parseFloat(req.query.longitudine) || 11.125760;

        // raggio default = 3km
        const raggioInMetri = parseInt(req.query.raggio) || 3000;

        const nearbyPOIs = await poi.find({
            posizione: {
                $near:{
                    $geometry: {
                        type: "Point",
                        coordinates: [longitudine, latitudine]
                    },
                    $maxDistance : raggioInMetri
                }
            }
        });

        res.status(200).json({
            quantita: nearbyPOIs.length,
            dati: nearbyPOIs
        });
    }
    catch (error){
        console.error("Errore nel recupero dei POI:", error);
        res.status(500).json({
            message: "Errore durante la ricerca geospaziale"
        });
    };
});

module.exports = router;