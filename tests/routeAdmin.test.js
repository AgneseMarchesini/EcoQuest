const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../utils.js', () => ({
    authMiddleware: (req, res, next) => next(),
    authEsercenteMiddleware: (req, res, next) => next(),
    authAdminMiddleware: (req, res, next) => {
        if (req.headers.authorization === "Bearer token_utente_standard") {
            return res.status(403).json({ message: "Accesso negato: richiesto ruolo Amministratore" });
        }
        req.user = { userId: 'idAdmin', role: 'Amministratore' };
        next();
    }
}));

const app = require('../app');
const Attivita = require('../models/attivita');

const mockTokenAdmin = "Bearer token_admin_valido";
const mockTokenStandard = "Bearer token_utente_standard";

afterEach(() => {
    jest.restoreAllMocks();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Approva Profilo', () => {

    test('1. [Happy Path] Approvazione di una nuova attività', async () => {
        const mockAttivitaApprovata = {
            _id: 'idAttivita123',
            nomeAttivita: 'Ristorante Test',
            statoApprovazione: true
        };

        jest.spyOn(Attivita, 'findByIdAndUpdate').mockResolvedValue(mockAttivitaApprovata);

        const res = await request(app)
            .patch('/admin/api/approvazioni/idAttivita123/approva')
            .set('Authorization', mockTokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Attività approvata con successo!");
        expect(res.body.data.statoApprovazione).toBe(true);
        expect(Attivita.findByIdAndUpdate).toHaveBeenCalledWith(
            'idAttivita123',
            { statoApprovazione: true },
            { new: true }
        );
    });

    test('2. [Happy Path] Eliminazione/Rifiuto di una nuova attività', async () => {
        const mockAttivitaEliminata = {
            _id: 'idAttivita124',
            nomeAttivita: 'Attività Rifiutata'
        };

        jest.spyOn(Attivita, 'findByIdAndDelete').mockResolvedValue(mockAttivitaEliminata);

        const res = await request(app)
            .delete('/admin/api/approvazioni/idAttivita124/rifiuta')
            .set('Authorization', mockTokenAdmin);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Richiesta eliminata con successo!");
        expect(Attivita.findByIdAndDelete).toHaveBeenCalledWith('idAttivita124');
    });

    test('3. [Security] Accesso API non autorizzato per le approvazioni', async () => {
        jest.spyOn(Attivita, 'find');

        const res = await request(app)
            .get('/admin/api/approvazioni')
            .set('Authorization', mockTokenStandard);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain("Accesso negato");
        expect(Attivita.find).not.toHaveBeenCalled();
    });
});