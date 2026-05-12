const templates = [
    // CULTURA / STORIA
    {
        id: "ESPLORA_STORICO",
        text: "Esplora {poi}",
        requiredTags: ["Storia", "Cultura"],
        preferredWeather: ["Sole", "Nuvoloso"],
        scoreWeights: {
            weather: 0.4,
            distance: 0.3
        }
    },

    {
        id: "SCOPRI_MONUMENTO",
        text: "Scopri la storia di {poi}",
        requiredTags: ["Storia"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.3,
            distance: 0.4
        }
    },

    {
        id: "VISITA_CULTURALE",
        text: "Visita {poi} e scopri qualcosa di nuovo",
        requiredTags: ["Cultura"],
        preferredWeather: ["Sole", "Nuvoloso"],
        scoreWeights: {
            weather: 0.3,
            distance: 0.4
        }
    },

    {
        id: "TOUR_MUSEO",
        text: "Passa 30 minuti a {poi}",
        requiredTags: ["Cultura", "Indoor"],
        preferredWeather: ["Pioggia", "Nuvoloso"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.2
        }
    },

    // NATURA / OUTDOOR
    {
        id: "PASSEGGIATA_PARCO",
        text: "Fai una passeggiata a {poi}",
        requiredTags: ["Natura", "Outdoor"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.3
        }
    },

    {
        id: "RESPIRA_NATURA",
        text: "Goditi un momento nella natura a {poi}",
        requiredTags: ["Natura"],
        preferredWeather: ["Sole", "Nuvoloso", "Neve"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.2
        }
    },

    {
        id: "TRAMONTO_NATURA",
        text: "Guarda il tramonto da {poi}",
        requiredTags: ["Natura", "Outdoor"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.7,
            distance: 0.2
        }
    },

    // SPORT
    {
        id: "ALLENAMENTO_OUTDOOR",
        text: "Allenati a {poi}",
        requiredTags: ["Sport", "Outdoor"],
        preferredWeather: ["Sole", "Nuvoloso"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.4
        }
    },

    {
        id: "SPORT_INDOOR",
        text: "Fai attività fisica a {poi}",
        requiredTags: ["Sport", "Indoor"],
        preferredWeather: ["Pioggia", "Nuvoloso"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.4
        }
    },

    {
        id: "CORSA_PARCO",
        text: "Corri per 15 minuti vicino a {poi}",
        requiredTags: ["Sport", "Natura", "Outdoor"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.6,
            distance: 0.3
        }
    },

    // SVAGO / SPETTACOLO / MUSICA
    {
        id: "SERATA_EVENTO",
        text: "Partecipa a un evento a {poi}",
        requiredTags: ["Spettacolo"],
        preferredWeather: ["Sole", "Nuvoloso"],
        scoreWeights: {
            weather: 0.2,
            distance: 0.3
        }
    },

    {
        id: "MUSICA_LIVE",
        text: "Ascolta musica live a {poi}",
        requiredTags: ["Musica"],
        preferredWeather: ["Pioggia", "Nuvoloso"],
        scoreWeights: {
            weather: 0.3,
            distance: 0.3
        }
    },

    {
        id: "SERATA_SVAGO",
        text: "Divertiti a {poi}",
        requiredTags: ["Svago"],
        preferredWeather: ["Sole", "Nuvoloso", "Pioggia"],
        scoreWeights: {
            weather: 0.2,
            distance: 0.4
        }
    },

    {
        id: "EVENTO_INDOOR",
        text: "Passa la serata a {poi}",
        requiredTags: ["Indoor", "Spettacolo"],
        preferredWeather: ["Pioggia", "Neve"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.2
        }
    },

    // BENESSERE / RELAX
    {
        id: "RELAX_CAFE",
        text: "Rilassati da {poi} per 20 minuti",
        requiredTags: ["Bar", "Indoor"],
        preferredWeather: ["Pioggia"],
        scoreWeights: {
            weather: 0.5,
            distance: 0.3
        }
    },

    {
        id: "PAUSA_BENESSERE",
        text: "Prenditi una pausa a {poi}",
        requiredTags: ["Benessere"],
        preferredWeather: ["Pioggia", "Nuvoloso"],
        scoreWeights: {
            weather: 0.4,
            distance: 0.3
        }
    },

    {
        id: "RELAX_NATURA",
        text: "Riposati immerso nella natura a {poi}",
        requiredTags: ["Benessere", "Natura"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.6,
            distance: 0.2
        }
    },

    // BAR / RISTORANTE
    {
        id: "PAUSA_CAFFE",
        text: "Fermati per un caffè da {poi}",
        requiredTags: ["Bar"],
        preferredWeather: ["Pioggia", "Nuvoloso"],
        scoreWeights: {
            weather: 0.4,
            distance: 0.4
        }
    },

    {
        id: "APERITIVO",
        text: "Concediti un aperitivo da {poi}",
        requiredTags: ["Bar", "Svago"],
        preferredWeather: ["Sole", "Nuvoloso"],
        scoreWeights: {
            weather: 0.3,
            distance: 0.3
        }
    },

    {
        id: "PRANZO_TIPICO",
        text: "Assaggia qualcosa di tipico da {poi}",
        requiredTags: ["Ristorante"],
        preferredWeather: ["Sole", "Pioggia", "Nuvoloso"],
        scoreWeights: {
            weather: 0.2,
            distance: 0.3
        }
    },

    {
        id: "CENA_RELAX",
        text: "Cena con calma da {poi}",
        requiredTags: ["Ristorante", "Indoor"],
        preferredWeather: ["Pioggia"],
        scoreWeights: {
            weather: 0.4,
            distance: 0.2
        }
    },

    // ALTRE COMBINAZIONI 
    {
        id: "GIORNATA_COMPLETA",
        text: "Esplora e rilassati a {poi}",
        requiredTags: ["Cultura", "Svago"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.4,
            distance: 0.2
        }
    },

    {
        id: "AVVENTURA_OUTDOOR",
        text: "Vivi un'avventura a {poi}",
        requiredTags: ["Sport", "Natura", "Outdoor"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.6,
            distance: 0.2
        }
    },

    {
        id: "CULTURA_E_CAFFE",
        text: "Visita {poi} e fai una pausa",
        requiredTags: ["Cultura", "Bar"],
        preferredWeather: ["Nuvoloso"],
        scoreWeights: {
            weather: 0.3,
            distance: 0.4
        }
    },

    {
        id: "SERATA_COMPLETA",
        text: "Passa una serata tra musica e svago a {poi}",
        requiredTags: ["Musica", "Svago"],
        preferredWeather: ["Nuvoloso", "Pioggia"],
        scoreWeights: {
            weather: 0.2,
            distance: 0.3
        }
    },

    {
        id: "PIOGGIA_INDOOR",
        text: "Rifugiati a {poi} durante la pioggia",
        requiredTags: ["Indoor"],
        preferredWeather: ["Pioggia"],
        scoreWeights: {
            weather: 0.7,
            distance: 0.2
        }
    },

    {
        id: "SOLE_OUTDOOR",
        text: "Approfitta del bel tempo a {poi}",
        requiredTags: ["Outdoor"],
        preferredWeather: ["Sole"],
        scoreWeights: {
            weather: 0.7,
            distance: 0.2
        }
    }

];

module.exports = templates;