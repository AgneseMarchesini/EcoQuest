const mongoose = require("mongoose");

const CATEGORIES = ['Cultura', 'Natura', 'Sport', 'Svago', 'Benessere', 'Spettacolo', 'Musica'];

const poiSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    descrizione: {
        type: String,
        required: true
    },
    posizione: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], 
            required: true,
            validate: {
                validator: function(v) {
                    return v.length === 2;
                }, 
                message: "Le coordinate devono contenere esattamente due valori: [Longitudine, Latitudine]"
            }
        }
    },
    urlImmagini: [String],
    categoria: {
        type: [String],
        enum: CATEGORIES,
        required: true,
        validate: [
            {
                validator: function(v) {
                    return v.every(cat => CATEGORIES.includes(cat));
                },
                message: props => `${props.value} contiene categorie non valide!`
            },
            {
                validator: function(v) {
                    return v.length > 0;
                },
                message: "POI deve avere almeno una categoria"
            }
        ]
    },
    meteoCondition: [String]
});


module.exports = mongoose.model("POI", poiSchema);