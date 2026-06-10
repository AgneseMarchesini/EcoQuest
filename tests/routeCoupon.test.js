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
const Coupon = require('../models/coupon');
const CouponAcquistato = require('../models/couponAcquistato');
const User = require('../models/utente');

const mockToken = "Bearer fittizio_token_jwt";

afterEach(() => {
    jest.restoreAllMocks();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Acquista Coupon', () => {

    // TC1
    test('1. [Happy Path] Acquisto coupon con punti ampiamente sufficienti', async () => {
        const mockCoupon = { _id: 'coupon123', codice: 'COUPON-ABC', costoInPunti: 100, quantita: 10, save: jest.fn() };
        jest.spyOn(Coupon, 'findOne').mockResolvedValue(mockCoupon);

        jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({ _id: 'idUtenteBase', currentPoints: 400 });

        jest.spyOn(CouponAcquistato.prototype, 'save').mockResolvedValue({});

        const res = await request(app)
            .post('/coupon/api/acquista/COUPON-ABC')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Acquisto completato');
        expect(User.findOneAndUpdate).toHaveBeenCalled();
        expect(mockCoupon.quantita).toBe(9);
        expect(mockCoupon.save).toHaveBeenCalled();
    });

    // TC2
    test('2. [Boundary Value] Acquisto coupon con punti esattamente pari al costo', async () => {
        const mockCoupon = { _id: 'coupon124', codice: 'COUPON-DEF', costoInPunti: 150, quantita: 5, save: jest.fn() };
        jest.spyOn(Coupon, 'findOne').mockResolvedValue(mockCoupon);
        jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({ _id: 'idUtenteBase', currentPoints: 0 });
        jest.spyOn(CouponAcquistato.prototype, 'save').mockResolvedValue({});

        const res = await request(app)
            .post('/coupon/api/acquista/COUPON-DEF')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Acquisto completato');
    });

    // TC3 
    test('3. [Error Guessing] Tentativo acquisto forzato con punti insufficienti (Bypass UI)', async () => {
        const mockCoupon = { _id: 'coupon125', codice: 'COUPON-HIJ', costoInPunti: 100, quantita: 10, save: jest.fn() };
        jest.spyOn(Coupon, 'findOne').mockResolvedValue(mockCoupon);
        jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue(null);
        jest.spyOn(CouponAcquistato.prototype, 'save');
        
        const res = await request(app)
            .post('/coupon/api/acquista/COUPON-HIJ')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Punti insufficienti');
        expect(CouponAcquistato.prototype.save).not.toHaveBeenCalled(); 
    });

    // TC4
    test('4. [Error Guessing] Richiesta acquisto per un coupon inesistente', async () => {
        jest.spyOn(Coupon, 'findOne').mockResolvedValue(null);
        jest.spyOn(User, 'findOneAndUpdate');

        const res = await request(app)
            .post('/coupon/api/acquista/COUPON-GHOST')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Coupon non trovato');
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });

    // TC5 
    test('5. [State] Visualizzazione del coupon appena acquistato nel Portafogli', async () => {
        const mockAcquisti = [{ _id: 'acq1', couponId: { _id: 'coupon123', attivitaId: 'att1' } }];
        jest.spyOn(CouponAcquistato, 'find').mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockAcquisti)
        });

        const res = await request(app)
            .get('/coupon/api/acquistati')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data).toEqual(mockAcquisti);
    });

    // TC6
    test('6. [Security] Autorizzazione: Tentativo di accesso a coupon acquistato da altri', async () => {
        const mockAcquistoAltrui = { 
            _id: 'idAcquisto123', 
            utenteId: 'idUtenteDiverso' 
        };

        jest.spyOn(CouponAcquistato, 'findById').mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockAcquistoAltrui)
        });

        const res = await request(app)
            .get('/coupon/api/acquistati/idAcquisto123')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Non autorizzato');
    });

    // TC7
    test('7. [Security] Chiamata di acquisto non autenticata', async () => {
        jest.spyOn(Coupon, 'findOne');
        const res = await request(app)
            .post('/coupon/api/acquista/COUPON-ABC'); 

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Non autorizzato/i);
        expect(Coupon.findOne).not.toHaveBeenCalled();
    });
});

describe('Consulta Coupon', () => {

    test('1. [Happy Path] Caricamento del Negozio Coupon con almeno un coupon disponibile', async () => {
        const mockCoupons = [
            { 
                _id: 'coupon123', 
                titolo: 'Sconto 10%', 
                quantita: 5, 
                attivitaId: { nomeAttivita: 'Bar Roma', posizione: { lat: 41.8, lng: 12.4 } } 
            },
            { 
                _id: 'coupon124', 
                titolo: 'Caffè in omaggio', 
                quantita: 10, 
                attivitaId: { nomeAttivita: 'Caffetteria Milano', posizione: { lat: 45.4, lng: 9.1 } } 
            }
        ];

        jest.spyOn(Coupon, 'find').mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockCoupons)
            })
        });

        const res = await request(app)
            .get('/coupon/api/')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.data).toEqual(mockCoupons);
        expect(Coupon.find).toHaveBeenCalledWith({ quantita: { $gt: 0 } });
    });

    test('2. [Empty State] Caricamento del Negozio Coupon quando non ci sono coupon disponibili', async () => {
        jest.spyOn(Coupon, 'find').mockReturnValue({
            populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            })
        });

        const res = await request(app)
            .get('/coupon/api/')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(0);
        expect(res.body.data).toEqual([]);
    });

    test('3. [Exception] Errore interno del server durante il recupero dei coupon', async () => {
        jest.spyOn(Coupon, 'find').mockImplementation(() => {
            throw new Error('Database connection failed');
        });

        const res = await request(app)
            .get('/coupon/api/')
            .set('Authorization', mockToken);

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Errore nel recupero di tutti i coupon');
    });

});