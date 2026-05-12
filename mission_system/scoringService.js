function computeDistanceScore(distance) {
    return Math.max(0, 1 - distance / 5000);
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
    // fake per ora
    const distanceScore = 0.8;
    const crowdScore = 0.4; //computeCrowdScore(mission.poi);

    const totalScore = (weatherScore * weights.weather) + (distanceScore * weights.distance); // + crowd  

    return totalScore;
}

module.exports = computeMissionScore;