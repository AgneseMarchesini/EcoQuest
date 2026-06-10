const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../utils.js', () => ({
    authMiddleware: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "Non autorizzato: token mancante" });
        }
        req.user = { userId: 'idUtenteBase', role: 'Base' };
        next();
    },
    authEsercenteMiddleware: (req, res, next) => next(),
    authAdminMiddleware: (req, res, next) => next()
}));

const app = require('../app');
const MissioneUtente = require('../models/missioneUtente');
const Missione = require('../models/missione');
const Utente = require('../models/utente');

const mockToken = "Bearer fittizio_token_jwt";

afterEach(() => {
    jest.restoreAllMocks();
});
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Sospendi Missione', () => {
    // TC1
    test('1. [Happy Path] Sospensione corretta di una missione in corso', async () => {
        const mockUserMission = { 
            _id: 'mission123', 
            userId: 'idUtenteBase', 
            missionId: 'idMissioneAttiva', 
            stato: 'InCorso', 
            save: jest.fn().mockResolvedValue(true) 
        };
        
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(mockUserMission);

        const res = await request(app)
            .patch('/missioni/api/idMissioneAttiva/sospendi')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Missione sospesa con successo');
        expect(mockUserMission.stato).toBe('InPausa');
        expect(mockUserMission.save).toHaveBeenCalled();
    });

    // TC2
    test('2. [Error Guessing] Tentativo di sospensione di una missione NON in corso', async () => {
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .patch('/missioni/api/idMissioneGiaSospesa/sospendi')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });

    // TC3
    test('3. [Security] Tentativo di sospendere una missione di un altro utente', async () => {
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .patch('/missioni/api/idMissioneUtenteAltrui/sospendi')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });

    // TC4
    test('4. [Security] Sospensione con token assente o non valido', async () => {
        jest.spyOn(MissioneUtente, 'findOne'); 

        const res = await request(app)
            .patch('/missioni/api/idMissioneAttiva/sospendi'); 

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Non autorizzato/i);
        expect(MissioneUtente.findOne).not.toHaveBeenCalled();
    });
});

describe('Annulla Missione', () => {
    // TC1
    test('1. [Happy Path] Annullamento di una missione in stato "InCorso"', async () => {
        jest.spyOn(MissioneUtente, 'findOneAndDelete').mockResolvedValue({
            _id: 'mission123',
            userId: 'idUtenteBase',
            stato: 'InCorso'
        });

        const res = await request(app)
            .delete('/missioni/api/idMissione/annulla')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Missione annullata con successo');
        expect(MissioneUtente.findOneAndDelete).toHaveBeenCalled();
    });

    // TC2
    test('2. [Happy Path] Annullamento di una missione in stato "InPausa"', async () => {
        jest.spyOn(MissioneUtente, 'findOneAndDelete').mockResolvedValue({
            _id: 'mission124',
            userId: 'idUtenteBase',
            stato: 'InPausa'
        });

        const res = await request(app)
            .delete('/missioni/api/idMissionePausa/annulla')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Missione annullata con successo');
    });

    // TC3
    test('3. [Error Guessing] Tentativo forzato di annullare una missione "Completata"', async () => {
        jest.spyOn(MissioneUtente, 'findOneAndDelete').mockResolvedValue(null);

        const res = await request(app)
            .delete('/missioni/api/idMissioneCompletata/annulla')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });

    // TC4
    test('4. [Security] Tentativo di annullare una missione di un altro utente', async () => {
        jest.spyOn(MissioneUtente, 'findOneAndDelete').mockResolvedValue(null);

        const res = await request(app)
            .delete('/missioni/api/idMissioneAltrui/annulla')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });

    // TC5
    test('5. [Security] Annullamento senza token valido nel frontend', async () => {
        jest.spyOn(MissioneUtente, 'findOneAndDelete');

        const res = await request(app)
            .delete('/missioni/api/idMissione/annulla');


        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Non autorizzato/i);
        expect(MissioneUtente.findOneAndDelete).not.toHaveBeenCalled();
    });
});

describe('Completa Missione', () => {
    test('1. [Happy Path] Completamento con successo di una missione attiva', async () => {
        const mockUserMission = {
            _id: 'mission123',
            userId: 'idUtenteBase',
            missionId: 'idMissioneAttiva',
            stato: 'InCorso',
            save: jest.fn().mockResolvedValue(true)
        };

        const mockMissioneDettaglio = {
            _id: 'idMissioneAttiva',
            punti: 100,
            arrayPOI: ['poi1', 'poi2']
        };

        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(mockUserMission);
        jest.spyOn(Missione, 'findById').mockResolvedValue(mockMissioneDettaglio);
        jest.spyOn(Utente, 'findByIdAndUpdate').mockResolvedValue(true);

        const res = await request(app)
            .post('/missioni/api/idMissioneAttiva/completata')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Missione completata!');
        expect(res.body.reward).toBe(100);
        expect(mockUserMission.stato).toBe('Completata');
        expect(mockUserMission.save).toHaveBeenCalled();
        expect(Utente.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('2. [Error Guessing] Tentativo di completamento di una missione già chiusa o inesistente', async () => {
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .post('/missioni/api/idMissioneInesistente/completata')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });

    test('3. [Security] Mancata autorizzazione della chiamata di completamento', async () => {
        jest.spyOn(MissioneUtente, 'findOne');

        const res = await request(app)
            .post('/missioni/api/idMissioneAttiva/completata');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Non autorizzato/i);
        expect(MissioneUtente.findOne).not.toHaveBeenCalled();
    });
});

describe('Riprendi Missione', () => {
    test('1. [Happy Path] Ripristino dello stato di una missione precedentemente messa in pausa', async () => {
        const mockUserMission = { 
            _id: 'mission123', 
            userId: 'idUtenteBase', 
            missionId: 'idMissioneInPausa', 
            stato: 'InPausa', 
            save: jest.fn().mockResolvedValue(true) 
        };
        
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(mockUserMission);

        const res = await request(app)
            .patch('/missioni/api/idMissioneInPausa/riprendi')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Missione ripresa con successo');
        expect(mockUserMission.stato).toBe('InCorso');
        expect(mockUserMission.save).toHaveBeenCalled();
    });

    test('2. [Error Guessing] Tentativo di ripresa di una missione non in pausa', async () => {
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .patch('/missioni/api/idMissioneGiaInCorso/riprendi')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });

    test('3. [Error Guessing] Tentativo di ripresa di una missione non esistente', async () => {
        jest.spyOn(MissioneUtente, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .patch('/missioni/api/idMissioneInesistente/riprendi')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Missione non trovata');
    });
});