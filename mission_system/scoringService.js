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

function computeWeatherScore(template, context) {
    if (template.preferredWeather.includes(context.weather)) {
        return 1;
    }
    else{
        return 0.2;
    }
}

function computeCrowdScore(poi) {
    // da decidere
}

function computeMissionScore(mission, context) {
    const weights = mission.template.scoreWeights;

    const weatherScore = computeWeatherScore(mission.template, context);
    
    const distance = getDistanceInMeters(
        context.userPosition.lat, 
        context.userPosition.lng, 
        mission.poi.lat,  
        mission.poi.lng
    );
    const distanceScore = computeDistanceScore(distance);
    
    const crowdScore = 0.4; //computeCrowdScore(mission.poi);

    const totalScore = (weatherScore * weights.weather) + (distanceScore * weights.distance); // + crowd  

    return totalScore;
}

module.exports = computeMissionScore;