/**
 * Esporta una funzione helper che unisce un template di missione astratto con un 
 * Punto di Interesse (POI) specifico, rimpiazzando il placeholder "{poi}" con il nome reale del luogo, 
 * restituendo un oggetto formattato con i riferimenti necessari.
 */

function generateMission(template, poi) {

    return {
        text: template.text.replace("{poi}", poi.nome),
        poiId: poi._id,
        templateId: template.id,
        poi,
        template
    };
}

module.exports = generateMission;