const request = require('supertest');
jest.mock('../utils.js', () => ({
    authMiddleware: (req, res, next) => next(),
    authEsercenteMiddleware: (req, res, next) => {
        req.user = { userId: 'idEsercente' }; 
        next();
    },
    authAdminMiddleware: (req, res, next) => next()
}));

const app = require('../app'); 
const mongoose = require('mongoose');
const Coupon = require('../models/coupon');
const Attivita = require('../models/attivita');

const mockToken = "Bearer fittizio_token_jwt_esercente";

const createValidationError = (field, message) => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = { [field]: { message } };
    return error;
};


afterEach(() => {
    jest.restoreAllMocks();
});
afterAll(async () => {
    await mongoose.connection.close();
});
describe('Crea Coupon', () => {
    
    // TC1
    test('1. [Happy Path] Creazione di un coupon inserendo tutti i campi validi', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockResolvedValue({
            _id: 'coupon123',
            codice: 'COUPON-XXXXXX',
            titolo: 'Sconto 10%'
        });

        const payload = {
            titolo: "Sconto 10%",
            descrizione: "Valido a cena",
            costoInPunti: 100,
            scadenza: "2026-12-31",
            categoria: "ScontoPercentuale",
            quantita: 50
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon') 
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(201); 
        expect(res.body).toHaveProperty('codice');
        expect(Attivita.findOne).toHaveBeenCalled();
        expect(Coupon.create).toHaveBeenCalled();
    });

    // TC2
    test('2. [Equivalence] Creazione di un coupon fornendo solo i campi obbligatori (senza descrizione)', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockResolvedValue({
            _id: 'coupon124',
            codice: 'COUPON-YYYYYY',
            titolo: 'Caffè in omaggio'
        });

        const payload = {
            titolo: "Caffè in omaggio",
            costoInPunti: 50,
            scadenza: "2026-12-31",
            categoria: "Omaggio",
            quantita: 10
            // descrizione omessa intenzionalmente
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(201);
        expect(Coupon.create).toHaveBeenCalled();
    });

    // TC3
    test('3. [Boundary Value] Creazione di un coupon con "Costo in Punti" pari a 0', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockResolvedValue({ _id: 'coupon125' });

        const payload = {
            titolo: "Coupon gratuito",
            costoInPunti: 0,
            scadenza: "2026-12-31",
            categoria: "ScontoInDenaro",
            quantita: 100
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(201);
    });

    // TC4
    test('4. [Boundary Value] Creazione fallita: Costo in Punti negativo', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockRejectedValue(createValidationError('costoInPunti', 'Il costo non può essere negativo'));

        const payload = {
            titolo: "Test negativo",
            costoInPunti: -5,
            scadenza: "2026-12-31",
            categoria: "Omaggio",
            quantita: 5
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400); 
        expect(res.body.message[0] || res.body.message).toMatch(/costo/i); 
    });

    // TC5
    test('5. [Error Guessing] Creazione fallita: Titolo mancante', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockRejectedValue(createValidationError('titolo', 'Il titolo è obbligatorio'));

        const payload = {
            costoInPunti: 100,
            scadenza: "2026-12-31",
            categoria: "Omaggio",
            quantita: 10
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400);
    });

    // TC6
    test('6. [Error Guessing] Creazione fallita: Titolo duplicato nel DB', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        
        const mongoDuplicateError = new Error('Duplicate key');
        mongoDuplicateError.code = 11000;
        mongoDuplicateError.keyPattern = { titolo: 1 }; 
        
        jest.spyOn(Coupon, 'create').mockRejectedValue(mongoDuplicateError);

        const payload = {
            titolo: "Sconto 10%",
            costoInPunti: 150,
            scadenza: "2026-12-31",
            categoria: "ScontoPercentuale",
            quantita: 20
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toContain('Titolo già associato a un altro coupon');
    });

    // TC7
    test('7. [Error Guessing] Creazione fallita: Categoria non selezionata', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockRejectedValue(createValidationError('categoria', 'Devi selezionare una categoria'));

        const payload = {
            titolo: "Sconto 50%",
            costoInPunti: 200,
            scadenza: "2026-12-31",
            quantita: 5
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400);
    });

    // TC8
    test('8. [Error Guessing] Creazione fallita: Campo Scadenza non compilato', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockRejectedValue(createValidationError('scadenza', 'La scadenza è obbligatoria'));

        const payload = {
            titolo: "Test scadenza",
            costoInPunti: 20,
            categoria: "Omaggio",
            quantita: 5
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400);
    });

    // TC9
    test('9. [Security] Autorizzazione backend: Tentativo su attività altrui', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue(null);
        jest.spyOn(Coupon, 'create');

        const payload = {
            titolo: "Hacker Attempt",
            costoInPunti: 10,
            scadenza: "2026-12-31",
            categoria: "Omaggio",
            quantita: 5
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/Azione non consentita/i);
        expect(Coupon.create).not.toHaveBeenCalled(); 
    });

    // TC10
    test('10. [Boundary Value] Creazione fallita: Quantità inferiore al minimo consentito', async () => {
        jest.spyOn(Attivita, 'findOne').mockResolvedValue({ _id: 'idAttivita123', esercenteId: 'idEsercente' });
        jest.spyOn(Coupon, 'create').mockRejectedValue(createValidationError('quantita', 'La quantità deve essere almeno 1'));

        const payload = {
            titolo: "Test Quantità 0",
            costoInPunti: 50,
            scadenza: "2026-12-31",
            categoria: "Omaggio",
            quantita: 0
        };

        const res = await request(app)
            .post('/esercente/attivita/idAttivita123/nuovo_coupon')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400);
    });
});

