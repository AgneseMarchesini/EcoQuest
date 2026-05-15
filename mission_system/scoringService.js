function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // raggio della terra in metri
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function computeDistanceScore(distance) {
    return Math.max(0, 1 - distance / 6000);
}

function computeWeatherScore(preferredWeather, context) {
    if (!preferredWeather || preferredWeather.length === 0) return 0.6; //neutro se non specificato
    return preferredWeather.includes(context.weather) ? 1 : 0.2;
}

function computeCrowdScore(poi) {
    // da decidere
}

// per le predefinite
const DEFAULT_WEIGHTS = {
    weather: 0.4,
    distance: 0.6
};

function computeMissionScore(mission, context) {
    // missione PREDEFINITA
    if (mission.predefinita) {
        const weights = DEFAULT_WEIGHTS;
        // Prende le coordinate dal primo POI 
        const primoPoI = mission.arrayPOI?.[0];
        let distanceScore = 0.5;

        if (primoPoI?.lat && primoPoI?.lng) {
            const distance = getDistanceInMeters(
                context.userPosition.lat,
                context.userPosition.lng,
                primoPoI.lat,
                primoPoI.lng
            );
            distanceScore = computeDistanceScore(distance);
        }

        const weatherScore = computeWeatherScore(mission.preferredWeather, context);
        const crowdScore = 0.4; //placeholder

        return (weatherScore * weights.weather) + (distanceScore * weights.distance);
    }

    // missione dinamica
    const weights = mission.template.scoreWeights;
    const coordinate = mission.poi.coordinate || mission.poi.posizione?.coordinates || [];
    const poiLng = coordinate[0];
    const poiLat = coordinate[1];

    const weatherScore = computeWeatherScore(mission.template.preferredWeather, context);
    
    const distance = getDistanceInMeters(
        context.userPosition.lat, 
        context.userPosition.lng, 
        poiLat,
        poiLng
    );
    const distanceScore = computeDistanceScore(distance);
    
    const crowdScore = 0.4; //computeCrowdScore(mission.poi);

    const totalScore = (weatherScore * weights.weather) + (distanceScore * weights.distance); // + crowd  

    return totalScore;
}

module.exports = computeMissionScore;
