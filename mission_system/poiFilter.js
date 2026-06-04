/**
 * Esporta una funzione di utilità che filtra una lista di Punti di Interesse (POI) 
 * verificando che siano compatibili con i requisiti di un dato template. Controlla che il POI possieda 
 * tutti i tag richiesti (es. "Cultura", "Outdoor") e scarta i luoghi che superano una certa soglia di affollamento.
 */

function filterCompatiblePOIs(template, pois, context) {
    return pois.filter(poi => {

        const hasRequiredTags = template.requiredTags.every(tag => {
            return poi.categoria && poi.categoria.includes(tag);
        });
        if (!hasRequiredTags) {
            return false;
        }

        if (poi.avgCrowd > 0.9) {
            return false;
        }
        return true;

    });

}

module.exports = filterCompatiblePOIs;