describe('Crea Attività', () => {

    test('1. [Happy Path] Creazione attività con dati validi', async () => {
        const payload = {
            nomeAttivita: "Bar Roma",
            descrizione: "Ottimi caffè",
            posizione: { lat: 41.8902, lng: 12.4922 },
            categoria: "Bar",
            orari: { lun: "Aperto 08:00 - 18:00" }
        };

        jest.spyOn(Attivita, 'create').mockResolvedValue({
            _id: 'attivita123',
            esercenteId: 'idEsercente',
            ...payload,
            save: jest.fn().mockResolvedValue(this)
        });

        const res = await request(app)
            .post('/esercente/nuova_attivita')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.nomeAttivita).toBe("Bar Roma");
        expect(Attivita.create).toHaveBeenCalled();
    });

    test('2. [Error Guessing] Mancata selezione delle coordinate sulla mappa (Errore Validazione)', async () => {
        jest.spyOn(Attivita, 'create').mockRejectedValue(
            createValidationError('posizione', "Seleziona la posizione dell'attivita sulla mappa.")
        );

        const payload = {
            nomeAttivita: "Bar Roma",
            categoria: "Bar",
            descrizione: "Ottimi caffè",
            orari: { lun: "Aperto 08:00 - 18:00" }
        };

        const res = await request(app)
            .post('/esercente/nuova_attivita')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400);
        expect(res.body.message[0] || res.body.message).toContain("Seleziona la posizione dell'attivita sulla mappa.");
    });

    test('3. [Boundary Value] Errore Validazione: Orario di chiusura antecedente all\'apertura', async () => {
        jest.spyOn(Attivita, 'create').mockRejectedValue(
            createValidationError('orari', "L'orario di apertura deve essere precedente alla chiusura.")
        );

        const payload = {
            nomeAttivita: "Bar Roma",
            descrizione: "Ottimi caffè",
            posizione: { lat: 41.8902, lng: 12.4922 },
            categoria: "Bar",
            orari: { 
                lun: "Aperto 18:00 - 10:00"
            }
        };

        const res = await request(app)
            .post('/esercente/nuova_attivita')
            .set('Authorization', mockToken)
            .send(payload);

        expect(res.statusCode).toBe(400);
        expect(res.body.message[0] || res.body.message).toContain("L'orario di apertura deve essere precedente alla chiusura.");
    });
});