/**
 * Coordina le rotte relative al catalogo dei premi e alla gestione dei coupon riscattabili. 
 * Permette agli utenti di visualizzare i reward disponibili ed effettuare 
 * la transazione per generare il codice a barre o alfanumerico del coupon.
 */

const express = require('express');
const router = express.Router();
const Coupon = require('../models/coupon.js');
const CouponAcquistato = require('../models/couponAcquistato.js'); 
const path = require('path');
const User = require('../models/utente.js')
const { authMiddleware } = require("../utils.js")

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/consult_coupon.html"));
});

router.get("/riscatta", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/use_coupon.html"));
});

// restituisce tutti i coupon
router.get('/api/', authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('attivitaId', 'nomeAttivita posizione') 
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore nel recupero di tutti i coupon' });
  }
});

router.get('/api/acquistati', authMiddleware, async (req, res) => {
  try {
    const acquisti = await CouponAcquistato.find({ utenteId: req.user.userId }).populate('couponId');
    res.status(200).json({ success: true, count: acquisti.length, data: acquisti });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore nel recupero dei coupon acquistati' });
  }
});

// acquista un coupon
router.post('/api/acquista/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!code) {
      return res.status(400).json({ message: "Codice è null" });
    } 

    const coupon = await Coupon.findOne({ codice: code });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon non trovato" });
    }

    if (userRole === 'Amministratore') {
      console.log(`L'admin ${userId} sta acquistando il coupon senza spendere punti.`);
    } else {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: userId,
          currentPoints: { $gte: coupon.costoInPunti }
        },
        {
          $inc: {
            currentPoints: -coupon.costoInPunti
          }
        },
        {
          new: true
        }
      );

      if (!updatedUser) {
        return res.status(400).json({ message: "Punti insufficienti" });
      }
    }
  
    const nuovoAcquisto = new CouponAcquistato({
      utenteId: userId,  
      couponId: coupon._id
    });

    await nuovoAcquisto.save();
    
    return res.status(200).json({ message: "Acquisto completato" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Errore nell'acquisto" });
  }
});

// utilizza un coupon specifico
router.patch('/api/:id/riscatta', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const couponAcquistato = await CouponAcquistato.findById(id).populate('couponId');

    if (!couponAcquistato) {
      return res.status(404).json({ 
        success: false, 
        error: 'Coupon non trovato.' 
      });
    }

    if (couponAcquistato.utenteId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Non sei autorizzato a usare questo coupon.' 
      });
    }

    // verifica se è già stato utilizzato
    if (couponAcquistato.statoUtilizzo === true) {
      return res.status(400).json({ 
        success: false, 
        error: 'Questo coupon è già stato utilizzato.' 
      });
    }

    // verifica se è scaduto
    const dataOdierna = new Date();
    if (couponAcquistato.scadenza && new Date(couponAcquistato.scadenza) < dataOdierna) {
      return res.status(400).json({ 
        success: false, 
        error: 'Questo coupon è scaduto e non è più valido.' 
      });
    }

    couponAcquistato.statoUtilizzo = true;
    await couponAcquistato.save();

    res.status(200).json({ 
      success: true, 
      message: 'Coupon riscattato con successo!',
      data: couponAcquistato 
    });

  } catch (error) {
    console.error("Errore nel riscatto del coupon:", error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore interno del server durante il riscatto del coupon.' 
    });
  }
});

router.get('/api/acquistati/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const acquisto = await CouponAcquistato.findById(id).populate('couponId');
    
    if (!acquisto) {
      return res.status(404).json({ success: false, error: 'Coupon non trovato' });
    }
    
    if (acquisto.utenteId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, error: 'Non autorizzato' });
    }
    
    res.status(200).json({ success: true, data: acquisto });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore nel recupero del coupon' });
  }
});

module.exports = router;