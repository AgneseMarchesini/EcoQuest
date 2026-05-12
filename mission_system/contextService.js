function buildContext(){
    //da fare con i dati del meteo reali, la posizione e l'orario
    //ora facciamo finta sia:
    return {
        weather: "Sole",
        temperature: 24,
        crowdLevel: 0.3,
        timeOfDay: "Pomeriggio",

        userPosition: {
            lat: 46.067,
            lng: 11.121
        }
    };
}

module.exports = buildContext;