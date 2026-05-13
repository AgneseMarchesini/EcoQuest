const api_weather_data = require('../external_apis/weather.js'); 
async function buildContext(lat, lng) {
    let weatherData;
    let mappedWeather = "Sole"; // default
    let temperature = 20;

    try {
        weatherData = await api_weather_data();
        if (weatherData && weatherData.label) {
            temperature = weatherData.temperature;
            const label = weatherData.label.toLowerCase();
            
            // DA CONTROLLARE COSA RESTITUISCE L'API
            if (label.includes('nuvoloso') || label.includes('coperto')) mappedWeather = "Nuvoloso";
            else if (label.includes('pioggia') || label.includes('precipitazioni')) mappedWeather = "Pioggia";
            else if (label.includes('neve')) mappedWeather = "Neve";
            else mappedWeather = "Sole"; 
        }
    } catch (error) {
        console.error("Errore nel recupero del meteo, uso dati di default:", error);
    }

    const currentHour = new Date().getHours();
    let timeOfDay = "Mattina";
    if (currentHour >= 12 && currentHour < 18) timeOfDay = "Pomeriggio";
    else if (currentHour >= 18 && currentHour < 22) timeOfDay = "Sera";
    else if (currentHour >= 22 || currentHour < 6) timeOfDay = "Notte";

    return {
        weather: mappedWeather,
        temperature: temperature,
        crowdLevel: 0.3, // DA MODIFCARE
        timeOfDay: timeOfDay,
        userPosition: { lat, lng }
    };
}

module.exports = buildContext;